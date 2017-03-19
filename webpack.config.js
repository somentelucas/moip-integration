var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
var notifier = require('node-notifier');
var path = require('path');

function rel (dir) {
    return path.join(__dirname, dir);
}


module.exports = {
    entry: './public/index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'app.bundle.js'
    },
    devtool: 'cheap-module-source-map',
    module: {
        loaders: [
            {
                test: /\.js$/i,
                loaders: ['babel'],
                include: [
                    rel('src')
                ]
            },

            // Import SASS stylesheets
            {
                test: /\.scss$/i,
                loader: ExtractTextPlugin.extract('style', [
                    'css?sourceMap&importLoaders=1',
                    'postcss',
                    'resolve-url?sourceMap&keepQuery=false',
                    'sass?sourceMap'
                ])
            },

            // Optimise images referenced from CSS
            // Files under 5kb will be inlined as data: URIs
            {
                test: /\.(?:jpe?g|png|gif|svg)(?:\?.+)?$/i,
                loaders: [
                    'url?limit=5000&name=[name].[ext]'
                ]
            },

            // Allow inlining of HTML templates
            {
                test: /\.html$/i,
                loader: 'ngtemplate?requireAngular&relativeTo=' + rel('public') + '/!html'
            },

            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('app.bundle.css'),

        new FriendlyErrorsWebpackPlugin({
            onErrors: function (severity, errors) {
                if (severity !== 'error') {
                    return;
                }

                var error = errors[0];
                notifier.notify({
                    title: 'Dev Build',
                    message: severity + ': ' + error.name,
                    subtitle: error.file || ''
                });
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin()
    ],

    resolve: {
        extensions: ['', '.js', '.scss']
    },

    stats: {
        colors: true
    },

    postcss: function () {
        return [
            require('autoprefixer')
        ];
    }
};