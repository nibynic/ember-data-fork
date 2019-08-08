import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Fork from 'ember-data-fork';
import sinon from 'sinon';

module('Unit | Model | Concerns | fork', function(hooks) {
  setupTest(hooks);

  test('it defines fork() shorthand method', async function (assert) {
    let fakeFork = {};
    let wrapStub = sinon.stub(Fork, 'wrap').returns(fakeFork);
    let model = this.owner.lookup('service:store').createRecord('person');

    let result = model.fork();

    assert.equal(result, fakeFork);
    assert.equal(wrapStub.getCall(0).args[0], model);

    wrapStub.restore();
  });
});
