Ember Data Fork
==============================================================================

[![Build Status](https://travis-ci.org/nibynic/ember-data-fork.svg?branch=master)](https://travis-ci.org/nibynic/ember-data-fork)
[![Maintainability](https://api.codeclimate.com/v1/badges/73f9b98e8181fbe1bf60/maintainability)](https://codeclimate.com/github/nibynic/ember-data-fork/maintainability)
[![npm version](https://badge.fury.io/js/ember-data-fork.svg)](https://badge.fury.io/js/ember-data-fork)

Track Ember Data model changes, accept or reject them with a simple fork interface.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-data-fork
```


Usage
------------------------------------------------------------------------------

Just call `fork()` on your model and then use the returned fork in the same way as
you would use Ember Data models.

```javascript
let model = this.store.findRecord('person', 1);
let fork = model.fork();

fork.set('firstName', 'Lenny');
fork.children.addObject(
  this.store.createRecord('person', {
    firstName: 'Oliver'
  })
);

fork.isDirty; // true

// now you can:
fork.rollback(); // reset to the initial state
fork.apply(); // apply changes on the model
fork.save(); // apply changes and save all changed models
```

### Saving data

When you call `save()` on the fork, it will collect all modified models and save
them in a sequence (starting from the deepest levels of nesting).
If any of these saves fails, Ember Data Fork will try to revert models and fork
to the state from before the save.

### Deleting records

You can call `deleteRecord()` on a fork. This won't delete source model until you
call `save()` on the fork.

```javascript
let model = this.store.findRecord('person', 1);
let fork = model.fork();

fork.deleteRecord();

fork.isDeleted; // true
model.isDeleted; // false

fork.save();

model.isDeleted; // true
```

To revert unsaved deletion just call `rollbackDelete()`.

```javascript
let model = this.store.findRecord('person', 1);
let fork = model.fork();

fork.deleteRecord();

fork.isDeleted; // true
model.isDeleted; // false

fork.rollbackDelete();

fork.isDeleted; // false
model.isDeleted; // false
```

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
