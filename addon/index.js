import Fork from './lib/fork';

export default Fork;

export function fork(model, options) {
  return Fork.wrap(model, options);
}
