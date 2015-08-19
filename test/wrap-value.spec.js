'use strict'

var test = require('tap').test
var unwrapValue = require('../unwrap-value')

test('bails correctly on bad json', function (t) {
  var body = '{"i am horrible", "json"}'

  unwrapValue(body, 'utf8', false, function (err, data) {
    t.ok(err, 'should error out')
    t.ok(/SyntaxError/.test(err), 'syntax error')
    t.end()
  })
})

test('extracts wrapped json', function (t) {
  var body = '{"data":"{\\"test\\": true}"}'

  unwrapValue(body, 'json', true, function (err, data) {
    t.error(err, 'unwrapped')
    t.deepEqual(JSON.parse(data), {test: true}, 'matching values')
    t.end()
  })
})

test('conversion', function (t) {
  var body = '{"data": "this is a string"}'

  unwrapValue(body, 'utf8', false, function (err, data) {
    t.error(err, 'unwrapped')
    t.equal(data, 'this is a string'.toString('utf8'), 'data unwrapped')
    t.end()
  })
})
