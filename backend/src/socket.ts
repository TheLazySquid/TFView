import { websocketPort } from "$shared/consts";
import type { GlobalMessageTypes, MessageTypes, RecievesKey, RecievesTypes } from "$types/messages";
import EventEmitter from "node:events";

type Type = keyof MessageTypes;
type WS = Bun.ServerWebSocket<{ type: Type }>;

export default class Socket {
    static types: Type[] = ["game", "history", "settings"];
    static allSockets: WS[] = [];
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

                    let actions = {
                        reply: (response: any) => {
                            ws.send("r" + type + JSON.stringify(response));
                        },
                        ws
                    }

                    this.events.emit(type, data, actions);
                },
                open: (ws: WS) => {
                    this.allSockets.push(ws);
                    this.sockets.get(ws.data.type).push(ws);

                    this.events.emit(`${ws.data.type}-connect`, (channel: string, data: any) => {
                        ws.send(channel.toString() + JSON.stringify(data));
                    });
                },
                close: (ws: WS) => {
                    const sockets = this.sockets.get(ws.data.type);
                    const index = sockets.findIndex(s => s == ws);
                    const allIndex = this.allSockets.findIndex(s => s == ws);
                    
                    if(index !== -1) sockets.splice(index, 1);
                    if(allIndex !== -1) this.allSockets.splice(allIndex, 1);
                }
            },
            port: websocketPort
        });
    }

    static onConnect<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, callback: (send: (channel: C, data: MessageTypes[T][C]) => void) => void) {
        this.events.on(`${type}-connect`, callback);
    }

    // I sincerely apologize for this type
    static on<C extends keyof RecievesTypes>(channel: C, callback: (data: RecievesKey<C, "send">, action: {
        reply: (response: RecievesKey<C, "reply">) => void,
        ws: WS
    }) => void) {
        this.events.on(channel.toString(), callback);
    }

    static replySame<C extends keyof GlobalMessageTypes>(ws: WS, channel: C, data: GlobalMessageTypes[C]) {
        ws.send(channel.toString() + JSON.stringify(data));
    }

    // Type is technically redundant since it always equals ws.data.type but it allows for better types
    static replyOthers<T extends Type, C extends keyof MessageTypes[T]>(ws: WS, type: T, channel: C, data: MessageTypes[T][C]) {
        const sockets = this.sockets.get(type);
        for(let socket of sockets) {
            if(socket === ws) continue;
            socket.send(channel.toString() + JSON.stringify(data));
        }
    }

    static send<T extends Type, C extends keyof MessageTypes[T]>
        (type: T, channel: C, data: MessageTypes[T][C]) {
        const websockets = this.sockets.get(type);

        for(let ws of websockets) {
            ws.send(channel.toString() + JSON.stringify(data));
        }
    }

    static sendAll<C extends keyof GlobalMessageTypes>(channel: C, data: GlobalMessageTypes[C]) {
        for(let socket of this.allSockets) {
            socket.send(channel.toString() + JSON.stringify(data));
        }
    }
}