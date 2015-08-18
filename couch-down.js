'use strict'

var url = require('url')
var http = require('http')
var https = require('https')
var util = require('util')

var path = require('path')

if (!path.posix) {
  path = require('./path')
}

var debug = require('debug')('couchdown')
var xtend = require('xtend')
var _findIndex = require('lodash.findindex')
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN

var unwrapValue = require('./unwrap-value')

var CouchIterator = require('./couch-iterator')

var dbRE = /^[a-z]+[a-z0-9_$()+-/]*$/

var httpModules = {
  http: http,
  https: https
}

function CouchDown (location) {
  if (!(this instanceof CouchDown)) {
    return new CouchDown(location)
  }

  var urlParts = url.parse(location)

  if (!urlParts.protocol) {
    throw new Error(location + ' must contain a protocol')
  }

  this.reqModule = httpModules[urlParts.protocol.substr(0, urlParts.protocol.length - 1)]
  var server = url.format({protocol: urlParts.protocol, host: urlParts.host, auth: urlParts.auth})

  var db = urlParts.pathname.substr(1)

  if (!dbRE.test(db)) {
    throw new Error(db + ' contains invalid characters. Please see http://docs.couchdb.org/en/1.6.1/api/database/common.html#put--db')
  }

  AbstractLevelDOWN.call(this, location)
  this._serverURL = server
  this._database = encodeURIComponent(db)
  debug('Server URL', server)
  debug('Database name', db)
}

util.inherits(CouchDown, AbstractLevelDOWN)

CouchDown.prototype._open = function (options, cb) {
  this.valueEncoding = options.valueEncoding
  this.keyEncoding = options.keyEncoding
  this.createIfMissing = options.createIfMissing
  this.errorIfExists = options.errorIfExists
  this.wrapJSON = options.wrapJSON || false
  var self = this

  if (this.keyEncoding === 'ucs2' || this.keyEncoding === 'utf16le') {
    throw new Error(this.keyEncoding + ' does not work with CouchDB, please choose a different encoding')
  }

  this._request(null, 'PUT', null, true, function (err, body) {
    if (err && err.type === 'file_exists') {
      if (self.errorIfExists) {
        debug('Database exists, errorIfExists set though so time to bail')
        return cb(new Error('Database already exists at ' + self._server))
      }
      return cb()
    }

    cb(err)
  })
}

CouchDown.prototype._put = function (key, val, options, cb) {
  var self = this
  var valueEncoding = options.valueEncoding || this.valueEncoding
  var keyEncoding = options.keyEncoding || this.keyEncoding
  key = key.toString(keyEncoding)

  if (valueEncoding === 'json' && !this.wrapJSON) {
    debug('we are not wrapping json objects, so just put the object')
    return this._putWithRev(key, val, cb)
  }

  this._getRev(key, function (err, rev) {
    var valueWrapper = {data: val}
    if (rev) {
      valueWrapper._rev = rev
    }

    debug('_rev retreived from server', rev)
    self._putWithRev(key, valueWrapper, cb)
  })
}

CouchDown.prototype._putWithRev = function (key, value, cb) {
  this._request(key, 'PUT', value, true, function (err, body) {
    if (err) {
      debug('Error in PUT', err, body)
      return cb(err)
    }

    return cb(null)
  })
}

CouchDown.prototype._get = function (key, options, cb) {
  var self = this
  var valueEncoding = options.valueEncoding || this.valueEncoding
  var keyEncoding = options.keyEncoding || this.keyEncoding
  key = key.toString(keyEncoding)

  this._request(key, 'GET', null, false, function (err, body) {
    if (err) {
      debug('Error in GET', body)
      return cb(err)
    }

    unwrapValue(body, valueEncoding, self.wrapJSON, cb)
  })
}

CouchDown.prototype._del = function (key, options, cb) {
  var self = this
  var keyEncoding = options.keyEncoding || this.keyEncoding
  key = key.toString(keyEncoding)

  this._getRev(key, function (err, rev) {
    if (err) {
      debug('Error in getting document revision for delete', err, key, rev)
      return cb(err)
    }

    if (!rev) {
      debug('There is no _rev available for', key)
      return cb(new Error('No _rev available for ' + key))
    }

    var deleteKey = [key, '?rev=', rev].join('')

    self._request(deleteKey, 'DELETE', null, true, function (err, body) {
      if (err) {
        debug('Error in DELETE', err, body)
        return cb(err)
      }
      debug('DELETE complete', body)
      return cb()
    })
  })
}

CouchDown.prototype._batch = function (ops, options, cb) {
  var self = this
  var valueEncoding = options.valueEncoding || this.valueEncoding
  var keyEncoding = options.keyEncoding || this.keyEncoding

  var needRevs = ops
    .filter(function (op) {
      return !op.value._rev
    })
    .map(function (op) {
      return op.key
    })

  var bulkOps = ops.map(function (op) {
    var valEnc = op.valueEncoding || valueEncoding
    var keyEnc = op.keyEncoding || keyEncoding

    if (valEnc !== 'json' || self.wrapJSON) {
      op.value = {data: op.value}
    }

    if (valEnc === 'json' && typeof op.value === 'string') {
      op.value = JSON.parse(op.value)
    }

    var val = xtend({id: op.key.toString(keyEnc)}, op.value)
    if (op.type === 'del') {
      val._deleted = true
    }

    return val
  })

  if (needRevs.length > 0) {
    return this._request('_all_docs', 'POST', {keys: needRevs}, true, function (err, revs) {
      if (err) {
        debug('Unable to get missing _revs on batch op', err)
        return cb(err)
      }

      if (revs.docs) {
        revs.forEach(function (rev) {
          var idx = _findIndex(bulkOps, {_id: rev.key})
          ops[idx]._rev = rev._rev
        })
      }

      self._processBatch(bulkOps, cb)
    })
  }

  this._processBatch(bulkOps, cb)
}

CouchDown.prototype._processBatch = function (ops, cb) {
  var doc = {
    docs: ops,
    all_or_nothing: true
  }

  this._request('_bulk_docs', 'POST', doc, true, function (err) {
    if (err) {
      debug('Unable to batch put', err)
      return cb(err)
    }

    cb()
  })
}

CouchDown.prototype._iterator = function (options) {
  return new CouchIterator(this, options)
}

CouchDown.prototype._request = function (key, method, payload, parseBody, extraHeaders, cb) {
  var server = url.resolve(this._serverURL, this._database)

  if (payload && typeof payload !== 'string') {
    try {
      payload = JSON.stringify(payload)
    } catch (err) {
      debug('Cannot stringify payload', err, payload)
      return cb(err)
    }
  }

  if (typeof extraHeaders === 'function') {
    cb = extraHeaders
    extraHeaders = {}
  }

  if (key) {
    server = url.resolve(this._serverURL, path.posix.join(this._database, key))
  }

  var defaultHeaders = {
    'Content-Type': 'application/json'
  }

  var headers = xtend(defaultHeaders, extraHeaders)

  var opts = xtend(url.parse(server), {
    method: method,
    headers: headers
  })

  debug('Request generated', method, url.format(opts), payload, opts.headers)

  var req = this.reqModule.request(opts, function (res) {
    var buf = []
    var err = null

    res.on('data', function (chunk) {
      buf.push(chunk.toString('utf8'))
    })

    res.on('end', function () {
      var body = buf.join('')
      var etag = ''

      if (parseBody) {
        try {
          body = JSON.parse(body)
        } catch (err) {
          return cb(err)
        }
      }

      if (res.statusCode !== 200 && res.statusCode !== 201) {
        err = new Error(body.reason)
        if (res.status === 404) {
          err.message = 'NotFound'
          err.notFound = true
        }

        err.type = body.error
        err.status = res.statusCode
      }

      if (res.headers.etag) {
        etag = res.headers.etag.replace(/\"/g, '')
      }

      cb(err, body, etag)
    })
  })

  req.end(payload)
}

CouchDown.prototype._getRev = function (key, cb) {
  this._request(key, 'HEAD', null, false, function (err, body, rev) {
    if (err && err.statusCode !== 404) {
      return cb(err)
    }

    cb(null, rev)
  })
}

module.exports = CouchDown
