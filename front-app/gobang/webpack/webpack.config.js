const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const resolve = require('resolve');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const createEnvironmentHash = require('./lib/persistentCache/createEnvironmentHash');
const getStyleLoaders = require('./lib/style-loaders');
const paths = require('./paths');
const ForkTsCheckerWebpackPlugin =
  process.env.TSC_COMPILE_ON_ERROR === 'true'
    ? require('react-dev-utils/ForkTsCheckerWarningWebpackPlugin')
    : require('react-dev-utils/ForkTsCheckerWebpackPlugin');

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

const shouldUseSourceMap = true;
const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000');

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = function () {
  const webpackEnv = 'production';
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  return {
    // target: ['browserslist'],
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    devtool: isEnvProduction ? false : 'cheap-module-source-map',
    entry: {},
    output: {
      path: isEnvProduction ? paths.appBuild : undefined,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/[name].js',
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      // publicPath: paths.publicUrlOrPath,
    },
    cache: {
      type: 'filesystem',
      version: createEnvironmentHash(process.env),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack'
    },

    resolve: {
      modules: ['node_modules'],
      extensions: moduleFileExtensions
        .map((ext) => `.${ext}`)
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          loader: require.resolve('source-map-loader'),
        },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            {
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve('@svgr/webpack'),
                  options: {
                    prettier: false,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                    ref: true,
                  },
                },
                {
                  loader: require.resolve('file-loader'),
                  options: {
                    name: 'static/media/[name].[hash].[ext]',
                  },
                },
              ],
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appPath,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                presets: [
                  [
                    require.resolve('babel-preset-react-app'),
                    {
                      runtime: hasJsxRuntime ? 'automatic' : 'classic',
                    },
                  ],
                ],

                plugins: [isEnvDevelopment && require.resolve('react-refresh/babel')].filter(
                  Boolean,
                ),
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                modules: {
                  mode: 'icss',
                },
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                modules: {
                  mode: 'local',
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'icss',
                  },
                },
                'sass-loader',
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'local',
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'sass-loader',
              ),
            },
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/^$/, /\.(js|cjs|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: 'asset/resource',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ].filter(Boolean),
    },

    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
        filename: 'index.html',
        chunks: ['index'],
        ...(isEnvProduction
          ? {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
              },
            }
          : undefined),
      }),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, process.env),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      // new webpack.DefinePlugin(env.stringified),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/main/packages/react-refresh
      isEnvDevelopment &&
        new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          ignoreOrder: true,
        }),
      // new WebpackManifestPlugin({
      //   fileName: `${entry}.asset-manifest.json`,}
      // ),
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.appNodeModules,
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.appTsBuildInfoFile,
              },
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: 'write-references',
            // profile: true,
          },
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupProxy.*' },
              { file: '**/src/setupTests.*' },
            ],
          },
          logger: {
            infrastructure: 'silent',
          },
        }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),

      // 环境变量设置USE_OSS=true才将静态资源上传到OSS
      // 注意只能是测试环境才能使用这个变量
      process.env.USE_OSS === 'true'
        ? new Upload2OSSPlugin({
            appId: process.env.OSS_PREFIX || `NotProvide_OSS_PREFIX_${Math.random().toString(36).slice(2)}`,
          })
        : undefined,
    ].filter(Boolean),
  };
};
