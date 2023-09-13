import logger from 'node-color-log';
import { WebSocket, RawData } from 'ws';

export class Client {
    constructor(public id: number, public socket: WebSocket) {
    }

    public onMessage(data: RawData, isBinary: boolean) {
    }

    public onClose(code: number, reason: Buffer) {
    }
}
