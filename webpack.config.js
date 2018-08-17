const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',
  mode: "production",
  node: {
    __dirname: false,
  },
  entry: ['./src/index.js'],
  externals: ['puppeteer'],
  devtool: 'source-map',
  output: {
    filename: 'web-crawler.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'webCrawler',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
  ],
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["es2015", "stage-2", "react"]
          }
        }
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  }
};