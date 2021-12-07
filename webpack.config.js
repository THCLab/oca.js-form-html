const CopyWebpackPlugin = require('copy-webpack-plugin');
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
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    fallback: {
      "fs": false,
      "util": false,
      "path": false
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
