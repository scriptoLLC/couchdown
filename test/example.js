var levelup = require('levelup')
var db = levelup('http://localhost:5984/example', { db: require('../couch-down') })

db.put('name', 'Yuri Irsenovich Kim')
db.put('dob', '16 February 1941')
db.put('spouse', 'Kim Young-sook')
db.put('occupation', 'Clown')

db.createReadStream()
  .on('data', console.log)
  .on('close', function () { console.log('Show\'s over folks!') })

