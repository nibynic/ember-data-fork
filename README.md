Ember Data Fork
==============================================================================

Track Ember Data model changes, accept or reject them with a simple fork interface.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


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

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
