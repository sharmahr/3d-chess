const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode !== "production";
  const apiTarget = process.env.WEBPACK_API_URL || "http://localhost:8000";

  return {
    entry: "./src/main.jsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isDev ? "[name].js" : "[name].[contenthash].js",
      clean: true,
      publicPath: "/",
    },
    resolve: {
      extensions: [".js", ".jsx", ".json"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        inject: true,
      }),
    ],
    devServer: {
      host: "0.0.0.0",
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ["/api"],
          target: apiTarget,
          changeOrigin: true,
        },
      ],
    },
    devtool: isDev ? "eval-source-map" : "source-map",
  };
};
