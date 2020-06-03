const path = require('path');
const fs = require('fs');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const PAGES_DIR = 'src';
const PAGES = fs.readdirSync(PAGES_DIR).filter(fileName => fileName.endsWith('.pug'));

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all',
    }
  };

  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetsWebpackPlugin(),
      new TerserWebpackPlugin()
    ];
  }

  return config;
};

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: './index.js',
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.json', '.png'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  mode: 'development',
  plugins: [
    ...PAGES.map(page => new HTMLWebpackPlugin({
      template: `${page}`,
      filename: `./${page.replace(/\.pug/,'.html')}`,
    })),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin ([
      {
        from: path.resolve(__dirname, 'src/favicon.png'),
        to: path.resolve(__dirname, 'dist')
      },
    ]),
    new MiniCssExtractPlugin ({
      filename: filename('css'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
                hmr: isDev,
                reloadAll: true
            },
          },
          'css-loader'
        ],
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
                hmr: isDev,
                reloadAll: true
            },
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer({
                  overrideBrowserslist:['ie >= 11', 'last 2 version'],
                })
              ],
              sourceMap: true,
            }
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|svg|gif|eot|woff|woff2|ttf)$/,
        use: ['file-loader']
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader'
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
            ],
          },
        },
      },
    ],
  },
  optimization: optimization(),
  devServer: {
    port: 6500,
    hot: isDev,
  },
};
