// This is a karma config file. For more details see
//   http://karma-runner.github.io/0.13/config/configuration-file.html
// we are also using it with karma-webpack
//   https://github.com/webpack/karma-webpack
const webpack = require('webpack')
const webpackConfig = require('../../webpack.config')[0]
const grep = require('karma-webpack-grep')

delete webpackConfig.entry

module.exports = function (config) {
  config.set({
    // to run in additional browsers:
    // 1. install corresponding karma launcher
    //    http://karma-runner.github.io/0.13/config/browsers.html
    // 2. add it to the `browsers` array below.
    browsers: ['PhantomJS'],
    frameworks: ['jasmine', 'phantomjs-shim'], // 'sinon-chai',
    reporters: ['spec', 'coverage'],
    files: ['./index.js'],
    preprocessors: {
      './index.js': ['webpack', 'sourcemap']
    },
    webpack: {
      ...webpackConfig,
      devtool: 'inline-source-map',
      mode: 'development',
      plugins: (webpackConfig.plugins || []).concat(
        new webpack.ContextReplacementPlugin(/\.\/specs/, function (result) {
          if (result.request === './specs') {
            result.regExp = new RegExp('.*' + config.grep + '.*\\.spec$')
          }
      }))
    },
    webpackMiddleware: {
      noInfo: true
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
  })
}

