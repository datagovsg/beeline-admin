const path = require('path');
const fs = require('fs');
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin');

const env = {
  BACKEND_URL: process.env.BACKEND_URL || 'https://beeline-server-dev.herokuapp.com'
}

const prefix = path.resolve(process.env.BUILD_PREFIX || 'www')

const jsBundle = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
        include: path.resolve('.'),
        options: {
          attrs: false, /* disable img:src loading */
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: path.resolve('.'),
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: path.resolve('.'),
        options: {
          loaders: {
            // scss: {
            //   loader: [
            //     {loader: 'style-loader'},
            //     {loader: 'css-loader', options: {url: false}},
            //     {loader: 'sass-loader'},
            //   ]
            // }
          }
        }
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
    path: path.join(prefix, 'lib/beeline-admin'),
    filename: 'bundle.js',
    pathinfo: true,
  },
  externals: {
    'lodash': '_'
  },
  plugins: [
    new InlineEnviromentVariablesPlugin(env)
  ]
};

const cssBundle = {
  entry: path.resolve('scss/ionic.app.scss'),
  module: {
    rules: [{
      test: /\.scss$/,
      use: ExtractTextPlugin.extract({
        use: [
          {loader: 'css-loader', options: {url: false}},
          {loader: 'sass-loader'}
        ],
      })
    }]
  },
  output: {
    // This output is entirely superfluous.
    // We are abusing Webpack so that it will compile the SCSS
    // What it means is that you can load the style sheet by
    // both <script src="....XXX.css.js"></script>
    // and also by <link href="....XXX.css" />
    path: path.join(prefix, `css`),
    filename: 'styles.css.js',
    pathinfo: true,
  },
  plugins: [
    new ExtractTextPlugin({
      filename: 'styles.css',
    })
  ]
}

module.exports = [
  jsBundle,
  cssBundle,
]
