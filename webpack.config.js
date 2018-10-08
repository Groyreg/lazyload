const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

function generateHtmlPlugins(templateDir) {
    const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
    return templateFiles.map(item => {
        const parts = item.split('.');
        const name = parts[0];
        const extension = parts[1];
        return new HtmlWebpackPlugin({
            filename: `${name}.html`,
            template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
            inject: false,
        })
    })
}

const htmlPlugins = generateHtmlPlugins('./src/html/views');

module.exports = {
    entry: [
        './src/js/main.js',
        './src/scss/main.scss'
    ],
    output: {
        filename: './js/bundle.js'
    },
    devtool: "source-map",
    module: {
        rules: [{
            test: /\.js$/,
            include: path.resolve(__dirname, 'src/js'),
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {
                            modules: false
                        }],
                    ],
                    plugins: ['@babel/plugin-proposal-class-properties'],
                }
            }
        },
            {
                test: /\.(png|jpg|jpeg|gif|ico|webp|webmanifest)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {name: 'img/[name].[ext]'}
                    }
                ]
            },
            {
                test: /\.(woff|woff2|otf|ttf|eot)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'fonts/[name].[ext]',
                            publicPath: '../'
                        },

                    }
                ]
            },
            {
                test: /\.(sass|scss)$/,
                include: path.resolve(__dirname, 'src/scss'),
                use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {}
                },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                            // url: false
                        }
                    },
                    {
                        loader: "resolve-url-loader"
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            sourceMap: true,
                            plugins: () => [
                                require('cssnano')({
                                    preset: ['default', {
                                        discardComments: {
                                            removeAll: true,
                                        },
                                    }]
                                })
                            ]
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                include: path.resolve(__dirname, 'src/html/includes'),
                use: ['raw-loader']
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "./css/style.bundle.css"
        }),
        new CopyWebpackPlugin([
            // {
            // from: './src/fonts',
            // to: './fonts'
            // },
            {
                from: './src/favicon',
                to: './favicon'
            },
            // {
            //     from: './src/img',
            //     to: './img'
            // }
        ]),
    ].concat(htmlPlugins)
};
