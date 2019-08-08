import { computed, setProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { ObjectProxy, ArrayProxy } from 'ember-deep-buffered-proxy';
import { resolve } from 'rsvp';
import { A, isArray } from '@ember/array';
import DS from 'ember-data';
import unwrap from './internal/unwrap';
import { assign } from '@ember/polyfills';

const Fork = ObjectProxy.extend({
  isDirty:  reads('dbp.hasChanges'),

  save() {
    let changes = this.get('dbp').groupChanges((s) => unwrap(s) instanceof DS.Model);
    let models = A(changes.map((c) => unwrap(c.content)));

    let snapshot = this.snapshot();

    this.get('dbp').applyChanges();

    return saveInSequence(models).catch((error) => {
      this.restore(snapshot);
      throw error;
    });
  },

  snapshot() {
    return this.get('dbp').groupChanges((s) => s === this)[0];
  },

  restore(snapshot) {
    setProperties(this.get('content'), snapshot.was);
    setProperties(this, snapshot.is);
  },

  dismiss() {
    this.get('dbp').discardChanges();
  },

  deleteRecord() {
    this.set('markedForDeleteRecord', true);
    this.notifyPropertyChange('markedForDeleteRecord');
  },

  isDeleted: computed('markedForDeleteRecord', 'content.isDeleted', function() {
    return this.get('markedForDeleteRecord') || this.get('content.isDeleted');
  })
}).reopenClass({
  wrap(content, options = {}) {
    return this._super(
      content, assign({
        proxyClassFor(obj) {
          if (obj instanceof DS.Model) {
            return Fork;
          } else {
            return isArray(obj) ? ArrayProxy : ObjectProxy;
          }
        }
      }, options)
    );
  }
});

function saveInSequence(models, i = 0) {
  if (models.length === 0) {
    return resolve();
  } else {
    return models[i].save().then(
      () => i + 1 < models.length ? saveInSequence(models, i + 1) : models[i],
      (error) => { throw error; }
    );
  }
}

export default Fork;