import Fork, { fork } from 'ember-data-fork';
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
    this.model = this.store.createRecord('person', {
      firstName: 'Jan',
      parent: this.store.createRecord('person', {
        firstName: 'Jack'
      })
    });
    this.fork = Fork.wrap(this.model);
  });

  test('it wraps all nested models in a fork', async function (assert) {
    assert.ok(this.fork instanceof Fork);
    assert.ok(this.fork.get('parent') instanceof Fork);
  });

  test('it provides fork() helper method', async function(assert) {
    this.fork = fork(this.model);

    assert.ok(this.fork instanceof Fork);
    assert.ok(this.fork.get('parent') instanceof Fork);
  });

  module('new records', function() {
    test('it marks new records as dirty', async function (assert) {
      assert.ok(this.fork.get('isDirty'));
    });
  });

  module('persisted records', function(hooks) {
    hooks.beforeEach(function() {
      sinon.stub(this.model, 'isNew').value(false);
    });

    test('it applies changes', async function (assert) {
      run(() => {
        this.fork.set('firstName', 'Teofil');
      });

      assert.equal(this.model.get('firstName'), 'Jan');
      assert.ok(this.fork.get('isDirty'));

      this.fork.apply();

      assert.equal(this.model.get('firstName'), 'Teofil');
      assert.notOk(this.fork.get('isDirty'));
    });

    test('it rolls back changes', async function (assert) {
      run(() => {
        this.fork.set('firstName', 'Teofil');
      });

      this.fork.rollback();

      assert.equal(this.fork.get('firstName'), 'Jan');
      assert.notOk(this.fork.get('isDirty'));
    });
  });

  module('saving', function() {
    test('it saves all changed records', async function (assert) {
      let modelSave = sinon.stub(this.model, 'save').returns(resolve());
      let parentSave = sinon.stub(this.model.parent, 'save').returns(resolve());

      run(() => {
        this.fork.set('firstName', 'Teofil');
        this.fork.set('parent.firstName', 'Bruce');
      });

      this.fork.save().then(
        () => assert.ok(true, 'should resolve'),
        () => assert.ok(false)
      );
      await settled();

      assert.ok(modelSave.calledOnce);
      assert.ok(parentSave.calledOnce);
      assert.equal(this.model.get('firstName'), 'Teofil');
      assert.equal(this.model.parent.get('firstName'), 'Bruce');
      assert.notOk(this.fork.get('isDirty'));
    });

    test('if save fails it reverts to pre-save state', async function (assert) {
      sinon.stub(this.model, 'save').returns(resolve());
      sinon.stub(this.model.parent, 'save').returns(reject());
      run(() => {
        this.fork.set('firstName', 'Teofil');
        this.fork.set('parent.firstName', 'Bruce');
      });

      this.fork.save().then(
        () => assert.ok(false),
        () => assert.ok(true, 'should reject')
      );
      await settled();

      assert.equal(this.model.get('firstName'), 'Jan');
      assert.equal(this.model.get('parent.firstName'), 'Jack');
      assert.ok(this.fork.get('isDirty'));
    });
  });

  module('deleting', function() {
    test('it buffers deleteRecord calls', function (assert) {
      let deleteSpy = sinon.spy(this.model, 'deleteRecord');

      assert.notOk(this.fork.get('isDeleted'));
      assert.notOk(this.model.get('isDeleted'));

      this.fork.deleteRecord();

      assert.ok(deleteSpy.notCalled);
      assert.ok(this.fork.get('isDeleted'));
      assert.notOk(this.model.get('isDeleted'));

      this.fork.apply();

      assert.ok(deleteSpy.calledOnce);
      assert.ok(this.fork.get('isDeleted'));
      assert.ok(this.model.get('isDeleted'));
    });

    test('it rolls back deletion', function (assert) {
      this.fork.deleteRecord();
      this.fork.rollbackDelete();

      assert.notOk(this.fork.get('isDeleted'));
      assert.notOk(this.model.get('isDeleted'));
    });

    test('deletion cannot be rolled back if model is already deleted', function (assert) {
      this.fork.deleteRecord();
      this.fork.apply();

      assert.throws(
        () => this.fork.rollbackDelete(),
        /cannot rollback delete/
      );

      assert.ok(this.fork.get('isDeleted'));
      assert.ok(this.model.get('isDeleted'));
    });
  });



});
