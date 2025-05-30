const path = require('path')
const fs = require('fs')
const cracoBabelLoader = require('craco-babel-loader')
const webpack = require('webpack');

// Handle relative paths to sibling packages
const appDirectory = fs.realpathSync(process.cwd())
const resolvePackage = relativePath => path.resolve(appDirectory, relativePath)
const packagesToTranspile = [
  resolvePackage('../sdk-communication-layer'),
  resolvePackage('../sdk-install-modal-web'),
  resolvePackage('../sdk'),
  resolvePackage('../sdk-react'),
  resolvePackage('../sdk-react-ui'),
  resolvePackage('../sdk-ui'),
  require.resolve('react-native-gesture-handler'),
  require.resolve('react-native-svg'),
  require.resolve('react-native-reanimated'),
  require.resolve('react-native-web'),
  require.resolve('react-native-safe-area-context'),
  path.resolve('node_modules/@react-native/assets-registry/registry.js'),
]

console.log(`Transpiling packages: ${packagesToTranspile.join('\n')}`)

module.exports = {
  // ...
  watchOptions: {
    followSymlinks: true,
    ignored: /node_modules/,
  },
  typescript: {
    enableTypeChecking: false /* (default value) */,
  },
  webpack: {
    configure: (webpackConfig) => {
      const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
        ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin'
      );

      // Inject __DEV__ which is required by some modules
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          __DEV__: process.env.NODE_ENV !== 'production',
        })
      );

      webpackConfig.resolve.plugins.splice(scopePluginIndex, 1);
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          'react': require.resolve('react'),
          // 'react-dom': require.resolve('react-dom'),
          'react-native-reanimated': path.resolve(__dirname, './node_modules/react-native-reanimated'),
          'react-native-gesture-handler': path.resolve(__dirname, './node_modules/react-native-gesture-handler'),
          'react-native-safe-area-context': path.resolve(__dirname, './node_modules/react-native-safe-area-context'),
          'react-native-svg': path.resolve(__dirname, './node_modules/react-native-svg'),
        },
        fallback: {
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify")
        },
      };
      webpackConfig.module.rules.push(
        {
          test: /\.ttf$/,
          loader: "url-loader", // or directly file-loader
          include: path.resolve(__dirname, "node_modules/react-native-vector-icons"),
        },
        {
          test: /\.js$/,
          exclude: /node_modules[/\\](?!react-native-vector-icons)/,
          include: [
            // Add the path to the problematic module
            path.resolve('../../packages/sdk-ui/node_modules/@react-native/assets-registry/registry.js'),
            // Add other React Native modules if needed
          ],
          use: {
            loader: "babel-loader",
            options: {
              // Disable reading babel configuration
              babelrc: false,
              configFile: false,

              // The configuration for compilation
              presets: [
                ["@babel/preset-env", { useBuiltIns: "usage" }],
                "@babel/preset-react",
                "@babel/preset-flow",
                "@babel/preset-typescript"
              ],
              plugins: [
                "@babel/plugin-proposal-class-properties",
                '@babel/plugin-syntax-jsx',
                "@babel/plugin-proposal-object-rest-spread"
              ]
            }
          }
        },
        {
          test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
          type: 'asset/resource'
        });
      // // Add SVGR loader for SVG files
      // webpackConfig.module.rules.push({
      //   test: /\.svg$/,
      //   use: ['@svgr/webpack'], // This will use SVGR for SVG files and url-loader as a fallback
      // });

      // write resolve config for debug
      const webpackConfigPath = path.resolve(__dirname, './webpack.config.json');
      fs.writeFileSync(webpackConfigPath, JSON.stringify(webpackConfig, null, 2));
      console.log(`Wrote webpack config to ${webpackConfigPath}`);
      return webpackConfig;
    },
  },
  babel: {
    "presets": ["@babel/preset-env", "@babel/preset-react", "@babel/preset-flow", "@babel/preset-typescript"],
    "plugins": [
      ['@babel/plugin-syntax-jsx'],
      ["@babel/plugin-proposal-class-properties"],
      ["@babel/plugin-proposal-object-rest-spread"],
      ["@babel/plugin-transform-class-properties"],
      ["@babel/plugin-transform-private-methods"],
      ["@babel/plugin-transform-private-property-in-object"]
    ]
  },
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: packagesToTranspile,
        excludes: [/node_modules/],
      }
    }
  ]
};
