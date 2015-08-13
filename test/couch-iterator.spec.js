'use strict'

var http = require('http')

var test = require('tap').test
var level = require('levelup')
var _find = require('lodash.find')

var CouchDown = require('../couch-down')
var populate = require('./populate-couch')
var elements = require('./elements').elements

var prefix = 't' + (new Date()).getTime()
var _dbs = []
var _iter = 0

function getDB () {
  var dbName = prefix + 'test' + ++_iter
  _dbs.push(dbName)
  return dbName
}

test('it streams', function (t) {
  var db = level('http://localhost:5984/' + getDB(), {db: CouchDown, valueEncoding: 'json'})
  var _count = 0
  populate(db, function () {
    db.createReadStream()
      .on('error', function (err) {
        t.bailout(err, 'omg error')
      })
      .on('data', function (data) {
        ++_count
        t.ok(_find(elements, {name: data.value.name}), 'found element')
      })
      .on('end', function () {
        t.equal(_count, elements.length, 'got all the elements')
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
