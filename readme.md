[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard) 

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

## TODO
* Implement `AbstractChainedBatch`
* Implement `AbstractIterator`
* More tests