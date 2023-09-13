export const PORT_OFFSET_CLIENT: number = 0;
export const PORT_OFFSET_SESSION: number = 1;

export function isDevelopment(): boolean {
    if (typeof window !== 'undefined') {
        return 'IS_DEVELOPMENT' in window;
    }
    if (typeof global !== 'undefined') {
        return 'IS_DEVELOPMENT' in global;
    }
    return true;
}
