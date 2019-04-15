import { Router, RouterOptions } from '@kaenjs/router';

const router = new Router();

router.get('/', 'index.html');

export { router as default }
