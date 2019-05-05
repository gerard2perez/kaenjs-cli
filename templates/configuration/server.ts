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
