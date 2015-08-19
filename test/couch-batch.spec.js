'use strict'

var crypto = require('crypto')

var test = require('tap').test
var level = require('levelup')
var _findIndex = require('lodash.findindex')

var CouchDown = require('../couch-down')
var elements = require('./elements').elements
var getDB = require('./get-db-helper')

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
