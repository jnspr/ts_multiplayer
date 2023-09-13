/**
 * A utility class for world-to-viewport calculations
 */
export class Camera {
    // Calculation parameters
    private _posX: number = 0.0;
    private _posY: number = 0.0;
    private _zoom: number = 1.0;
    private _width: number = 1;
    private _height: number = 1;

    // Internal state
    private _matrix: DOMMatrix;
    private _isDirty: boolean = true;

    // Getters and setters for calculation parameters
    get posX() { return this._posX; }
    set posX(value) {
        this._posX = value;
        this._isDirty = true;
    }
    get posY() { return this._posY; }
    set posY(value) {
        this._posY = value;
        this._isDirty = true;
    }
    get zoom() { return this._zoom; }
    set zoom(value) {
        this._zoom = value;
        this._isDirty = true;
    }
    get width() { return this._width; }
    set width(value) {
        this._width = value;
        this._isDirty = true;
    }
    get height() { return this._height; }
    set height(value) {
        this._height = value;
        this._isDirty = true;
    }

    // Gets the matrix for the current calculation parameters
    get matrix(): DOMMatrix {
        if (this._isDirty) {
            this._matrix = new DOMMatrix()
                .translate(this._width * 0.5, this._height * 0.5)
                .scale(this.height * this._zoom, this.height * this._zoom)
                .translate(this._posX, this._posY);
            this._isDirty = false;
        }
        return this._matrix;
    }
}
