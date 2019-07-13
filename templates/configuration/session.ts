import { ISessionConfiguration } from "@kaenjs/session/configuration";
const config: ISessionConfiguration = {
	name: '{{application}}:sid',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}
export default config;
