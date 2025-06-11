import { networkPort } from "$shared/consts";
import type { Message, MessageTypes, RecievesKey, RecievesTypes } from "$types/messages";
import EventEmitter from "node:events";
import { join } from "node:path";

type Topic = "game" | "history" | "settings" | "global";
type WS = Bun.ServerWebSocket<{ topic: Topic }>;

export default class Socket {
    static topics: string[] = ["game", "history", "settings"];
    static events = new EventEmitter();
    static staticPath = join(__dirname, "..", "static");
    static server: Bun.Server;

    static init() {
        // listen for websocket connections
        this.server = Bun.serve({
            fetch: (req, server) => {
                const url = new URL(req.url);
                const parts = url.pathname.split("/").slice(1);

                // Handle websocket connections
                if(parts[0] === "ws") {
                    let topic = req.url.split("/").pop();
                    if(!this.topics.includes(topic)) {
                        return new Response("Invalid topic", { status: 400 });
                    }
    
                    let data = { topic };
                    if (server.upgrade(req, { data })) return;
    
                    return new Response("Upgrade failed", { status: 500 });
                }

                // Serve static files, if possible
                let isFile = parts.at(-1).indexOf(".") !== -1;
                
                let path: string;
                if(isFile) {
                    path = join(this.staticPath, url.pathname);
                } else if(url.pathname === "/") {
                    path = join(this.staticPath, "index.html");
                } else {
                    path = join(this.staticPath, ...parts.slice(0, -1), `${parts.at(-1)}.html`);
                }
                
                return new Response(Bun.file(path));
            },
            error() {
                return new Response(null, { status: 404 });
            },
            websocket: {
                message: (ws: WS, message: string) => {
                    let data = JSON.parse(message);

                    // Handle the websocket changing topics
                    if(data.navigate) {
                        ws.unsubscribe(ws.data.topic);
                        ws.data.topic = data.navigate;
                        ws.subscribe(data.navigate);

                        this.events.emit(`${data.navigate}-connect`, (channel: Message, data: any) => {
                            ws.send(JSON.stringify({ channel, data }));
                        });

                        return;
                    }

                    if(!data.channel) return;

                    let actions = {
                        reply: (response: any) => {
                            ws.send(JSON.stringify({
                                reply: data.id,
                                data: response
                            }));
                        },
                        ws
                    }

                    this.events.emit(data.channel.toString(), data.data, actions);
                },
                open: (ws: WS) => {
                    ws.subscribe(ws.data.topic);
                    ws.subscribe("global");

                    this.events.emit(`${ws.data.topic}-connect`, (channel: Message, data: any) => {
                        ws.send(JSON.stringify({ channel, data }));
                    });
                }
            },
            port: networkPort
        });
    }

    static onConnect<T extends Topic, C extends Message>
        (topic: T, callback: (send: (channel: C, data: MessageTypes[C]) => void) => void) {
        this.events.on(`${topic}-connect`, callback);
    }

    // I sincerely apologize for this type
    static on<C extends keyof RecievesTypes>(channel: C, callback: (data: RecievesKey<C, "send">, action: {
        reply: (response: RecievesKey<C, "reply">) => void,
        ws: WS
    }) => void) {
        this.events.on(channel.toString(), callback);
    }

    static send<T extends Topic, C extends Message>(topic: T, channel: C, data: MessageTypes[C]) {
        this.server.publish(topic, JSON.stringify({ channel, data }));
    }

    static sendOthers<T extends Topic, C extends Message>(ws: WS, topic: T, channel: C, data: MessageTypes[C]) {
        ws.publish(topic, JSON.stringify({ channel, data }));
    }
}