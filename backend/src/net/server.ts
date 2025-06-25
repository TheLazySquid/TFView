import { networkPort } from "$shared/consts";
import type { MessageTypes, RecievesTypes, SentMessage } from "$types/messages";
import EventEmitter from "node:events";
import { join } from "node:path";
import Log from "../log";
import { root } from "src/consts";

export type Topic = "game" | "playerhistory" | "gamehistory" | "settings" | "global";
export type WS = Bun.ServerWebSocket<{ topic: Topic }>;

export default class Server {
    static topics: string[] = ["game", "playerhistory", "gamehistory", "settings"];
    static events = new EventEmitter();
    static staticPath = join(root, "static");
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

                        this.events.emit(`${data.navigate}-connect`, (channel: any, data: any) => {
                            ws.send(JSON.stringify({ channel, data }));
                        });

                        return;
                    }

                    if(data.channel === undefined) return;

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
                    Log.info("Websocket connection established:", ws.data.topic);
                    ws.subscribe(ws.data.topic);
                    ws.subscribe("global");

                    const callback = (channel: any, data: any) => {
                        ws.send(JSON.stringify({ channel, data }));
                    }
                    this.events.emit(`${ws.data.topic}-connect`, callback);
                    this.events.emit(`global-connect`, callback);
                }
            },
            port: networkPort
        });
    }

    static onConnect<C extends MessageTypes["channel"]>(topic: Topic, callback: (send: (channel: C, data:
        Extract<MessageTypes, SentMessage<C, any>>["data"]) => void) => void) {
        this.events.on(`${topic}-connect`, callback);
    }

    // I sincerely apologize for this type
    static on<C extends RecievesTypes["channel"]>(channel: C, callback: (data: Extract<RecievesTypes, SentMessage<C, any>>["data"], action: {
        reply: (response: Extract<RecievesTypes, SentMessage<C, any>>["replyType"]) => void,
        ws: WS
    }) => void) {
        this.events.on(channel.toString(), callback);
    }

    static send<C extends MessageTypes["channel"]>(topic: Topic, channel: C, data: Extract<MessageTypes, SentMessage<C, any>>["data"]) {
        this.server.publish(topic, JSON.stringify({ channel, data }));
    }

    static sendTo<C extends MessageTypes["channel"]>(ws: WS, channel: C, data: Extract<MessageTypes, SentMessage<C, any>>["data"]) {
        ws.send(JSON.stringify({ channel, data }));
    }

    static sendOthers<C extends MessageTypes["channel"]>(ws: WS, topic: Topic, channel: C, data: Extract<MessageTypes, SentMessage<C, any>>["data"]) {
        ws.publish(topic, JSON.stringify({ channel, data }));
    }
}