const path = require('path');

module.exports = {
  entry: './wtf-js/lib/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  mode: 'production',
  // use: {
  //   loader: 'babel-loader',
  //   options: {
  //     presets: ['@babel/preset-env']
  //   }
  // },
};