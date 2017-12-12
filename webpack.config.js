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
            {
                test: /\.wav$/,
                use: [ {
                    loader: 'url-loader',
                    options: {
                        limit: 40000
                    }
                } ]
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
    ],

    // serve index.html in place of browser's 404 responses
    devServer: {
        inline: true,
        historyApiFallback: true
    }
};
