'use strict';
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const config = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        path.resolve(__dirname, './node_modules/source-map/lib/mappings.wasm'),
        {
          from: path.resolve(__dirname, './assets/'),
          to: './img/',
        },
      ],
    }),
  ],
};

module.exports = config;
