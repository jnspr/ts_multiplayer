import http from 'http';
import logger from 'node-color-log';

/**
 * Logs an exception; it may be of type Error, in which case a stack trace is included
 */
export function logException(exception: any, where: string) {
    logger.error(`*** Exception in ${where} ***`);
    if (exception instanceof Error) {
        if (exception.stack !== undefined) {
            for (const line of exception.stack.split('\n')) {
                logger.error(line);
            }
        }
    } else if (exception !== undefined) {
        logger.error(exception);
    }
}


/**
 * Creates a HTTP server and makes it listen on the given host and port
*/
export function listenHttp(host: string, port: number): Promise<http.Server> {
    return new Promise((resolve, reject) => {
        const httpServer = http.createServer();
        httpServer.listen(port, host)
            .on('listening', () => resolve(httpServer))
            .on('error', error => reject(error));
    });
}
