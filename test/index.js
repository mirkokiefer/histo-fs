
var assert = require('assert')
var histo = require('../lib/index')

var db = histo.database('test')

var organization = {
  dictionary: {
    name: 'LivelyCode'
  }
}

var jim = {
  dictionary: {
    name: 'Jim',
  }
}

var ann = {
  dictionary: {
    name: 'Ann',
  }
}

var project = {
  dictionary: {
    name: 'Histo'
  }
}

var createExamples = {
  dictionary: {
    title: 'Create examples',
    assignee: '/jim',
    due_date: '2013-07-01'
  }
}

var writeTests = {
  dictionary: {
    title: 'Write tests',
    assignee: '/ann',
    due_date: '2013-07-03'
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
  it('should post jim as child resource', function(done) {
    db.post('/members', jim, function(err, res) {
      assert.deepEqual(res, {
        "path":"/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c"
      })
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db.post('/members', ann, function(err, res) {
      assert.deepEqual(res, {
        "path":"/members/9c37ba065ec42fe4f900b7452b81888ffc04615a"
      })
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = {"dictionary":{
      "name":"LivelyCode",
      "_children": ["members"]
    }}
    db.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = { dictionary: {
      "_children": ['9c37ba065ec42fe4f900b7452b81888ffc04615a', 'ddd0a27f2f483ef3117adb93b0153f5beb3e148c']
    } }
    db.get('/members', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve jim', function(done) {
    db.get('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', function(err, res) {
      assert.deepEqual(res, jim)
      done()
    })
  })
  it('should retrieve ann', function(done) {
    db.get('/members/9c37ba065ec42fe4f900b7452b81888ffc04615a', function(err, res) {
      assert.deepEqual(res, ann)
      done()
    })
  })
})

describe('committing', function() {
  it('should commit the current state', function(done) {
    db.commit(function(err, res) {
      assert.equal(res.head, '9ef55624de09a06cc11d410f70cf3c4e30b4ce73')
      done()
    })
  })
  it('should change some existing data and verify its stored', function(done) {
    var jim1 = {
      dictionary: {
        name: 'Jimmy',
      }
    }
    db.put('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', jim1, function() {
      db.get('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', function(err, res) {
        assert.deepEqual(res, jim1)
        done()
      })
    })
  })
  it('should commit the changes', function(done) {
    db.commit(function(err, res) {
      assert.equal(res.head, '07fb75f63278c746df96db2635acd7c4128a37fc')
      done()
    })
  })
})
