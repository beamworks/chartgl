var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// demo bundling
module.exports = {
    entry: './src/demo.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.(jsx?)$/, use: 'babel-loader', exclude: /node_modules/ },
            { test: /\.scss$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ]},
            {
                test: /\.wav$/,
                use: [ {
                    loader: 'url-loader',
                    options: {
                        limit: 40000
                    }
                } ]
            },

            // ES6-based lib
            {
              test: /node_modules[\\\/]gl-matrix[\\\/].*\.js$/,
              loader: 'babel-loader' // built-in babelrc
            },

            // ES6-based lib
            {
                test: /node_modules[\\\/]react-dynamics[\\\/].*\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ 'babel-preset-env' ]
                    }
                }
            }
        ]
    },
    plugins: [
        // @todo uglify in prod
        // pass Node production flag to React safety checks
        new webpack.EnvironmentPlugin({
            'NODE_ENV': 'development'
        }),

        new HtmlWebpackPlugin({
            chunks: [ 'demo' ],
            filename: 'index.html',
            template: './index.html'
        })
    ].concat(process.env.NODE_ENV === 'production' ? [
        // uglify in prod
        new webpack.optimize.UglifyJsPlugin({
            output: { 'ascii_only': true } // conservative encoding
        })
    ] : []),

    // serve index.html in place of browser's 404 responses
    devServer: {
        inline: true,
        historyApiFallback: true
    }
};
