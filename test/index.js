
var assert = require('assert')
var histo = require('../lib/index')
var async = require('async')
var utils = require('../lib/utils')

var organization = {
  object: {
    name: 'LivelyCode',
    _children: ['members', 'projects']
  }
}

var jim = {
  object: {
    name: 'Jim',
  }
}

var ann = {
  object: {
    name: 'Ann',
  }
}

var commit1 = {
  hash: null,
  data: [
    {
      path: '/projects/histo',
      data: {
        object: {
          name: 'Histo',
          _children: ['members', 'tasks']
        }
      }
    }, {
      path: '/projects/histo/members',
      data: {
        set: ['jim', 'ann']
      }
    }, {
      path: '/projects/histo/tasks/1',
      data: {
        object: {
          title: 'Create examples',
          assignee: 'jim',
          due_date: '2013-07-01'
        }
      }
    }, {
      path: '/projects/histo/tasks/2',
      data: {
        object: {
          title: 'Write tests',
          assignee: 'ann',
          due_date: '2013-07-03'
        }
      }
    }
  ]
}

var commit2 = {
  hash: null,
  data: [
    {
      path: '/projects/histo',
      data: {
        object: {
          name: 'HistoDB',
          _children: ['members', 'tasks']
        }
      }
    }, {
      path: '/projects/histo/tasks/1',
      data: {
        object: {
          title: 'Create examples',
          assignee: 'ann',
          due_date: '2013-07-02'
        }
      }
    }
  ]
}

var db1 = histo.database(__dirname, 'test')

var commitResources = function(commit, cb) {
  async.eachSeries(commit.data, function(each, eachCb) {
    var data = each.data
    db1.put(each.path, each.data, eachCb)
  }, function() {
    db1.commitUpdates(function(err, res) {
      commit.hash = res.head
      cb()
    })
  })
}

var assertResources = function(commit, cb) {
  async.eachSeries(commit.data, function(each, cb) {
    db1.get(each.path, function(err, res) {
      assert.deepEqual(res, each.data)
      cb()
    })
  }, cb)
}

var commitAndAssertResources = function(resources, cb) {
  commitResources(resources, function() {
    assertResources(resources, cb)
  })
}

var jimPath = null
var annPath = null

before(function(done) {
  db1.open(done)
})

after(function(done) {
  db1.close(function() {
    db1.destroy(done)    
  })
})

describe('read/write to stage', function() {
  it('should write a resource to a specific location', function(done) {
    db1.put('/', organization, done)
  })
  it('should read the resource', function(done) {
    db1.get('/', function(err, res) {
      assert.deepEqual(res, organization)
      done()
    })
  })
  it('should post jim as child resource', function(done) {
    db1.post('/members', jim, function(err, res) {
      assert.equal(utils.getParentPath(res.path), '/members')
      jimPath = res.path
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db1.post('/members', ann, function(err, res) {
      assert.equal(utils.getParentPath(res.path), '/members')
      annPath = res.path
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = organization
    db1.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = { object: {
      '_children': [
        utils.getLastPathComponent(jimPath),
        utils.getLastPathComponent(annPath)
      ].sort()
    } }
    db1.get('/members', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve jim', function(done) {
    db1.get(jimPath, function(err, res) {
      assert.deepEqual(res, jim)
      done()
    })
  })
  it('should retrieve ann', function(done) {
    db1.get(annPath, function(err, res) {
      assert.deepEqual(res, ann)
      done()
    })
  })
})

describe('committing', function() {
  var head1 = null
  var head2 = null

  var jim1 = {
    object: {
      name: 'Jimmy',
    }
  }

  var expectedMembers = function() {
    var jimKey = utils.getLastPathComponent(jimPath)
    var annKey = utils.getLastPathComponent(annPath)
    return {
      object: {'_children': [jimKey, annKey].sort()}
    }
  }

  it('should commit the current state', function(done) {
    db1.commitUpdates(function(err, res) {
      assert.ok(res.head)
      head1 = res.head
      done()
    })
  })
  it('should fetch a committed resource', function(done) {
    db1.get('/members', function(err, res) {
      assert.deepEqual(res, expectedMembers())
      done()
    })
  })
  it('should change some existing data and verify its stored', function(done) {
    db1.put(jimPath, jim1, function() {
      db1.get(jimPath, function(err, res) {
        assert.deepEqual(res, jim1)
        done()
      })
    })
  })
  it('should check the stage only contains changes since the last commit', function(done) {
    var expected = [
      {path: jimPath, resource: jim1},
      {path: '/members', resource: expectedMembers()},
      {path: '/', resource: organization}
    ]
    db1.getUpdatedResources(function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should commit the changes', function(done) {
    db1.commitUpdates(function(err, res) {
      assert.ok(res.head)
      head2 = res.head
      done()
    })
  })
  it('should retrieve the last commit ancestors', function(done) {
    var expected = {
      ancestors: [
        head1
      ]
    }
    db1.getCommitAncestors(head2, function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the ancestor commit', function(done) {
    var expected = {
      ancestors: []
    }
    db1.getCommitAncestors(head1, function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should commit more data', function(done) {
    async.eachSeries([commit1, commit2], commitAndAssertResources, done)
  })
})

var commit3 = {
  hash: null,
  data: [
    {
      path: '/projects/histo/tasks/1',
      data: {
        object: {
          title: 'Create examples',
          assignee: 'ann',
          due_date: '2013-07-03'
        }
      }
    }
  ]
}

var commit4 = {
  hash: null,
  data: [
    {
      path: '/projects/histo',
      data: {
        object: {
          name: 'histo.js',
          _children: ['members', 'tasks']
        }
      }
    }, {
      path: '/projects/histo/tasks/3',
      data: {
        object: {
          title: 'Create website',
          assignee: 'ann',
          due_date: '2013-07-12'
        }
      }
    }
  ]
}

var commit5 = {
  hash: null,
  data: [
    {
      path: '/projects/histo/tasks/4',
      data: {
        object: {
          title: 'Create presentation',
          assignee: 'ann',
          due_date: '2013-07-14'
        }
      }
    }
  ]
}

describe('differencing', function() {
  it('should reset the head to a previous commit', function(done) {
    db1.resetHead(commit1.hash, function(err, res) {
      assert.deepEqual(res.head, commit1.hash)
      done()
    })
  })
  it('should commit some data thereby creating a fork', function(done) {
    async.eachSeries([commit3, commit4], commitAndAssertResources, done)
  })
})


/*

TODO:
- test writes while committing (race condition when resetting stage)

*/
