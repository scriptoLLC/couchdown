'use strict'

var _iter = 0

module.exports = function getDB () {
  var prefix = 'test-couchdown' + (new Date()).getTime()
  var dbName = prefix + 'iteration' + ++_iter
  return dbName
}
