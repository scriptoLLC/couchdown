'use strict'

var url = require('url')
var http = require('http')
var util = require('util')

var debug = require('debug')('couchdown')
var xtend = require('xtend')
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN

// var CouchIterator = require('./couchdown-iterator')
// var CouchBatch = require('./couch-batch')

var dbRE = /^[a-z]+[a-z0-9_$()+-/]*$/

function CouchDown (location) {
  if (!(this instanceof CouchDown)) {
    return new CouchDown(location)
  }

  var urlParts = url.parse(location)

  if (!urlParts.protocol) {
    throw new Error(location + ' must contain a protocol')
  }

  var server = url.format({protocol: urlParts.protocol, host: urlParts.host})
  var db = urlParts.pathname.substr(1)

  if (!dbRE.test(db)) {
    throw new Error(db + ' contains invalid characters. Please see http://docs.couchdb.org/en/1.6.1/api/database/common.html#put--db')
  }

  AbstractLevelDOWN.call(this, location)
  this._server = url.resolve(server, encodeURIComponent(db) + '/')
  debug('Server URL', server)
  debug('Database name', db)
}

util.inherits(CouchDown, AbstractLevelDOWN)

CouchDown.prototype._request = function (key, method, payload, parseBody, extraHeaders, cb) {
  var server = this._server

  if (typeof extraHeaders === 'function') {
    cb = extraHeaders
    extraHeaders = {}
  }

  if (key) {
    server = url.resolve(this._server, key)
  }

  var defaultHeaders = {
    'content-type': 'application/json'
  }

  var headers = xtend(defaultHeaders, extraHeaders)

  var opts = xtend(url.parse(server), {
    method: method,
    header: headers
  })

  debug('Request generated', method, url.format(opts), payload)

  var req = http.request(opts, function (res) {
    var buf = []
    var err = null

    res.on('data', function (chunk) {
      buf.push(chunk.toString('utf8'))
    })

    res.on('end', function () {
      var body = buf.join('')

      if (parseBody) {
        try {
          body = JSON.parse(body)
        } catch (err) {
          return cb(err)
        }
      }

      if (res.statusCode !== 200 && res.statusCode !== 201) {
        err = new Error(body.reason)
        err.type = body.error
        err.code = res.statusCode
      }

      cb(err, body)
    })
  })

  req.end(payload)
}

CouchDown.prototype._open = function (options, cb) {
  this.valueEncoding = options.valueEncoding
  this.keyEncoding = options.keyEncoding
  this.createIfMissing = options.createIfMissing
  this.errorIfExists = options.errorIfExists

  this._request(null, 'PUT', null, true, function (err, body) {
    if (err && err.type === 'file_exists') {
      debug('Database already exists, continuing as normal')
      return cb()
    }

    debug('Open complete', body, err)
    cb(err)
  })
}

CouchDown.prototype._put = function (key, value, options, cb) {
  // wrap the value inside of a JSON object since couch always wants json
  // no matter what we're storing. we do this for valueEncoding: json as well
  // since we don't want to munge existing _id or _rev tags that might exist
  value = JSON.stringify({
    data: value
  })

  key = key.toString(this.keyEncoding)

  this._request(key, 'PUT', value, true, function (err, body) {
    if (err) {
      debug('Error in PUT', err, body)
      return cb(err)
    }
    debug('PUT complete', body)
    return cb()
  })
}

CouchDown.prototype._get = function (key, options, cb) {
  var self = this

  key = key.toString(this.keyEncoding)

  this._request(key, 'GET', null, false, function (err, body) {
    if (err) {
      debug('Error in GET', body)
      return cb(err)
    }
    debug('GET complete', body)

    try {
      body = JSON.parse(body).data
    } catch (err) {
      debug('Failed decoding JSON', err, body)
      return cb(err)
    }

    if (self.valueEncoding !== 'json') {
      body = new Buffer(body).toString(self.valueEncoding)
    }

    return cb(null, body)
  })
}

CouchDown.prototype._del = function (key, options, cb) {
  var self = this
  key = key.toString(this.keyEncoding)
  this._request(key, 'GET', null, true, function (err, doc) {
    if (err) {
      debug('Error in getting document revision for delete', err, key, doc)
      return cb(err)
    }

    if (!doc._rev) {
      debug('There is no _rev available for', key, doc)
      return cb(new Error('No _rev available for ' + key))
    }

    var deleteKey = [key, '?rev=', doc._rev].join('')

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

module.exports = CouchDown
