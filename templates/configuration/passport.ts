import { IPassportConfiguration } from "@kaenjs/passport/configuration";
// import { YourContext } from "../models/YourContext";
// import { Strategy as Local } from "passport-local";
// import { compare } from '@kaenjs/core/kaen-passport/compare';

const config:IPassportConfiguration = {
	Model:o=>o,
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
};
export default config;
