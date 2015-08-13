'use strict'

var http = require('http')
var crypto = require('crypto')

var test = require('tap').test
var level = require('levelup')
var _findIndex = require('lodash.findindex')

var CouchDown = require('../couch-down')
var elements = require('./elements').elements

var prefix = 't' + (new Date()).getTime()
var _dbs = []
var _iter = 0

function getDB () {
  var dbName = prefix + 'test' + ++_iter
  _dbs.push(dbName)
  return dbName
}

test('it batches', function (t) {
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json'})
  var _count = 0
  var ops = elements.map(function (element) {
    return {type: 'put', key: crypto.randomBytes(20).toString('hex'), value: element}
  })
  db.batch(ops, function (err) {
    t.error(err, 'completed batch op')
    db.createReadStream()
      .on('error', function (err) {
        t.bailout(err, 'got an error, bailing')
      })
      .on('data', function (data) {
        ++_count
        t.notEqual(_findIndex(elements, {name: data.value.name}), -1, 'found element')
      })
      .on('end', function () {
        t.equal(ops.length, _count, 'inserted what we wanted')
        t.end()
      })
  })
})

test('teardown', function (t) {
  var opts = {
    protocol: 'http:',
    hostname: 'localhost',
    port: 5984,
    method: 'DELETE'
  }
  var _count = 0

  var done = function () {
    if (_count === _dbs.length) {
      t.end()
    }
  }

  _dbs.forEach(function (db) {
    opts.path = '/' + db

    var req = http.request(opts, function (res) {
      _count++
      var body = []
      if (res.statusCode !== 200) {
        res.on('data', function (c) {
          body.push(c.toString())
        })
        res.on('end', function () {
          t.ok(false, 'Error deleting ' + db + ' ' + body.join(''))
          done()
        })
      } else {
        t.ok()
        done()
      }
    })
    req.end()
  })
  t.end()
})
