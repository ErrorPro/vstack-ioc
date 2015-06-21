const createContainer = require('../lib/createContainer')
const sinon = require('sinon')

describe('createContainer', () => {
  let c

  beforeEach(() => {
    c = createContainer()
  })

  it('should store and resolve values',() => {
    c.set('a', 'b')

    return c.get('a').then((value) => {
      assert.equal(value, 'b')
    })
  })


  it('should store and resolve services', () => {
    c.set('a', () => 'b')

    return c.get('a').then((value) => {
      assert.equal(value, 'b')
    })
  })


  it('should resolve dependencies', () => {
    c.set('a', () => 1)
    c.set('b', ['a'], (a) => a + 2)

    return c.get('b').then((value) => {
      assert.equal(value, 3)
    })
  })

  it('should search services', () => {
    c.set('a', [], ['x'], () => 1)
    c.set('b', [], ['x'], () => 2)
    c.set('c', [], ['y'], () => 3)

    return c.search('x').then((services) => {
      assert.deepEqual(services, [1, 2])
    })
  })


  it('should call plugin', () => {
    var plugin = sinon.spy();

    c.plugin(plugin)
    assert.isTrue(plugin.called)
  })

  it('should compile', () => {
    var list = []

    c.plugin((c) => {
      c.set('lister', () => {
        return {
          add: (item) => {
            list.push(item)
          }
        }
      })

      c.compile(() => {
        return Promise.all([c.get('lister'), c.search('listable')])
          .then((values) => {
            var lister = values[0]
            var listable = values[1]

            listable.forEach((item) => {
              lister.add(item)
            })
          })
      })
    })

    c.plugin((c) => {
      c.set('a', [], ['listable'], 1)
      c.set('b', [], ['listable'], 2)
      c.set('c', [], ['not-listable'], 3)
    })

    return c.build().then(() => {
      assert.deepEqual(list, [1, 2])
    })
  })


  it('should not rewrite service', () => {
    assert.throws(() => {
      c.set('a', 1)
      c.set('a', 2)
    }, 'Invariant Violation: Service "a" already defined')
  })

  it('should check cirrural dependency', () => {
    assert.throws(() => {
      c.set('a', ['b'], () => {})
      c.set('b', ['c'], () => {})
      c.set('c', ['a'], () => {})
    }, 'Invariant Violation: Circular dependency between "c" and "a"')
  })
})
