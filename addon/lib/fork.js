import { setProperties } from '@ember/object';
import { alias, reads } from '@ember/object/computed';
import { ObjectProxy } from 'ember-deep-buffered-proxy';
import { resolve } from 'rsvp';
import { A } from '@ember/array';
import { assign } from '@ember/polyfills';
import DS from 'ember-data';
import unwrap from './internal/unwrap';

export default ObjectProxy.extend({

  model:    alias('content'),
  isDirty:  reads('dbp.hasChanges'),
  saveableClass: DS.Model,

  save(options = {}) {
    options = assign({ reload: false }, options);

    let changes = this.get('dbp').groupChanges((s) => unwrap(s) instanceof this.saveableClass);
    let models = A(changes.map((c) => unwrap(c.content)));

    let snapshot = this.snapshot();

    this.get('dbp').applyChanges();

    return saveInSequence(models).catch((error) => {
      this.restore(snapshot);
      throw error;
    }).then(() => {
      if (models[0] !== this.get('model') && options.reload) {
        return this.get('model').reload();
      }
    })
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
