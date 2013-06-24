
// '/users/1' is the URN - the URL corresponds to a specific state of the resource.
// The URN points to the position in the hierarchy with a unique ID as the last
// path component.
var jim = dictionary('/users/1', {
  name: 'Jim'
})
var ann = dictionary('/users/2', {
  name: 'Ann'
})

var prioritizeBacklog = dictionary('/projects/3/tasks/4', {
  title: 'Prioritize backlog',
  assignee: urn(jim)
})
var reviewIssues = dictionary('/projects/3/tasks/5', {
  title: 'Review issues',
  assignee: urn(ann)
})
var releasePlanningMembers = set('/projects/3/members', [urn(jim), urn(ann)])
var releasePlanningTasks = orderedDictionary('/projects/3/tasks', {
  '4': url(prioritizeBacklog),
  '5': url(reviewIssues)
})

var releasePlanning = dictionary('/projects/3', {
  name: 'Release Planning',
  members: url(releasePlanningMembers),
  tasks: url(releasePlanningTasks)
})

var organizationProjects = dictionary('/projects', {
  '3': url(releasePlanning)}
})
var organizationMembers = dictionary('/members', {
  '1': url(jim)},
  '2': url(ann)}
})

var organization = dictionary('/', {
  members: url(organizationMembers),
  projects: url(organizationProjects)
})

var commit = {
  ancestors: [url(ancestorCommit)]
  data: url(organization)
}

/*
The URN corresponds to the hierarchy where a structure is embedded.
When updating a structure we have to pass the full path to it - so we know
immediately which parent structures need to be updated as well.
The alternative is to always persist the entire hierarchy.

We need some sort of staging area like git.
So we can make multiple changes without committing every time.

The URLs are the revisions of a structure - kind of like couchdb documents...
The difference to CouchDB is that we can at any time snapshot the state of our data.
Whenever we have an update conflict at a dictionary entry with a hash as its value,
we do a 3-way-merge.
We have to be careful with picking IDs/keys. They should be based on the first version
of a document's hash. This guarantees that no two concurrently created docs pick
the same ID. At the same time it makes sure that if two users create the same
doc concurrently it has the same ID.

Using CouchDB's terminology, each structure corresponds to a document.
Each document is of a data type which has diff and merge semantics associated.
Every change of a document creates a new revision.
Dictionary documents may refer to other document revisions.
If dictionary entries are conflicting we try to resolve them by merging
the referenced documents.
Conflicts on dictionary entries with literal values can obviously not be
resolved this way.

I'd like to have extensible design where developers can add support for new
doc types.
*/

// some more concrete examples:

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



