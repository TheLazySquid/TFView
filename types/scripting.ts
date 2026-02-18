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
    rcon: {
        run(command: string): Promise<string | null>;
    },
    steamPath: string;
    tfPath: string;
}

export interface PersistentScriptContext extends ScriptContext {
    watchConsole: (regex: RegExp, callback: (data: RegExpExecArray) => void) => () => void;
}

export interface PersistentScript {
    exports: any;
    context: PersistentScriptContext;
    cleanup: (() => void)[];
}