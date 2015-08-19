'use strict'

var test = require('tap').test
var level = require('levelup')
var _findIndex = require('lodash.findindex')

var CouchDown = require('../couch-down')
var populate = require('./populate-couch')
var elements = require('./elements').elements
var getDB = require('./get-db-helper')

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
        t.notEqual(_findIndex(elements, {name: data.value.name}), -1, 'found element')
      })
      .on('end', function () {
        t.equal(_count, elements.length, 'got all the elements')
        t.end()
      })
  })
})
