
var assert = require('assert')
var histo = require('../lib/index')

var db = histo.database('test')

var organization = {
  dictionary: {
    name: 'LivelyCode'
  }
}

describe('read/write to database', function() {
  it('should write a resource to a specific location', function(done) {
    db.put('/', organization, done)
  })
  it('should read the resource', function(done) {
    db.get('/', function(err, res) {
      assert.deepEqual(res, organization)
      done()
    })
  })
})