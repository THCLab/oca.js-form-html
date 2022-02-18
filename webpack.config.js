const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: {
      type: "commonjs"
    }
  },
  resolve: {
    extensions: [ ".ts", ".js" ],
    plugins: [new TsconfigPathsPlugin({})],
    fallback: {
      "assert": false,
      "buffer": false,
      "http": false,
      "https": false,
      "stream": false,
      "tls": false,
      "net": false,
      "child_process": false,
      "string_decoder": false,
      "fs": false,
      "os": false,
      "url": false,
      "util": false,
      "path": false,
      "zlib": false
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: "ts-loader",
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/index.d.ts" }
      ]
    })
  ],
  experiments: {
    syncWebAssembly: true
  },
};
