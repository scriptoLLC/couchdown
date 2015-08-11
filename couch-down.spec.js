'use strict'

var http = require('http')
var test = require('tap').test
var level = require('levelup')
var CouchDown = require('./couch-down')

var prefix = 't' + (new Date()).getTime()
var _dbs = []
var _iter = 0

function getDB () {
  var dbName = prefix + 'test' + ++_iter
  _dbs.push(dbName)
  return dbName
}

test('connecting to a database', function (t) {
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json'}, function (err) {
    t.error(err, 'failed on connecting to db')
    t.ok(db.isOpen(), 'database opened')
    t.end()
  })
})

test('connecting to a db that exists', function (t) {
  var dbName = _dbs[0]
  var db = level('http://localhost:5984/' + dbName, {db: CouchDown, valueEncoding: 'json'}, function (err) {
    t.error(err, 'failed on connecting to existing db')
    t.ok(db.isOpen(), 'database opened')
    t.end()
  })
})

test('putting and deleting', function (t) {
  var key = 'key1'
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in json test')
    db.del(key, function (err) {
      t.error(err, 'failed on get in json test')
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
