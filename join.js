'use strict'

module.exports = function urlPathJoin () {
  var args = Array.prototype.slice.call(arguments)
  return args.map(function (seg, iter) {
    if (typeof seg !== 'string') {
      throw new Error('Arguments must be strings')
    }

    return iter === 0 && seg[0] === '/' ? '/' + seg.replace(/\//g, '') : seg.replace(/\//g, '')
  }).join('/')
}
