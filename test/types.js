
var types = require('../lib/types')
var stringify = require('canonical-json')
var assert = require('assert')

var deserialized = {dictionary: {
  name: 'My Company',
  _children: ['members', 'projects']
}}

var ancestor = {dictionary: {
  name: {atom: 'Test'},
  projects: {hash: 'a'},
  members: {hash: 'b'}
}}

var serialized = {dictionary: {
  name: {atom: 'My Company'},
  projects: {hash: 'a'},
  members: {hash: 'b'}
}}

describe('serialization', function() {
  it('should serialize a dictionary resource', function() {
    var res = types.dictionary.serialize(deserialized, ancestor)
    assert.deepEqual(res, serialized)
  })
  it('should deserialize a dictionary resource', function() {
    var res = types.dictionary.deserialize(serialized)
    assert.deepEqual(res, deserialized)
  })
})