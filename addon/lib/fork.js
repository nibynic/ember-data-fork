import { setProperties } from '@ember/object';
import { reads, or } from '@ember/object/computed';
import { ObjectProxy, ArrayProxy } from 'ember-deep-buffered-proxy';
import { resolve } from 'rsvp';
import { A, isArray } from '@ember/array';
import Model from '@ember-data/model';
import { assign } from '@ember/polyfills';
import { assert } from '@ember/debug';
import EmberObjectProxy from '@ember/object/proxy';

const Fork = ObjectProxy.extend({
  isDirty:  reads('dbp.hasChanges'),

  save() {
    let changes = this.get('dbp').groupChanges((s) => unwrap(s) instanceof Model);
    let models = A(changes.map((c) => unwrap(c.content)));

    let snapshot = this.snapshot();

    this.apply();

    return saveInSequence(models).catch((error) => {
      this.restore(snapshot);
      throw error;
    });
  },

  snapshot() {
    return this.get('dbp').groupChanges((s) => s === this)[0];
  },

  restore(snapshot) {
    setProperties(this.get('dbp.content'), flatten(snapshot.was));
    setProperties(this, flatten(snapshot.is));
  },

  apply() {
    this.get('dbp').applyChanges();
  },

  rollback() {
    this.get('dbp').discardChanges();
  },

  deleteRecord() {
    this.set('markedForDeleteRecord', true);
    this.notifyPropertyChange('markedForDeleteRecord');
  },

  isDeleted: or('markedForDeleteRecord', 'dbp.content.isDeleted'),

  rollbackDelete() {
    assert('cannot rollback delete, model is already deleted', !this.get('dbp.content.isDeleted'));
    this.set('markedForDeleteRecord', false);
    this.notifyPropertyChange('markedForDeleteRecord');
  }
}).reopenClass({
  wrap(content, options = {}) {
    let proxy = this._super(
      content, assign({
        proxyClassFor(obj) {
          if (unwrap(obj) instanceof Model) {
            return Fork;
          } else {
            return isArray(unwrap(obj)) ? ArrayProxy : ObjectProxy;
          }
        }
      }, options)
    );
    if (proxy.get('isNew')) {
      proxy.set('forkIsNew', true);
    }
    return proxy;
  }
});

function unwrap(obj) {
  if (obj && obj instanceof EmberObjectProxy) {
    return unwrap(obj.content);
  } else {
    return obj;
  }
}

function flatten(source, prefix, target = {}) {
  for (let key in source) {
    let value = source[key];
    let path =  A([prefix, key]).compact().join('.');
    if (isArray(value)) {
      target[path] = value;
    }
    if (value instanceof Object && !(value instanceof Model)) {
      flatten(value, path, target);
    } else {
      target[path] = value;
    }
  }
  return target;
}

async function saveInSequence(models, i = 0) {
  if (models.length > 0) {
    await models[i].save();
    if (i + 1 < models.length) {
      return await saveInSequence(models, i + 1);
    } else {
      return models[i];
    }
  }
}

export default Fork;
