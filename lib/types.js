
var _ = require('underscore')
var stringify = require('canonical-json')
var parse = JSON.parse

var dictionary = {}

dictionary.serialize = function(resource, oldRes) {
  resource = resource.dictionary
  oldRes = oldRes ? oldRes.dictionary : {}
  var mergedResource = {}

  for (key in resource) {
    if (key == '_children') {
      resource[key].forEach(function(child) {
        mergedResource[child] = oldRes[child] || {hash: null}
      })
    } else {
      mergedResource[key] = {atom: resource[key]}
    }
  }

  return {dictionary: mergedResource}
}

dictionary.deserialize = function(rawResource) {
  rawResource = rawResource.dictionary
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
  return {dictionary: resource}
}

module.exports = {
  dictionary: dictionary
}