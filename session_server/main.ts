import { Client } from "./client";
import { ISessionServer } from "../shared/session_server_interface";

import http from 'http';
import { WebSocket } from 'ws';
import express, { Request } from 'express';
import expressWs, { Application } from "express-ws";
import { GameState, TICK_INTERVAL } from "../shared/protocol";

export class SessionServer implements ISessionServer {
    private _nextID: number;
    private _clients: Map<number, Client>;
    private _express: Application;
    private _tickHandler: NodeJS.Timeout;
    private _gameState: GameState;

    constructor(private _httpServer: http.Server) {
        this._nextID = 0;
        this._clients = new Map();

        // EXAMPLE: Initialize game state
        this._gameState = GameState.empty();
    }

    private onConnect(socket: WebSocket, _request: Request) {
        // Allocate an ID and add the client to the map of clients
        const id = this._nextID++;
        const client = new Client(id, socket);
        this._clients.set(id, client);

        // Bind events
        socket.on('message', (data, isBinary) => client.onMessage(data, isBinary));
        socket.on('close', (code, reason) => {
            client.onClose(code, reason);
            this._clients.delete(id);
        });
    }

    private onTick() {
        // EXAMPLE: Increase the tick number
        this._gameState.currentTick++;

        // EXAMPLE: Serialize and send the game state
        let payload = this._gameState.serialize();
        for (const client of this._clients.values()) {
            client.socket.send(payload);
        }
    }

    async start() {
        // Bind routes
        this._express = expressWs(express(), this._httpServer).app;
        this._express.ws('/join', (socket, request) => this.onConnect(socket, request));
        this._httpServer.on('request', this._express);

        // EXAMPLE: Start processing game state
        this._tickHandler = setInterval(() => this.onTick(), TICK_INTERVAL);
    }

    async release() {
        // EXAMPLE: Stop processing game state
        clearInterval(this._tickHandler);

        // Close all connections before releasing so the HTTP server can be shut down gracefully
        for (const client of this._clients.values()) {
            client.socket.close();
        }
    }
}
