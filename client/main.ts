import { Camera } from "./camera";
import { GameState, TICK_RATE } from "../shared/protocol";
import { isDevelopment, PORT_OFFSET_CLIENT, PORT_OFFSET_SESSION } from "../shared/development";

class Client {
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _camera: Camera;
    private _lastTime: number;
    private _socket: WebSocket;
    private _gameState: GameState;

    constructor(canvas: HTMLCanvasElement) {
        // Obtain drawing context
        this._canvas = canvas;
        this._context = canvas.getContext('2d')!;
        this._camera = new Camera();

        // EXAMPLE: Initialize game state
        this._gameState = GameState.empty();

        // Connect to session server
        if (isDevelopment()) {
            const port = parseInt(location.port) + PORT_OFFSET_SESSION - PORT_OFFSET_CLIENT;
            this._socket = new WebSocket(`ws://${location.hostname}:${port}/join`);
            this._socket.addEventListener('close', () => location.reload());
        } else {
            alert("Production mode is not implemented, I don't know how to connect!");
        }
        this._socket.addEventListener('message', event => this.onMessage(event.data));
    }
    
    public onStart(time: number) {
        const deltaTime = time - this._lastTime;
        this._lastTime = time;
        requestAnimationFrame(time => this.onAnimate(this, time));
    }

    public onResize(width: number, height: number) {
        this._canvas.width = this._camera.width = width;
        this._canvas.height = this._camera.height = height;
    }

    private onMessage(data) {
        this._gameState = GameState.deserialize(data);
    }
    
    private onDraw() {
        // EXAMPLE: Use the current server tick number as camera zoom factor
        this._camera.zoom = Math.sin(this._gameState.currentTick / TICK_RATE);

        // EXAMPLE: White background
        this._context.resetTransform();
        this._context.fillStyle = 'white';
        this._context.fillRect(0, 0, this._camera.width, this._camera.height);

        // EXAMPLE: Red unit-sized square
        this._context.setTransform(this._camera.matrix);
        this._context.fillStyle = 'red';
        this._context.fillRect(-0.5, -0.5, 1.0, 1.0);
    }

    private onAnimate(self, time) {
        this.onDraw();
        this._lastTime = time;
        requestAnimationFrame(time => self.onAnimate(self, time));
    }
}

window.addEventListener('load', () => {
    const canvas = <HTMLCanvasElement> document.getElementById('game');
    const client = new Client(canvas);

    // Bind events
    window.addEventListener('resize', () =>
        client.onResize(window.innerWidth, window.innerHeight)
    );

    // Fire the first resize event to initialize the viewport size before animating
    client.onResize(window.innerWidth, window.innerHeight);
    requestAnimationFrame(time => client.onStart(time));
});
