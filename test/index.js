
var assert = require('assert')
var histo = require('../lib/index')
var async = require('async')
var utils = require('../lib/utils')

var organization = {
  dictionary: {
    name: 'LivelyCode',
    _children: ['members', 'projects']
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

var commit1 = [
  {
    path: '/projects/histo',
    data: {
      dictionary: {
        name: 'Histo',
        _children: ['tasks']
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
      dictionary: {
        title: 'Create examples',
        assignee: '/jim',
        due_date: '2013-07-01'
      }
    }
  }, {
    path: '/projects/histo/tasks/2',
    data: {
      dictionary: {
        title: 'Write tests',
        assignee: '/ann',
        due_date: '2013-07-03'
      }
    }
  }
]

var commit2 = [
  {
    path: '/projects/histo',
    data: {
      dictionary: {
        name: 'HistoDB',
        _children: ['tasks']
      }
    }
  }, {
    path: '/projects/histo/tasks/1',
    data: {
      dictionary: {
        title: 'Create examples',
        assignee: '/ann',
        due_date: '2013-07-02'
      }
    }
  }
]

var db = histo.database('test')

var commitResources = function(resources, cb) {
  async.eachSeries(resources, function(each, eachCb) {
    var data = each.data
    var writeData = function() {
      db.put(each.path, each.data, eachCb)
    }
    if (each.data.dictionary) {
      db.get(each.path, function(err, oldRes) {
        if (oldRes) {
          for (var key in oldRes) {
            if (data.dictionary[key] === undefined) data.dictionary[key] = oldRes[key]
          }
        }
        writeData()
      })
    } else {
      writeData()
    }
    
  }, cb)
}

var jimPath = null
var annPath = null

describe('read/write to stage', function() {
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
      assert.equal(utils.getParentPath(res.path), '/members')
      jimPath = res.path
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db.post('/members', ann, function(err, res) {
      assert.equal(utils.getParentPath(res.path), '/members')
      annPath = res.path
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = organization
    db.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = { dictionary: {
      '_children': [
        utils.getLastPathComponent(jimPath),
        utils.getLastPathComponent(annPath)
      ].sort()
    } }
    db.get('/members', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve jim', function(done) {
    db.get(jimPath, function(err, res) {
      assert.deepEqual(res, jim)
      done()
    })
  })
  it('should retrieve ann', function(done) {
    db.get(annPath, function(err, res) {
      assert.deepEqual(res, ann)
      done()
    })
  })
})

describe('committing', function() {
  var head1 = null
  var head2 = null
  it('should commit the current state', function(done) {
    db.commit(function(err, res) {
      assert.ok(res.head)
      head1 = res.head
      done()
    })
  })
  it('should change some existing data and verify its stored', function(done) {
    var jim1 = {
      dictionary: {
        name: 'Jimmy',
      }
    }
    db.put(jimPath, jim1, function() {
      db.get(jimPath, function(err, res) {
        assert.deepEqual(res, jim1)
        done()
      })
    })
  })
  it('should commit the changes', function(done) {
    db.commit(function(err, res) {
      assert.ok(res.head)
      head2 = res.head
      done()
    })
  })
  it('should retrieve the last commit', function(done) {
    var expected = {
      ancestors: [
        head1
      ]
    }
    db.getCommit(head2, function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the ancestor commit', function(done) {
    var expected = {
      ancestors: []
    }
    db.getCommit(head1, function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should commit more data', function(done) {
    async.eachSeries([commit1, commit2], commitResources, done)
  })
})
