var path = require('path');
var fs = require('fs');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var autoprefixer = require('autoprefixer')

var env = {
    BACKEND_URL: process.env.BACKEND_URL || 'https://beeline-server-dev.herokuapp.com',
    AUTH0_CID: process.env.AUTH0_CID || 'BslsfnrdKMedsmr9GYkTv7ejJPReMgcE',
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'beeline.au.auth0.com',
}

fs.writeFileSync(`${__dirname}/beeline-admin/env.json`, JSON.stringify(env))

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
      }
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
  // plugins: [
  //   new ExtractTextPlugin("../../css/styles.css")
  // ],
  // postcss: function () {
  //   return [autoprefixer];
  // }
};
