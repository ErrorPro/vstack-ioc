/**
 * vstack by @vslinko
 */
/* global afterEach beforeEach describe it jest pit xdescribe xit */
/* global expect */

jest.autoMockOff();

var Promise = require('bluebird');
var createContainer = require('../createContainer');

describe('createContainer', function() {
  var c;

  beforeEach(function() {
    c = createContainer();
  });

  pit('should store and resolve values', function() {
    c.set('a', 'b');

    return c.get('a').then(function(value) {
      expect(value).toEqual('b');
    });
  });

  pit('should store and resolve services', function() {
    c.set('a', function() {
      return 'b';
    });

    return c.get('a').then(function(value) {
      expect(value).toEqual('b');
    });
  });

  pit('should resolve dependencies', function() {
    c.set('a', function() {
      return 1;
    });

    c.set('b', ['a'], function(a) {
      return a + 2;
    });

    return c.get('b').then(function(value) {
      expect(value).toEqual(3);
    });
  });

  pit('should search services', function() {
    c.set('a', [], ['x'], function() {
      return 1;
    });

    c.set('b', [], ['x'], function() {
      return 2;
    });

    c.set('c', [], ['y'], function() {
      return 3;
    });

    return c.search('x').then(function(services) {
      expect(services).toEqual([1, 2]);
    });
  });

  it('should call plugin', function() {
    var plugin = jest.genMockFn();
    c.plugin(plugin);
    expect(plugin).toBeCalledWith(c);
  });

  pit('should compile', function() {
    var list = [];

    c.plugin(function(c) {
      c.set('lister', function() {
        return {
          add: function(item) {
            list.push(item);
          }
        };
      });

      c.compile(function() {
        return Promise.all([c.get('lister'), c.search('listable')])
          .then(function(values) {
            var lister = values[0];
            var listable = values[1];

            listable.forEach(function(item) {
              lister.add(item);
            });
          });
      });
    });

    c.plugin(function(c) {
      c.set('a', [], ['listable'], 1);
      c.set('b', [], ['listable'], 2);
      c.set('c', [], ['not-listable'], 3);
    });

    return c.build().then(function() {
      expect(list).toEqual([1, 2]);
    });
  });

  it('should not rewrite service', function() {
    expect(function() {
      c.set('a', 1);
      c.set('a', 2);
    }).toThrow('Invariant Violation: Service "a" already defined');
  });

  it('should check cirrural dependency', function() {
    expect(function() {
      c.set('a', ['b'], function() {});
      c.set('b', ['c'], function() {});
      c.set('c', ['a'], function() {});
    }).toThrow('Invariant Violation: Circular dependency between "c" and "a"');
  });
});
