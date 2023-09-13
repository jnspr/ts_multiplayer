export const TICK_RATE: number = 60.0;
export const TICK_INTERVAL: number = 1000.0 / TICK_RATE;

/**
 * An example for a game state that is shared between client and session server
 */
export class GameState {
    constructor(
        public currentTick: number
    ) {}

    public static empty(): GameState {
        return new GameState(0);
    }

    public serialize(): string {
        return JSON.stringify({
            currentTick: this.currentTick
        });
    }

    public static deserialize(serialized: string): GameState {
        const fields = JSON.parse(serialized);
        return new GameState(fields.currentTick);
    }
}
