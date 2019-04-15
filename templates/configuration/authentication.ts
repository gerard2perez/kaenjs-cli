import { IAuthenticationConfiguration } from "@kaenjs/core/configuration/authentication";
// import { YourContext } from "../models/YourContext";
// import { Strategy as Local } from "passport-local";
// import { compare } from '@kaenjs/core/kaen-passport/compare';

const config:IAuthenticationConfiguration = {
	Session: {
		resave: false,
		saveUninitialized: true,
		cookie: { secure: true }
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
	// Model:(o)=>YourContext.users,
	UsernameKey: 'username',
	PassowrdKey: 'password',
	SaltRounds: 5,
	Strategies:[
		// {
		// 	Strategy: Local,
		// 	Options: {
		// 		session: true
		// 	},
		// 	async Auth (username:string, password:string, done:Function) {
		// 		let user = await YourContext.users.firstOrDefault({username});
		// 		if (user) {
		// 			if ( await compare(password, user.password) ) {
		// 				done(null, user);
		// 				return;
		// 			}
		// 		}
		// 		done(null, false, {message:'wrong username or password'});
		// 	}
		// }
	]
} as IAuthenticationConfiguration;
export default config;
