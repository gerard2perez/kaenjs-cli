import { IServerConfiguration, LocalizationMode } from '@kaenjs/core/configuration/server';
export default {
	name: '{{application}}',
	subdomainOffset: 3,
	port: 62626,
	host: {
		dev:'{{application}}.loc',
		prod: '{{application}}.com'
	},
	https: {

	},
	Keys: {
		dev: [
		'{{key1}}',
		'{{key2}}',
		'{{key3}}',
		'{{key4}}'
		],
		prod:[
			'{{key5}}',
			'{{key6}}',
			'{{key7}}',
			'{{key8}}'
		]
	},
	client_max_body_size: '1M',
	localization: {
		directory: './locales',
		queryKey: 'locale',
		default: 'en',
		cookie:'locale',
		objectNotation: false,
		fallbacks: {},
		modes: [
			LocalizationMode.query,
			LocalizationMode.subdomain,
			LocalizationMode.cookie,
			LocalizationMode.url,
			LocalizationMode.tld,
			LocalizationMode.header
		]

	}
} as IServerConfiguration;
