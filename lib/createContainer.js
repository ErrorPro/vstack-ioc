/**
 * vstack by @vslinko
 */

import DepGraph from 'dep-graph'
import invariant from 'invariant'

function createContainer() {
  const container = {};
  const graph = new DepGraph();
  const tags = {};
  const factories = {};
  const values = {};
  const compilers = [];

  function addDepenencyPath(source, destination) {
    graph.add(source, destination);

    try {
      graph.descendantsOf(source);
    } catch (e) {
      invariant(
        !e,
        'Circular dependency between "%s" and "%s"',
        source,
        destination
      );
    }
  }

  function getter(key) {
    if (key in values) {
      return Promise.resolve(values[key]);
    }

    invariant(key in factories, 'Unknown service "%s"', key);

    return Promise.all(factories[key].dependencies.map(getter))
      .then((args) => {
        return factories[key].factory.apply(null, args);
      })
      .then((value) => {
        values[key] = value;
        return values[key];
      });
  }

  function set(name, serviceDependencies, serviceTags, value) {
    invariant(
      !(name in values || name in factories),
      'Service "%s" already defined',
      name
    );

    if (!value) {
      value = serviceTags;
      serviceTags = [];
    }

    if (!value) {
      value = serviceDependencies;
      serviceDependencies = [];
    }

    serviceDependencies.forEach((dependency) => {
      addDepenencyPath(name, dependency);
    });

    serviceTags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }

      tags[tag].push(name);
    });

    if (typeof value === 'function') {
      factories[name] = {
        dependencies: serviceDependencies,
        factory: value
      };
    } else {
      values[name] = value;
    }
  }

  function get(keys) {
    if (Array.isArray(keys)) {
      return Promise.all(keys.map(getter));
    } else {
      return getter(keys);
    }
  }

  function search(tag) {
    if (tags[tag]) {
      return get(tags[tag]);
    } else {
      return Promise.resolve([]);
    }
  }

  function plugin(pluginFunction) {
    pluginFunction(container);
  }

  function compile(compiler) {
    compilers.push(compiler);
  }

  function build() {
    return Promise.all(compilers.map((compiler) => {
      return compiler();
    }));
  }

  container.set = set;
  container.get = get;
  container.search = search;
  container.plugin = plugin;
  container.compile = compile;
  container.build = build;

  return container;
}

module.exports = createContainer;
