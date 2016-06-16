var path = require('path');
var fs = require('fs');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var autoprefixer = require('autoprefixer')

var env = {
    BACKEND_URL: process.env.BACKEND_URL || 'https://api.beeline.sg',
    AUTH0_CID: process.env.AUTH0_CID || 'BslsfnrdKMedsmr9GYkTv7ejJPReMgcE',
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'beeline.au.auth0.com',
}
fs.writeFileSync(`${__dirname}/beeline-admin/env.json`, JSON.stringify(env))
console.log(path.resolve('node_modules'))
module.exports = {
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'html',
        exclude: /node_modules/,
        include: path.resolve('.'),
        query: {
          attrs: false, /* disable img:src loading */
        }
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        include: path.resolve('.'),
        query: {
          presets: ['es2015', 'stage-3'],
          sourceMaps: true,
          plugins: ['transform-runtime'],
        },
      },
      /* The following are required by auth0-lock */
      {
        test: /node_modules[\\\/]auth0-lock[\\\/].*\.js$/,
        loaders: [
          'transform-loader/cacheable?brfs',
          'transform-loader/cacheable?packageify'
        ]
      },
      {
        test: /node_modules[\\\/]auth0-lock[\\\/].*\.ejs$/,
        loader: 'transform-loader/cacheable?ejsify'
      },
      // Load SCSS
      { test: /\.scss$/,loader: ExtractTextPlugin.extract("style-loader", "css!postcss!sass") },
      { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
      { test: /\.svg$/, loader: 'url?limit=65000&mimetype=image/svg+xml&name=../fonts/[name].[ext]' },
      { test: /\.png$/, loader: 'url?limit=65000&mimetype=image/png&name=../fonts/[name].[ext]' },
      { test: /\.woff$/, loader: 'url?limit=65000&mimetype=application/font-woff&name=../fonts/[name].[ext]' },
      { test: /\.woff2$/, loader: 'url?limit=65000&mimetype=application/font-woff2&name=../fonts/[name].[ext]' },
      { test: /\.[ot]tf$/, loader: 'url?limit=65000&mimetype=application/octet-stream&name=../fonts/[name].[ext]' },
      { test: /\.eot$/, loader: 'url?limit=65000&mimetype=application/vnd.ms-fontobject&name=../fonts/[name].[ext]' }
    ],
  },
  entry: [
    /* angular */
    path.resolve('node_modules/angular/angular'),
    path.resolve('node_modules/angular-ui-router/release/angular-ui-router'),

    /* ui-bootstrap */
    path.resolve('node_modules/angular-ui-bootstrap/dist/ui-bootstrap'),
    path.resolve('node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls'),

    /* dependency of angular-ui-bootstrap */
    path.resolve('node_modules/angular-animate/angular-animate'),
    path.resolve('node_modules/angular-touch/angular-touch'),

    /* dependency of angular-google-maps */
    path.resolve('node_modules/angular-simple-logger/dist/angular-simple-logger'),
    path.resolve('node_modules/lodash/lodash'),

    path.resolve('node_modules/angular-google-maps/dist/angular-google-maps'),
    path.resolve('beeline-admin/main.js'),
  ],
  output: {
    path: path.resolve('www/lib/beeline-admin'),
    filename: process.env.OUTPUT_FILENAME || 'bundle.js',
    pathinfo: true,
  },
  plugins: [
    new ExtractTextPlugin("../../css/styles.css")
  ],
  postcss: function () {
    return [autoprefixer];
  }
};
