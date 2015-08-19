'use strict'

var test = require('tap').test
var joinPath = require('../join')

test('throws on non strings', function (t) {
  t.throws(function () {
    joinPath(null, '', {}, [])
  }, 'throws on non-strings')
  t.end()
})

test('always leaves in leading /', function (t) {
  var out = joinPath('/foo/', '/bar/')
  t.equal(out, '/foo/bar', 'matches')
  t.end()
})

test('strips out multiple /', function (t) {
  var out = joinPath('/////fop//////', '////bar//////')
  t.equal(out, '/fop/bar', 'matches')
  t.end()
})
