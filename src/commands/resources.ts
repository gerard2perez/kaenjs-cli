import { fail } from 'assert';
import { existsSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { ok } from '@gerard2p/mce/console';
import { bool, enumeration, Parsed } from '@gerard2p/mce';
import { targetPath, cliPath } from '@gerard2p/mce/paths';
import { spin } from '@gerard2p/mce/spinner';
import { promisify } from 'util';
import { configuration } from '../utilities/configurations';
import { posix, basename, dirname, join } from 'path';
export let description = 'A description for your command';

const loader = l => cliPath('node_modules', l);
// const styleLoader = l => cliPath('node_modules',l);
let MiniCssExtractPlugin;
let FaviconsWebpackPlugin;
// export let args = '<arg1> [varidac...]';
function wpc(mode: string, name: string = '', base: string = '') {
	let js = {
		mode,
		devtool: 'inline-source-map',
		output: {
			library: configuration.server.name,
			path: targetPath('public/js'),
			filename: `${name}.js`,
			devtoolModuleFilenameTemplate(info) {
				return '';
			}
		},
		module: {
			rules: [
				{
					test: /\.[js|ts|tsx]$/,
					use: 'ts-loader',
					exclude: /node_modules/
				}
			]
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js']
		}
	};
	let engine = {
		mode,
		output: {
			library: configuration.server.name,
			path: targetPath('public/img'),
			filename: '.___ignore_me___'
		},
		module: {
			rules: [
				{
					test: /\.html$/,
					use: [
						{
							loader: 'html-loader?root=.!./file.html',
							options: {
								root: targetPath(),
								minimize: true,
								removeComments: false,
								collapseWhitespace: false
							}
						}
					]
				},
				{
					test: /\.(gif|png|jpe?g|svg)$/i,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[path][name].[ext]',
								outputPath: (filepath: string) => {
									console.log(filepath);
									return filepath.split('assets/img')[1];
								}
							}
						},
						{
							loader: 'image-webpack-loader',
							options: {
								mozjpeg: {
									progressive: true,
									quality: 65
								},
								optipng: {
									enabled: false
								},
								pngquant: {
									quality: '65-90',
									speed: 4
								},
								gifsicle: {
									interlaced: false
								}
								// webp: {
								//     quality: 75
								// }
							}
						}
					]
				}
			]
		},
		plugins: [
			new FaviconsWebpackPlugin({
				logo: targetPath('assets/favicon.png'),
				inject: false,
				prefix: '../',
				icons: {
					android: false,
					appleIcon: false,
					appleStartup: false,
					coast: false,
					favicons: true,
					firefox: false,
					opengraph: false,
					twitter: false,
					yandex: false,
					windows: false
				}
			})
		]
	};
	let css = {
		mode,
		devtool: 'inline-source-map',
		output: {
			library: configuration.server.name,
			path: targetPath(`public/${base}`),
			filename: '.___ignore_me___'
		},
		module: {
			rules: [{
				test: /\.(gif|png|jpe?g|svg)$/i,
				use: [{
						loader: loader('file-loader'),
						options: {
							name: '[path][name].[ext]',
							outputPath: (url, resourcePath, context) => {
								// console.log(url);
								// console.log(resourcePath);
								// console.log(context);
								// console.log(base);
								let res = posix.join('..', url.split('assets')[1]);
								// console.log(res);
								return res;
								// return posix.join('/', url.replace('assets', ''));
							}
						}
					},
					{
						loader: loader('image-webpack-loader'),
						options: {
							mozjpeg: {
								progressive: true,
								quality: 65
							},
							optipng: {
								enabled: false
							},
							pngquant: {
								quality: '65-90',
								speed: 4
							},
							gifsicle: {
								interlaced: false
							}
							// webp: {
							//     quality: 75
							// }
						}
					}]
				},
				{
					test: /\.styl$/,
					use: [
						MiniCssExtractPlugin.loader,
						loader('css-loader'),
						{
							loader: loader('stylus-loader'),
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.scss$/,
					use: [
						MiniCssExtractPlugin.loader,
						loader('css-loader'),
						{
							loader: loader('sass-loader'),
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.css$/,
					use: [MiniCssExtractPlugin.loader, loader('css-loader')]
				}
			]
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: `${name}.css`,
				chunkFilename: '[id].css'
			})
		]
	};
	return { js, engine, css };
}
export let options = {
	env: enumeration('-e <env>', 'environment', ['development', 'production'], 'development'),
	cache: bool('-c', 'creates a cache of the templates'),
	watch: bool('-w', 'keep watching for file changes')
};
function load(lib: string) {
    try {
		return require(lib);
    } catch (err) {
        return require(targetPath(`node_modules/${lib}`));
    }
}
export async function action(opt: Parsed<typeof options>) {
	const webpack = load('webpack');
	MiniCssExtractPlugin = load("mini-css-extract-plugin");
	FaviconsWebpackPlugin = load("favicons-webpack-plugin");
	let bundles = Object.keys(configuration.bundles || {});
	let watchers = [];
	let posibleIgnores:string[] = [];
	await spin('Compiling Bundles', async () => {
		let promisebundles = [];
	    for (const bundle of bundles) {
			let [name, type] =  basename(bundle).split('.');
	        let base_path = dirname(bundle.replace(/^\/public/, '')).replace('.', '') || type;
	        posibleIgnores.push(posix.join('public', base_path, '/'));
			const webpack_configurations = wpc(opt.env, name, base_path);
			let fconfig = Object.assign({}, webpack_configurations[type], { entry: configuration.bundles[bundle].map(f => targetPath(f)) });
	        const compiler = webpack(fconfig);
			watchers.push({compiler, bundle});
			if(opt.watch) {
				compiler.watch({aggregateTimeout: 300}, (err, stats)=>{
					console.log(stats.toString("minimal"));
				});
			} else {
				let res =promisify(compiler.run.bind(compiler))();
				res.then(res=>{
					if (res.hasErrors()) {
						console.log(res.toString());
						fail(` Bundle: ${bundle}`);
					} else {
						ok(` Bundle: ${bundle}`);
					}
				});
				promisebundles.push(res);
			}
		}
		await Promise.all(promisebundles);
	});
	if(opt.cache)
	await spin('Caching templates', async () => {
		const webpack_configurations = wpc(opt.env);
		let { template, extMapper } = load('kaen/views');
		let promises = [];
	    for (const file of readdirSync(targetPath('views'))) {
			let cache_file;
	        if (statSync(targetPath('views', file)).isDirectory()) continue;
	        const content = await template(targetPath('views', file));
	        if (file.includes('.html')) {
	            cache_file = targetPath('cached', file);
	        } else {
	            cache_file = targetPath('cached', file + '.html');
	        }
	        let enginew = Object.assign({}, webpack_configurations.engine, { entry: cache_file });
	        writeFileSync(cache_file, content);
	        const compiler = webpack(enginew);
	        watchers.push({compiler, bundle:file});
			let res = promisify(compiler.run.bind(compiler))();
			promises.push(res);
			res.then(res=>{
				if (!opt.cache) {
					// unlinkSync(cache_file);
				}
				if (res.hasErrors()) {
					console.log(res.toString());
					fail(file);
				} else {
					ok(file);
				}
				return cache_file;
			});
		}
		await Promise.all(promises);
	});
	await spin('Cleaning', async () => {
	    if (existsSync(targetPath('public/css/.___ignore_me___'))) unlinkSync(targetPath('public/css/.___ignore_me___'));
	    if (existsSync(targetPath('public/img/.___ignore_me___')))unlinkSync(targetPath('public/img/.___ignore_me___'));
	    if (existsSync(targetPath('public/.___ignore_me___')))unlinkSync(targetPath('public/.___ignore_me___'));
	    for(const dir of posibleIgnores) {
	        // console.log(`${dir}.___ignore_me___`);
	        if (existsSync(targetPath(`${dir}.___ignore_me___`)))unlinkSync(targetPath(`${dir}.___ignore_me___`));
		}
	});
	return watchers;
}
