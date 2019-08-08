import Fork from 'ember-data-fork';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { resolve, reject } from 'rsvp';
import { settled } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import sinon from 'sinon';

module('Unit | Model | Concerns | fork', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.store = this.owner.lookup('service:store');
  });

  test('it wraps all nested models in a fork', async function (assert) {
    let model = this.store.createRecord('person', {
      firstName: 'Jan',
      parent: this.store.createRecord('person', {
        firstName: 'Jack'
      })
    });
    let fork = Fork.wrap(model);

    assert.ok(fork instanceof Fork);
    assert.ok(fork.get('parent') instanceof Fork);
  });

  test('it applies changes on model and saves', async function (assert) {
    let didSave, didFail;
    let model = this.store.createRecord('person', {
      firstName: 'Jan',
      lastName: 'Babranicki',
      save() {}
    });
    let fork = Fork.wrap(model);

    run(() => {
      fork.set('firstName', 'Teofil');
    });

    assert.equal(model.get('firstName'), 'Jan', 'should not apply changes until save');

    model.save = reject;
    fork.save().catch(() => didFail = true);
    await settled();

    assert.equal(model.get('firstName'), 'Jan', 'should not apply changes after failed save');
    assert.ok(fork.get('isDirty'), 'should be marked as dirty');
    assert.ok(didFail, 'should reject save promise');

    model.save = resolve;
    fork.save().then(() => didSave = true);
    await settled();

    assert.equal(model.get('firstName'), 'Teofil', 'should apply changes after successful save');
    assert.notOk(fork.get('isDirty'), 'should be marked as pristine');
    assert.ok(didSave, 'should resolve save promise');

    fork.set('lastName', 'Rogal');
    fork.dismiss();
    assert.notOk(fork.get('isDirty'), 'after rollback should be marked as pristine');
  });

  test('it buffers deleteRecord calls', async function (assert) {
    let model = this.store.createRecord('person', {
      firstName: 'Jan'
    });
    let deleteSpy = sinon.spy(model, 'deleteRecord');
    let fork = Fork.wrap(model);

    assert.notOk(fork.get('isDeleted'));
    assert.notOk(model.get('isDeleted'));

    fork.deleteRecord();

    assert.ok(deleteSpy.notCalled);
    assert.ok(fork.get('isDeleted'));
    assert.notOk(model.get('isDeleted'));

    fork.save();
    await settled();

    assert.ok(deleteSpy.calledOnce);
    assert.ok(fork.get('isDeleted'));
    assert.ok(model.get('isDeleted'));
  });

});
