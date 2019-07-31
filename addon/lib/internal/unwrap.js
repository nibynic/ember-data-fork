import { get } from '@ember/object';

export default function unwrap(proxy) {
  if (proxy && 'content' in proxy) {
    return unwrap(get(proxy, 'content'));
  } else {
    return proxy;
  }
}
