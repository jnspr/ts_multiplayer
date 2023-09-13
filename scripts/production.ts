import { SessionServer } from '../session_server/main';
import { logException, listenHttp } from '../shared/util';

import logger from 'node-color-log';

async function main() {
    let host = process.env.HOST ?? '0.0.0.0';
    let port = parseInt(process.env.PORT ?? '3000');

    let httpServer = await listenHttp(host, port);
    let sessionServer = new SessionServer(httpServer);

    await sessionServer.start();
    logger.info(`Serving session on http://${host}:${port}/`);
}

main().catch(exception => logException(exception, 'main event loop'));
