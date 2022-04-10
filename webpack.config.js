const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './wtf-js/lib/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  mode: 'production',
  plugins: [
    new Dotenv()
  ]
  // use: {
  //   loader: 'babel-loader',
  //   options: {
  //     presets: ['@babel/preset-env']
  //   }
  // },
};