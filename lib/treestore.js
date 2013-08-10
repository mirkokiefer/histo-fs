
var _ = require('underscore')
var stringify = require('canonical-json')
var parse = JSON.parse
var computeHash = require('sha1')
var utils = require('./utils')
var parsePathTokens = utils.parsePathTokens

var getResourceAtPath = function(pathTokens, root, db, cb) {
  db.contentAddressable.get(root, {asBuffer: false}, function(err, serializedData) {
    if (err) return cb(err)
    var first = _.first(pathTokens)
    var rest = _.rest(pathTokens)
    var resource = parse(serializedData)
    if (first) {
      var child = resource.object[first]
      if (!child) return cb(new Error('child not found'))
      getResourceAtPath(rest, child.hash, db, cb)
    } else {
      cb(null, resource)
    }
  })
}

var TreeStore = function(store) {
  this.contentAddressable = store
}

TreeStore.prototype.put = function(resource, cb) {
  var self = this
  var stringified = stringify(resource)
  var hash = computeHash(stringified)
  console.log('write', hash, resource)
  this.contentAddressable.put(hash, stringified, function() {
    cb(null, {hash: hash})
  })
}

TreeStore.prototype.getPath = function(path, head, cb) {
  var pathTokens = parsePathTokens(path)
  getResourceAtPath(pathTokens, head, this, cb)
}

module.exports = TreeStore
