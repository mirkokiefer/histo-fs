
var organization = new Dictionary({
  members: new Dictionary(),
  projects: new Dictionary()
})

db.put('/', Dictionary, organization)

var jim = new Dictionary({
  name: 'jim'
})

db.post('/members', jim)

var project = new Dictionary({
  name: 'My Project',
  members: new Set(),
  tasks_order: new OrderedSet(),
  tasks: new Dictionary()
})

db.post('/projects', project)

var prioritizeBacklog = new Dictionary({
  title: 'Prioritize backlog',
  assignee: jim.uri()
})

db.post(project.uri() + '/tasks', prioritizeBacklog)

db.put(project.uri() + '/tasks_order', [prioritizeBacklog.id()])

db.put(project.uri(), project, function(err, res) {
  // conflict because project has been changed by adding a task
  assert.ok(res.conflict)
})

