const path = require('path');
const { merge } = require('webpack-merge');
const commonConfiguration = require('./webpack.common.js');

module.exports = merge(commonConfiguration, {
    mode: 'development',
    devtool: 'source-map',
    stats: 'errors-warnings',
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        open: ['http://localhost:8080'],
        hot: false,
        watchFiles: ['src/**', 'static/**'],
        static: {
            watch: true,
            directory: path.join(__dirname, '../static'),
        },
        client: {
            logging: 'none',
            overlay: true,
            progress: false,
        },
    },
});
