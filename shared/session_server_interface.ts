import http from 'http';

/**
 * Defines a session server
 */
export interface ISessionServer {
    start(): Promise<void>;
    release(): Promise<void>;
}

/**
 * Defines a type that can construct a session server
*/
export interface SessionServerType {
    new(httpServer: http.Server): ISessionServer;
}
