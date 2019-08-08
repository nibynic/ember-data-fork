import DS from 'ember-data';
import Fork from './fork';

export default function() {
  DS.Model.reopen({
    fork() {
      return Fork.wrap(this);
    }
  });
}
