const ExtractTextPlugin = require("extract-text-webpack-plugin"),
      appDir = process.cwd(),
      modules = require("../imports/es-modules"),
      path = require("path"),
      postCSS = require("./postcss");

const appPath = path.join(appDir, "app");

const babelPresets = [["env", {modules: false}], "react", "stage-0"];
if (process.env.NODE_ENV === "development") babelPresets.unshift("react-hmre");


const cssLoaders = [
  "iso-morphic-style-loader",
  {loader: "css-loader", options: {
    minimize: process.env.NODE_ENV === "production",
    sourceMap: process.env.NODE_ENV === "development"
  }},
  {loader: "postcss-loader", options: {
    plugins: postCSS,
    sourceMap: process.env.NODE_ENV === "development"
  }}
];

module.exports = [
  {
    test: /\.js$|\.jsx$/,
    loader: "babel-loader",
    options: {
      compact: process.env.NODE_ENV === "production",
      presets: babelPresets,
      plugins: [
//        ["transform-react-jsx", { "pragma":"h" }],
        ["module-resolver", {
          "root": ["../../node_modules", "../../src", appDir],
          "alias": {
            "react": "preact-compat",
            "react-dom": "preact-compat",
            'create-react-class': 'preact-compat/lib/create-react-class'
          }
        }],
        ["direct-import", modules],
        ["transform-imports", {
          "@blueprintjs/core": {
            transform: path.join(__dirname, "../imports/blueprintjs.core.js"),
            preventFullImport: true,
            skipDefaultConversion: true
          }
        }]
      ]
    },
    include: [
      appPath,
      path.join(appDir, "node_modules/yn"),
      path.join(__dirname, "../../src")
    ]
  },
  {
    test: /\.(png|jpeg|jpg|gif|bmp|tif|tiff|svg|woff|woff2|eot|ttf)$/,
    loader: "url-loader?limit=100000"
  },
  {
    test: /\.(yaml|yml)$/,
    loader: "yml-loader"
  },
  {
    test: /\.(scss|sass|css)$/i,
    use: process.env.NODE_ENV === "development" ? cssLoaders : ExtractTextPlugin.extract({fallback: cssLoaders[0], use: cssLoaders.slice(1)})
  }
];

// old server dev CSS
// {
//   test: /\.css$/,
//   loader: "css-loader",
//   options: {
//     modules: true,
//     importLoaders: true
//   }
// }
