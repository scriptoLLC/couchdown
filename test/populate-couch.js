#!/usr/bin/env node
'use strict'

var crypto = require('crypto')
var elements = require('./elements')

module.exports = function (db, cb) {
  var _curr = 0
  function done () {
    ++_curr
    if (_curr === elements.elements.length) {
      cb()
    }
  }

  elements.elements.forEach(function (element) {
    var key = crypto.randomBytes(20).toString('hex')
    db.put(key, element, done)
  })
}
