'use strict'

var http = require('http')
var test = require('tap').test
var level = require('levelup')
var CouchDown = require('../couch-down')

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

test('updating existing record', function (t) {
  var key = 'key2'
  var val = {msg: 'i am a teapot'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'no error on putting')
    val = {msg: 'no you are a sugar bowl'}
    db.put(key, val, function (err) {
      t.error(err, 'no error on putting')
      db.get(key, function (err, body) {
        t.error(err, 'failed to get')
        t.deepEqual(body, val, 'matching values')
        t.end()
      })
    })
  })
})

test('putting and deleting', function (t) {
  var key = 'key1'
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'put first value')
    db.del(key, function (err) {
      t.error(err, 'put second value')
      t.end()
    })
  })
})

test('not wrapping json', function (t) {
  var key = 'jsontest'
  var val = {msg: 'yo this is legit'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json'})
  db.put(key, val, function (err) {
    t.error(err, 'put new value')
    db.get(key, function (err, data) {
      t.error(err, 'got value')
      t.equal(val.msg, data.msg, 'messages match')
      t.ok(data._rev, 'has a _rev attached')
      t.ok(data._id, 'has an _id attached')
      t.end()
    })
  })
})

test('throwing for invalid settings', function (t) {
  t.throws(function () {
    level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'ucs2'})
  }, 'no ucs2 keys')

  t.throws(function () {
    level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'utf16le'})
  }, 'no ut16le keys')

  t.throws(function () {
    level('http://localhost:5984/$1invaliddbname', {db: CouchDown})
  }, 'db names must pass regex')

  t.throws(function () {
    level('myhost/test', {cb: CouchDown})
  }, 'need a protocol to connect to the host')

  t.end()
})

test('teardown', function (t) {
  if (process.env.NODE_ENV !== 'ci') {
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
  } else {
    t.end()
  }

})
