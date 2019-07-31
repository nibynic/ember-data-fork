import EmberObject from '@ember/object';
import Fork from 'ember-data-fork';
import { module, test } from 'qunit';
import { resolve, reject } from 'rsvp';
import { settled } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import sinon from 'sinon';

module('Unit | Model | Concerns | fork', function() {

  test('it applies changes on model and saves', async function (assert) {
    let didSave, didFail;
    let model = EmberObject.create({
      firstName: 'Jan',
      lastName: 'Babranicki',
      save() {}
    });
    let fork = Fork.create({
      model: model
    });

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

  test('it reloads main model if { reload: true } is passed', async function (assert) {
    let save = sinon.stub().returns(resolve());
    let reload = sinon.stub().returns(resolve());

    const Model = EmberObject.extend();
    let phoneNumber = Model.create({
      number: '+48111111111',
      save
    });
    let model = EmberObject.create({
      phoneNumbers: [phoneNumber],
      reload,
      save() {}
    });
    let fork = Fork.create({
      model: model,
      saveableClass: Model
    });

    run(() => {
      fork.get('phoneNumbers.firstObject').set('number', '+48222222222');
    });

    fork.save({ reload: true });
    await settled();

    assert.ok(save.calledOnce);
    assert.ok(reload.calledOnce);
  });
});
