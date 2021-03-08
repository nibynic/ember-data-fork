import Model, { belongsTo, hasMany } from '@ember-data/model';

export default class Person extends Model {
  @belongsTo('person', { inverse: 'children' })
    parent;
  @hasMany('person', { inverse: 'parent' })
    children;
}
