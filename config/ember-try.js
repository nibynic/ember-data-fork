'use strict';

module.exports = async function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-data-3.5',
        npm: {
          devDependencies: {
            'ember-data': '~3.5.0'
          }
        }
      },
      {
        name: 'ember-data-3.10',
        npm: {
          devDependencies: {
            'ember-data': '~3.10.0'
          }
        }
      },
      // The default `.travis.yml` runs this scenario via `npm test`,
      // not via `ember try`. It's still included here so that running
      // `ember try:each` manually or from a customized CI config will run it
      // along with all the other scenarios.
      {
        name: 'ember-default',
        npm: {
          devDependencies: {}
        }
      },
      {
        name: 'ember-default-with-jquery',
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'jquery-integration': true
          })
        },
        npm: {
          devDependencies: {
            '@ember/jquery': '^0.5.1'
          }
        }
      }
    ]
  };
};
