
var _ = require('underscore')
var url = require('url')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var factory = function (location) { return new MemDOWN(location) }
var stringify = require('canonical-json')
var parse = JSON.parse

var parsePathTokens = function(path) {
  var tokens = path.split('/')
  if ((tokens.length == 2) && (tokens[1] == '')) tokens.pop()
  return tokens
}

var putResource = function(pathTokens, resource, db, cb) {
  var serialized = stringify(resource)
  var hash = computeHash(serialized)
  db.backend.put(hash, serialized)

  var directory = pathTokens.pop()
  if (pathTokens.length > 0) {
    getResource(pathTokens, db.head, db, function(err, parentResource) {
      parentResource[directory] = hash
      putResource(pathTokens, parentResource, db, function(err, res) {
        cb(null, {hash: hash, head: res.head})
      })
    })
  } else {
    cb(null, {head: hash})
  }
}

var getResource = function(pathTokens, root, db, cb) {
  db.backend.get(root, function(err, serializedData) {
    var first = _.first(pathTokens)
    var rest = _.rest(pathTokens)
    var resource = parse(serializedData)
    if (first) {
      getResource(rest, resource[first], db, cb)
    } else {
      cb(null, resource)
    }
  })
}

var Database = function(name) {
  this.name = name
  this.backend = levelup(name, { db: factory })
}

Database.prototype.put = function(path, resource, cb) {
  var that = this
  var pathTokens = parsePathTokens(path)
  putResource(pathTokens, resource, this, function(err, res) {
    that.head = res.head
    cb(null, {hash: res.hash})
  })
}

Database.prototype.get = function(path, cb) {
  getResource(parsePathTokens(path), this.head, this, cb)
}

module.exports = {
  database: function(name) { return new Database(name) }
}
