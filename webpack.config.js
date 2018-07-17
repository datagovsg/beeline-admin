const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin');

const env = {
  BACKEND_URL: process.env.BACKEND_URL || 'https://api-staging.beeline.sg',
  TRACKING_URL: process.env.TRACKING_URL || 'https://tracking-staging.beeline.sg',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

const prefix = path.resolve(process.env.BUILD_PREFIX || 'www')

const babelSettings = {
  presets: [
    ['@babel/preset-env', {targets: {browsers: 'ie 11'}}]
  ]
}

const jsBundle = {
  mode: env.NODE_ENV,
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
      },
      {
        test: /\.(svg|png|gif|jpg)$/,
        loader: 'file-loader',
        options: {
          publicPath: 'lib/beeline-admin'
        }
      }
    ],
  },
  entry: [
    '@babel/polyfill',
    path.resolve('beeline-admin/main.js'),
  ],
  output: {
    path: path.join(prefix, 'lib/beeline-admin'),
    filename: 'bundle.js',
    pathinfo: true,
  },
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
  output: {
    path: path.resolve(prefix, './css')
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
