import { KaenServer } from '@kaenjs/core';
import { Localization } from '@kaenjs/localization';
import { Views } from '@kaenjs/views';
import { BodyParser } from '@kaenjs/body-parser';
import { Passport, Session } from '@kaenjs/passport';
import {StaticContent} from '@kaenjs/static';
import { Routes, Router } from '@kaenjs/router';
import { Databases, Seed } from '@kaenjs/vault-orm';
new KaenServer()
	.add(StaticContent())
	.add(BodyParser({
		files: ['image/png', 'image/jpg', 'image/jpeg']
	}))
	.add(Localization)
	.add(Session())
	.add(Passport(Router))
	.add(Views)
	.add(Routes())
	.ready(async () => {
		await Databases;
		await Seed();
	})
	.listen();
