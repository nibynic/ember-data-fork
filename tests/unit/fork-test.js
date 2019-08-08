import EmberObject from '@ember/object';
import Fork from 'ember-data-fork';
import { module, test } from 'qunit';
import { resolve, reject } from 'rsvp';
import { settled } from '@ember/test-helpers';
import { run } from '@ember/runloop';

module('Unit | Model | Concerns | fork', function() {

  test('it applies changes on model and saves', async function (assert) {
    let didSave, didFail;
    let model = EmberObject.create({
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
});
