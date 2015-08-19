var http = require('http')

var opts = {
  protocol: 'http:',
  hostname: 'localhost',
  port: 5984,
  method: 'GET',
  path: '/_all_dbs'
}

var _count = 0

http.request(opts, function (res) {
  var body = []
  res
    .on('data', function (chunk) {
      body.push(chunk.toString('utf8'))
    })
    .on('end', function () {
      var dbList = JSON.parse(body.join('')).filter(function (db) {
        return /^test-couchdown\d{13}iteration\d+$/.test(db)
      })

      if (!dbList.length) {
        return
      }

      var delTestDB = function (db) {
        console.log('deleting', db)
        var opts = {
          protocol: 'http:',
          hostname: 'localhost',
          port: 5984,
          method: 'DELETE',
          path: '/' + db
        }
        http.request(opts, function (res) {
          res.resume()
          if (dbList.length > 0) {
            delTestDB(dbList.pop())
          }
        }).end()
      }
      delTestDB(dbList.pop())
    })
}).end()
