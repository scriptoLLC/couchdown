#!/usr/bin/env node
'use strict'

var crypto = require('crypto')
var elements = require('./elements')

module.exports = function (db, cb) {
  var els = elements.elements.map(function (element) {
    return {
      op: 'put',
      key: crypto.randomBytes(20).toString('hex'),
      value: element
    }
  })

  db.batch(els, cb)
}
