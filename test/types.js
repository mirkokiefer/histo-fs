
var types = require('../lib/types')
var stringify = require('canonical-json')
var assert = require('assert')

var deserialized = {object: {
  name: 'My Company',
  _children: ['members', 'projects']
}}

var hashs = {
  projects: 'a'
}

var serialized = {object: {
  name: {atom: 'My Company'},
  projects: {hash: 'a'},
  members: {hash: null}
}}

var jim = {object: {
  name: {atom: 'Jim'}
}}

var jimDeserialized = {object: {
  name: 'Jim'
}}

var serialized2 = {object: {
  "members":{"hash":null},
  "name":{"atom":"LivelyCode"},
  "projects":{"hash":null}
}}

var deserialized2 = {object: {
  name: 'LivelyCode',
  _children: ['members', 'projects']
}}

describe('serialization', function() {
  it('should serialize a object resource', function() {
    var res = types.object.serialize(deserialized, hashs)
    assert.deepEqual(res, serialized)
  })
  it('should deserialize a object resource', function() {
    var res = types.object.deserialize(serialized)
    assert.deepEqual(res, deserialized)
  })
  it('should omit the _children array if its empty', function() {
    var res = types.object.deserialize(jim)
    assert.deepEqual(res, jimDeserialized)
  })
  it('should test deserialization of multiple children', function() {
    var res = types.object.deserialize(serialized2)
    assert.deepEqual(res, deserialized2)
  })
})
