const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const fs = require('fs');
const autoprefixer = require('autoprefixer')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin');

const env = {
  BACKEND_URL: process.env.BACKEND_URL || 'https://api-staging.beeline.sg',
  TRACKING_URL: process.env.TRACKING_URL || 'https://tracking-staging.beeline.sg',
  NODE_ENV: process.env.NODE_ENV || 'development',
}

const prefix = path.resolve(process.env.BUILD_PREFIX || 'www')

const babelSettings = {
  presets: [
    ['@babel/preset-env', {targets: {browsers: 'ie 11'}}]
  ]
}

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
        options: {
          babelrc: false,
          cacheDirectory: true,
          ...babelSettings,
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          /node_modules\/vue-strap/,
          /node_modules\/vue-async-computed/,
          /node_modules\/sinon\//,
        ],
        options: {
          babelrc: false,
          cacheDirectory: true,
          ...babelSettings,
        }
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['vue-style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
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
  // externals: {
  //   'lodash': '_'
  // },
  plugins: [
    new VueLoaderPlugin(),
    new InlineEnviromentVariablesPlugin(env)
  ],
  resolve: {
    alias: {
      '~': __dirname,
      '@': path.join(__dirname, 'beeline-admin'),
    }
  }
};

const cssBundle = {
  entry: path.resolve('scss/ionic.app.scss'),
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {loader: 'css-loader', options: {url: false}},
        {loader: 'sass-loader'}
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    })
  ]
}

module.exports = [
  jsBundle,
  cssBundle,
]
