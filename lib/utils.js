
var url = require('url')
var bytewise = require('bytewise')

var parsePathTokens = function(path) {
  var tokens = path.split('/')
  if ((tokens.length == 2) && (tokens[1] == '')) tokens.pop()
  tokens.shift()
  return tokens
}

// serialize path to be lexicographically sortable by depth
var serializePath = function(path) {
  var depth = parsePathTokens(path).length
  return bytewise.encode([depth, path])
}

var deserializePath = function(serializedPath) {
  return bytewise.decode(serializedPath)[1]
}

var getParentPath = function(path) {
  return url.resolve(path, '.') || '/'
}

var getLastPathComponent = function(path) {
  var tokens = path.split('/')
  return tokens[tokens.length - 1]
}

module.exports = {
  parsePathTokens: parsePathTokens,
  serializePath: serializePath,
  deserializePath: deserializePath,
  getParentPath: getParentPath,
  getLastPathComponent: getLastPathComponent
}