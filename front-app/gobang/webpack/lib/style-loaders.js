module.exports = ({ cssOptions, preProcessor, webpackEnv }) => {
    // const isEnvDevelopment = webpackEnv === 'development';
    const isEnvProduction = webpackEnv === 'production';
    const loaders = [
      require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            config: false,
            plugins: [
              'postcss-flexbugs-fixes',
              [
                'postcss-preset-env',
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              'postcss-normalize',
            ],
          },
          sourceMap: !isEnvProduction
        },
      },
    ].filter(Boolean);;

    if (preProcessor) {
        loaders.push(
          {
            loader: require.resolve('resolve-url-loader'),
            options: {
              sourceMap: !isEnvProduction,
              root: '../src'
            },
          },
          {
            loader: require.resolve(preProcessor),
            options: {
              sourceMap: true,
            },
          },
        );
      }
    return loaders;
  };
