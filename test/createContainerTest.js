import createContainer from '../lib/createContainer'
import sinon from 'sinon'

describe('createContainer', () => {
  let c

  beforeEach(() => {
    c = createContainer()
  })

  it('should store and resolve values', async () => {
    c.set('a', 'b')

    assert.equal(await c.get('a'), 'b')
  })


  it('should store and resolve services', async () => {
    c.set('a', () => 'b')

    assert.equal(await c.get('a'), 'b')
  })


  it('should resolve dependencies',  async() => {
    c.set('a', () => 1)
    c.set('b', ['a'], (a) => a + 2)

    assert.equal(await c.get('b'), 3)
  })

  it('should search services', async () => {
    c.set('a', [], ['x'], () => 1)
    c.set('b', [], ['x'], () => 2)
    c.set('c', [], ['y'], () => 3)

    assert.deepEqual(await c.search('x'), [1, 2])
  })


  it('should call plugin', () => {
    var plugin = sinon.spy();

    c.plugin(plugin)
    assert.isTrue(plugin.called)
  })

  it('should compile', async () => {
    var list = []

    c.plugin((c) => {
      c.set('lister', () => {
        return {
          add: (item) => {
            list.push(item)
          }
        }
      })

      c.compile(async () => {
        let values = await* [c.get('lister'), c.search('listable')]
        let lister = values[0]
        let listable = values[1]

        listable.forEach((item) => {
          lister.add(item)
        })
      })
    })

    c.plugin((c) => {
      c.set('a', [], ['listable'], 1)
      c.set('b', [], ['listable'], 2)
      c.set('c', [], ['not-listable'], 3)
    })

    await c.build()
    assert.deepEqual(list, [1, 2])
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
