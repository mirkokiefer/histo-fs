
extended tree model:

each node can have different types of child sets:
- dictionary (like file system, object, embedded nodes)
- (ordered) sets (object list)
- (ordered) lists (strings, literal lists)

leaf nodes are literals they only have a value as their single "child"


root pointer: hash1

hash1 (dictionary)
id: id0
title: 'my organization'
members: hash2
projects: hash3

hash2 (dictionary)
id1: hash4
id2: hash5

hash4 (dictionary)
id: id1
name: 'Jim'

hash3 (dictionary)
id9: hash14
id10: hash15

hash14 (dictionary)
id: id9
name: 'Sales'
members: hash6
tasks: hash7

hash6 (set)
[id1, id2]

hash7 (ordered dictionary)
id3: hash8
id4: hash9
id10: hash10

hash8 (dictionary)
title: 'call Mike'
dueDate: '2013-07-07'
assignee: id1
comments: hash11

hash11 (dictionary)
id5: hash12
id6: hash13

ok so other objects/resources can only be embedded through dictionaries.
the dictionary keys can be seen as URNs, the values as URLs of a specific version of the URN.
dictionary values can be literals as well to avoid having to generate another hash.

as an example the URN for the sales project is:
/projects/id9
with /hash14 being one version of the resource...

hash6 could be shown inline but we would still have to mark it as being a set.

I think that when querying a resource we should simply be able to request the data until a certain depth.
each value that has its own URI can be queried directly.
so
/projects/id9/name
will work as well!

this gives us a very generic data model which can be a mapping target for a broad range of specialized models.

object URLs are based on where they are logically embedded.
so if we wished to address tasks like this
/tasks/id4
instead of
/projects/id9/tasks/id4
we have to embed id4 directly under the organization level.

Task URLs can still be referenced from other parts of the model.
Embedding is only relevant for differencing and merging of models.

what is now stored separately on the persistence level?
I would say non-literals separately and literals embedded.


Other types:

counter: only has increment/decrement op
spreadsheet/matrix: if modelling through arrays doesnt work (specific merging needs)
what about embedding in spreadsheets? could spreadsheets expose a _children attribute as well?
or can they only reference other objects and not embed?
what about xml/html?
can be modelled through dicts - but what if we want merging strategies across levels?
we would need an actual tree type which defines an entire tree as a resource.
should merging strategies always only work on a per resource level? or can they happen across resources?
I would say they should be tied to the resource type and have only read-only access to other resources - so cross-resource strategies would have to be written in a commutative style.

