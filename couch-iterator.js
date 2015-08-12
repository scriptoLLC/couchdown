'use strict'

var util = require('util')
var querystring = require('querystring')

var debug = require('debug')('couchdown')
var AbstractIterator = require('abstract-leveldown').AbstractIterator

var unwrapValue = require('./unwrap-value')

function CouchIterator (db, options) {
  AbstractIterator.call(this, db)
  var self = this
  var viewOpts = {
    endkey: options.end || options.gte || options.gt,
    startkey: options.start || options.lte || options.lt,
    skip: options.start,
    descending: options.reverse || false,
    limit: options.limit === -1 ? undefined : options.limit,
    include_end: !!options.gte || undefined,
    include_docs: options.values || false
  }

  if (options.lt) {
    options.skip = options.skip ? options.skip + 1 : 1
  }
  this.includeValues = options.values
  this.includeKeys = options.keys
  this.keyEncoding = options.keyEncoding || db.keyEncoding
  this.valueEncoding = options.valueEncoding || db.valueEncoding
  this.wrapJSON = db.wrapJSON
  this.opts = Object.keys(viewOpts).reduce(function (a, key) {
    if (typeof viewOpts[key] !== 'undefined') {
      a[key] = typeof viewOpts[key] === 'string' ? '"' + viewOpts[key] + '"' : viewOpts[key]
    }
    return a
  }, {})
  this.key = '_all_docs?' + querystring.stringify(this.opts)
  this._queryComplete = false
  this.queryCallbacks = []
  this._curr = 0
  this._initialError

  db._request(this.key, 'GET', null, true, function (err, body) {

    var runCallbacks = function () {
      self._queryComplete = true
      self.queryCallbacks.forEach(function (cb) {
        if (typeof cb === 'function') {
          cb()
        }
      })
    }

    if (err) {
      debug('Errored out on _all_docs call', err)
      self._initialError = err
      return runCallbacks()
    }

    debug('Total rows received', body.total_rows)
    self._rows = body.rows
    runCallbacks()
  })
}

util.inherits(CouchIterator, AbstractIterator)

CouchIterator.prototype._next = function (cb) {
  var self = this

  var queryComplete = function () {
    if (self._initialError) {
      return cb(self._initialError)
    }

    if (self._curr === self._rows.length || self._curr < 0) {
      return cb()
    }

    var row = self._rows[self._curr]
    var key = row.key.toString(self.keyEncoding)
    self._curr++

    unwrapValue(row.doc, self.valueEncoding, self.wrapJSON, function (err, body) {
      // levelup really wants to parse the JSON itself. Which is a pain.
      if (self.valueEncoding === 'json') {
        body = JSON.stringify(body)
      }

      cb(err, key, body)
    })
  }

  if (!this._queryComplete) {
    self.queryCallbacks.push(queryComplete)
  } else {
    queryComplete()
  }
}

CouchIterator.prototype._end = function (cb) {
  return cb()
}

module.exports = CouchIterator
