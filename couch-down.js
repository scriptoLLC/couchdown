'use strict'

var url = require('url')
var http = require('http')
var util = require('util')
var path = require('path')

var xtend = require('xtend')
var stringify = require('json-stringify-safe')
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN

function CouchDown (location) {
  if (!(this instanceof CouchDown)) {
    return new CouchDown(location)
  }

  AbstractLevelDOWN.call(this, location)
  this._server = url.parse(location)
  this._dbName = this._server.pathname
}

util.inherits(CouchDown, AbstractLevelDOWN)

CouchDown.prototype._request = function (key, method, payload, cb) {
  payload = payload || ''

  if (typeof payload === 'string') {
    try {
      payload = stringify(payload)
    } catch (err) {
      return cb(err)
    }
  }

  var opts = xtend(this._server, {
    method: method,
    headers: {
      'content-type': 'application/json'
    }
  })

  if (key) {
    opts.pathname = path.posix.join(opts.pathname, key)
  }

  if (method === 'POST' || method === 'PUT') {
    opts.headers = {
      'content-length': payload.length
    }
  }

  var req = http.request(opts, function (res) {
    var buf = []
    var err = null

    res.on('data', function (chunk) {
      buf.push(chunk.toString('utf8'))
    })

    res.on('end', function () {
      var body
      try {
        body = JSON.parse(buf.join(''))
      } catch (err) {
        return cb(err)
      }

      if (res.statusCode !== 200 || res.statusCode !== 201) {
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
  this._request(null, 'PUT', null, function (err, json) {
    if (err && err.type === 'file_exists') {
      return cb(null)
    }

    cb(err)
  })
}

CouchDown.prototype._put = function (key, value, options, cb) {
  this._request(key, 'PUT', value, cb)
}

CouchDown.prototype._get = function (key, options, cb) {
  this._request(key, 'GET', null, cb)
}

CouchDown.prototype._del = function (key, options, cb) {
  this._request(key, 'DELETE', null, cb)
}

module.exports = CouchDown
