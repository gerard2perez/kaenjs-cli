import { randomBytes } from 'crypto';

export function secret(size): Promise<string> {
	return new Promise(function(resolve, reject) {
		randomBytes(size, (err, buf) => {
			if (err) {
				reject(err);
			} else {
				resolve(buf.toString('hex'));
			}
		});
	});
}
