/*global module*/
module.exports = {
    // change to .tsx if necessary
    entry: './src/index.js',
    output: {
        filename: './bundle.js'
    },
    resolve: {
        // changed from extensions: [".js", ".jsx"]
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.tsx?$/, loader: "ts-loader" },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" },
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     loader: 'eslint-loader',
            //     options: {
            //         emitWarning: true,
            //     },
            // },
        ],
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },
    // addition - add source-map support
    devtool: "source-map"
}