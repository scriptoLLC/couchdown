'use strict'

var debug = require('debug')('couchdown')

module.exports = function unwrapValue (body, encoding, wrapJSON, cb) {
  debug('unwrapping with', encoding, wrapJSON, typeof body)
  if (typeof body === 'string' && encoding !== 'json' || wrapJSON) {
    try {
      body = JSON.parse(body).data
    } catch (err) {
      debug('Failed decoding JSON', err, body)
      return cb(err)
    }
  }

  if (encoding !== 'json' && body) {
    body = new Buffer(body).toString(encoding)
  }

  debug('Returning', body)

  cb(null, body)
}
