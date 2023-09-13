import { logException, listenHttp } from '../shared/util';
import { PORT_OFFSET_CLIENT, PORT_OFFSET_SESSION } from '../shared/development';
import { ISessionServer, SessionServerType } from '../shared/session_server_interface';

import http from 'http';
import logger from 'node-color-log';
import esbuild, { BuildOptions, Plugin } from 'esbuild';

class HotReloadServer {
    private _host: string;
    private _clientPort: number;
    private _sessionPort: number;
    private _httpServer: http.Server | null = null;
    private _sessionServer: ISessionServer | null = null;

    constructor(host: string, basePort: number) {
        this._host = host;
        this._clientPort = basePort + PORT_OFFSET_CLIENT;
        this._sessionPort = basePort + PORT_OFFSET_SESSION;
    }

    /**
     * Closes the current game session's HTTP server (if it exists)
     * @apiNote The promise will not resolve as long as there are active connections
     */
    closeHttpServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._httpServer !== null) {
                this._httpServer.close(error => {
                    if (error === undefined) {
                        this._httpServer = null;
                        resolve();
                    } else {
                        reject(error);
                    }
                });
            } else {
                this._httpServer = null;
                resolve();
            }
        });
    }

    async reloadSessionServer() {
        // Reload the session server's code from a previously built './session_server.js'
        const path = require.resolve('./session_server.js');
        delete require.cache[path];
        const {SessionServer}: {SessionServer: SessionServerType} = require(path);

        // Start closing before releasing the session server to stop clients from
        // reconnecting too early
        const closePromise = this.closeHttpServer();

        // Try to release the session server; exceptions are non-fatal
        if (this._sessionServer !== null) {
            try {
                await this._sessionServer.release();
            } catch (exception) {
                logException(exception, 'session server release');
            }
            this._sessionServer = null;
        }

        // Limit the time it can take to close the server
        let timeoutID = setTimeout(() => {
            logger.error('The session server failed to close its connections');
            process.exit(1);
        }, 1500);
        await closePromise;
        clearTimeout(timeoutID);

        // Create a new HTTP server before creating the session server
        this._httpServer = await listenHttp(this._host, this._sessionPort);

        // Try to create the session server; exceptions are non-fatal
        let nextServer: ISessionServer = new SessionServer(this._httpServer);
        try {
            logger.info(`Serving session on http://${this._host}:${this._sessionPort}/`);
            await nextServer.start();

            // The session server was started successfully; we can return early
            this._sessionServer = nextServer;
            return;
        } catch (exception) {
            logException(exception, 'session server startup');
        }

        // Even if the startup has failed, try to release the partial server so
        // callbacks will get unbound
        try {
            await nextServer.release();
        } catch (exception) {
            logException(exception, 'partial session server release');
        }
    }

    /**
     * Serves the game's session on the port assigned by the constructor
     */
    async startSession() {
        const self = this;
        const plugin: Plugin = {
            name: 'hot_reload',
            setup(build) {
                // The session server's code will be merged into a single JS file,
                // except for external libraries which can be imported from node_modules
                build.onResolve({
                    filter: /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/
                }, args => ({ path: args.path, external: true }));

                // Setup code reloading for the session server
                build.onEnd(async result => {
                    if (result.errors.length > 0) {
                        // Don't reload when there are build errors
                        return;
                    }
                    try {
                        await self.reloadSessionServer();
                    } catch (exception) {
                        logException(exception, 'session server reload');
                    }
                });
            },
        }
        const options: BuildOptions = {
            plugins: [plugin],
            entryPoints: ['session_server/main.ts'],
            outfile: 'scripts/session_server.js',
            bundle: true,
            minify: false,
            sourcemap: false,
            platform: 'node',
            banner: {
                js: // Key for development mode
                    "global.IS_DEVELOPMENT = true;"
            }
        };
        const context = await esbuild.context(options);
        await context.watch();
    }

    /**
     * Serves the game's client via esbuild's serve() function on the
     * port assigned by the constructor
     */
    async startClient() {
        const options: BuildOptions = {
            entryPoints: ['client/main.ts'],
            outfile: 'www/index.js',
            bundle: true,
            minify: false,
            sourcemap: true,
            platform: 'browser',
            banner: {
                js: // Event source for client reload on code change
                    "new EventSource('/esbuild').addEventListener('change', () => location.reload());" +
                    // Key for development mode
                    "window.IS_DEVELOPMENT = true;"
            }
        };
        const context = await esbuild.context(options);
        await context.watch();
        logger.info(`Serving client on http://${this._host}:${this._clientPort}/`);
        await context.serve({
            host: this._host,
            port: this._clientPort,
            fallback: './www/index.html',
            servedir: './www'
        });
    }
}

async function main() {
    const server = new HotReloadServer(
        process.env.HOST ?? '127.0.0.1',
        parseInt(process.env.PORT ?? '3000')
    );
    await server.startSession();
    await server.startClient();
}

main().catch(exception => logException(exception, 'main event loop'));
