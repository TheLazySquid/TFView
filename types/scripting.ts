export interface ScriptContext {
    toast: {
        success(message: string): void;
        error(message: string): void;
        warning(message: string): void;
    },
    log: {
        info(...messages: string[]): void;
        error(...messages: string[]): void;
        warning(...messages: string[]): void;
    },
    steamPath: string;
    tfPath: string;
}