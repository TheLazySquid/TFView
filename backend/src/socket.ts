import type { MessageTypes, RecievesKey, RecievesTypes } from "$types/messages";
import EventEmitter from "node:events";

type Type = keyof MessageTypes;
type WS = Bun.ServerWebSocket<{ type: Type }>;

export default class Socket {
    static port = 7523;
    static types: Type[] = ["game", "history"];
    static sockets = new Map<Type, WS[]>();
    static events = new EventEmitter();

    static init() {
        for(let type of this.types) this.sockets.set(type, []);

        // listen for websocket connections
        Bun.serve({
            fetch: (req, server) => {
                let type = req.url.split("/").pop();
                if(!this.types.includes(type as Type)) {
                    return new Response("Invalid type", { status: 400 });
                }

                let data = { type };
                if (server.upgrade(req, { data })) return;

                return new Response("Upgrade failed", { status: 500 });
            },
            websocket: {
                message: (ws: WS, message: string) => {
                    let type = message[0];
                    let data = JSON.parse(message.slice(1));

                    this.events.emit(`${ws.data.type}-${type}`, data, (response: any) => {
                        ws.send("r" + type + JSON.stringify(response));
                    });
                },
                open: (ws: WS) => {
                    this.sockets.get(ws.data.type).push(ws);

                    this.events.emit(`${ws.data.type}-connect`, (channel: string, data: any) => {
                        ws.send(channel.toString() + JSON.stringify(data));
                    });
                },
                close: (ws: WS) => {
                    const sockets = this.sockets.get(ws.data.type);
                    const index = sockets.findIndex(s => s == ws);
                    if(index === -1) return;

                    sockets.splice(index, 1);
                }
            },
            port: this.port
        });
    }

    static onConnect<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, callback: (send: (channel: C, data: MessageTypes[T][C]) => void) => void) {
        this.events.on(`${type}-connect`, callback);
    }

    static on<T extends Type, C extends keyof RecievesTypes[T]>
        (type: T, channel: C, callback: (data: RecievesKey<T, C, "send">,
        reply: (response: RecievesKey<T, C, "reply">) => void) => void) {
        this.events.on(`${type}-${channel.toString()}`, callback);
    }

    static send<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, channel: C, data: MessageTypes[T][C]) {
        const websockets = this.sockets.get(type);

        for(let ws of websockets) {
            ws.send(channel.toString() + JSON.stringify(data));
        }
    }
}