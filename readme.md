[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![Build Status](https://travis-ci.org/scriptoLLC/couchdown.svg?branch=master)](https://travis-ci.org/scriptoLLC/couchdown)

# CouchDown

A LevelDOWN compliant backend built on top of [Abstract-LevelDOWN](https://github.com/Level/abstract-leveldown) using Apache CouchDB as the backend.

## Installation
`npm i -S couchdown`

## Usage

```js
var levelup = require('levelup')
var CouchDown = require('couchdown')

var db = levelup('http://localhost:5894/db', {db: CouchDown})
```

## CouchDB & JSON

Since CouchDB is a JSON store, non-JSON values will be wrapped in a JSON object transparently for the user. This will add some additional overhead to `#put` and `#del` operations though since it will have to make a `HEAD` request to the server first to find out what the latest version of the document is before it can perform the operation. If you're looking for a very performant way to store non-JSON values, this is likely not the best solution for you.

JSON values, however, are by default, not wrapped.  This means you will receive the `_id` and `_rev` keys when you `#get` objects out of the store. If you provide `{wrapJSON: false}` as an option when you're creating the levelup instance, your JSON will be wrapped by another JSON object, so your data will not be polluted.

## CouchDB & utf16le or ucs2 encoded keys

There are two tests in `encoding.spec.js` that are marked `{skip: true}` -- one for keys that have `keyEncoding: 'utf16le'` and one for keys that have `keyEncoding: 'ucs2'`. Couch does not seem to like these encodings when you get to do an `HTTP GET` request, so they've been commented out.

## TODO
* Implement `AbstractChainedBatch`

## LICENSE
Copyright © 2015 Scripto, Use under the Apache-2.0 license. See LICENSE for details
