/* eslint-disable no-var */

var webpack = require('webpack')
var path = require('path')

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],

    files: [
      'test/**/*test.js'
    ],

    preprocessors: {
      'test/**/*test.js': ['webpack']
    },

    reporters: ['progress', 'coverage'],

    browsers: ['Chrome'],

    singleRun: true,

    coverageReporter: {
      type: 'lcov',
      subdir: '.'
    },

    webpack: {
      module: {
        loaders: [
          {test: /\.js$/, include: [path.join(__dirname, 'test'), path.join(__dirname, 'build-lib')], loaders: ['babel']},
          {test: /\.js$/, include: [path.join(__dirname, 'lib')], loaders: ['isparta']}
        ]
      },

      plugins: [
        new webpack.ProvidePlugin({
          chai: 'chai',
          assert: 'chai.assert'
        })
      ]
    },

    webpackMiddleware: {
      quiet: true
    }
  })
}