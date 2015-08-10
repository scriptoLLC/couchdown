'use strict'

var test = require('tap').test
var level = require('levelup')
var CouchDown = require('./couch-down')

test('connecting to a database', function (t) {
  var db = level('http://localhost:5984/test1', {db: CouchDown}, function (err) {
    t.notOk(!!err, 'no errors')
    t.ok(db.isOpen(), 'database opened')
    t.end()
  })
})
