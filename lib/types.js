
var _ = require('underscore')
var stringify = require('canonical-json')
var parse = JSON.parse

var dictionary = {}

dictionary.serialize = function(resource, oldRes) {
  var mergedResource = {}
  for (key in resource) {
    if (key == '_children') {
      resource[key].forEach(function(child) {
        mergedResource[child] = oldRes[child]
      })
    } else {
      mergedResource[key] = {atom: resource[key]}
    }
  }
  return mergedResource
}

dictionary.deserialize = function(rawResource) {
  var resource = {'_children': []}
  for (key in rawResource) {
    var value = rawResource[key]
    if (value.atom) {
      resource[key] = value.atom
    } else if (value.hash) {
      resource._children.push(key)
    }
  }
  resource._children.sort()
  return resource
}

module.exports = {
  dictionary: dictionary
}