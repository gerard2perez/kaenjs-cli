import { Router, RouterOptions } from '@kaenjs/router';

const router = new Router('www');

router.get('/', 'index.html');

export { router as default }
