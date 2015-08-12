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

test('putting and getting utf8', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'utf8'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put utf8 test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get utf8 test')
      t.equal(val.toString('utf8'), data, 'matching utf8 test')
      t.end()
    })
  })
})

test('putting and getting binary', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'binary'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put binary test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get binary test')
      t.equal(val.toString('binary'), data, 'matching binary test')
      t.end()
    })
  })
})

test('putting and getting ucs2', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'ucs2'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put ucs2 test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get ucs2 test')
      t.equal(val.toString('ucs2'), data, 'matching ucs2 test')
      t.end()
    })
  })
})

test('putting and getting base64', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'base64'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put base64 test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get base64 test')
      t.equal(val.toString('base64'), data, 'matching base64 test')
      t.end()
    })
  })
})

test('putting and getting utf16le', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'utf16le'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put utf16le test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get utf16le test')
      t.equal(val.toString('utf16le'), data, 'matching utf16le test')
      t.end()
    })
  })
})

test('putting and getting hex', function (t) {
  var key = 'key1'
  var val = new Buffer('this is a test')
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'hex'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put hex test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get hex test')
      t.equal(val.toString('hex'), data, 'matching hex test')
      t.end()
    })
  })
})

test('putting and getting json', function (t) {
  var key = 'key1'
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in json test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in json test')
      t.deepEqual(val, data, 'matching json test')
      t.end()
    })
  })
})

test('putting and getting with a hex key', function (t) {
  var key = new Buffer('key1').toString('hex')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'hex', valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in hex key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in hex key test')
      t.deepEqual(val, data, 'matching hex key test')
      t.end()
    })
  })
})

test('putting and getting with a utf8 key', function (t) {
  var key = new Buffer('key1').toString('utf8')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'utf8', valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in utf8 key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in utf8 key test')
      t.deepEqual(val, data, 'matching utf8 key test')
      t.end()
    })
  })
})

test('putting and getting with a base64 key', function (t) {
  var key = new Buffer('key1').toString('base64')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'base64', valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in base64 key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in base64 key test')
      t.deepEqual(val, data, 'matching base64 key test')
      t.end()
    })
  })
})

test('putting and getting with a ascii key', function (t) {
  var key = new Buffer('key1').toString('ascii')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'ascii', valueEncoding: 'json', wrapJSON: true})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in ascii key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in ascii key test')
      t.deepEqual(val, data, 'matching ascii key test')
      t.end()
    })
  })
})

// couch does not like keys in UTF16LE nor UCS2 -- it can PUT just find, but
// cant find the resulting docs:
// both URLs were generated and called identically, minus the method & payload
// [info] [<0.9568.0>] 127.0.0.1 - - PUT /t1439318577692test13/海外で日本語放送を見るには 201
// [info] [<0.9578.0>] 127.0.0.1 - - GET /t1439318577692test13/wg�,�>���ko 404
test('putting and getting with a utf16le key', {skip: true}, function (t) {
  var key = new Buffer('海外で日本語放送を見るには', 'utf16le').toString('utf16le')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'utf16le', valueEncoding: 'json'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in utf16le key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in utf16le key test')
      t.deepEqual(val, data, 'matching utf16le key test')
      t.end()
    })
  })
})

test('putting and getting with a ucs2 key', {skip: true}, function (t) {
  var key = new Buffer('海外で日本語放送を見るには', 'ucs2').toString('ucs2')
  var val = {msg: 'yo this is a test'}
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, keyEncoding: 'ucs2', valueEncoding: 'json'})
  db.put(key, val, function (err) {
    t.error(err, 'failed on put in ucs2 key test')
    db.get(key, function (err, data) {
      t.error(err, 'failed on get in ucs2 key test')
      t.deepEqual(val, data, 'matching ucs2 key test')
      t.end()
    })
  })
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
