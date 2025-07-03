import { networkPort } from "$shared/consts";
import { Recieves, type MessageTypes, type Page, type RecievesTypes, type SentMessage } from "$types/messages";
import EventEmitter from "node:events";
import { join } from "node:path";
import Log from "../log";
import { root } from "src/consts";

export type Topic = "game" | "playerhistory" | "gamehistory" | "settings" | "directories" | "tags" | "global";
export type WS = Bun.ServerWebSocket<{ page: Page }>;

const topics: Record<Page, Topic[]> = {
    game: ["game", "tags", "global"],
    playerhistory: ["playerhistory", "tags", "global"],
    gamehistory: ["gamehistory", "tags", "global"],
    settings: ["settings", "directories", "global"],
    setup: ["directories", "global"]
}

export default class Server {
    static events = new EventEmitter();
    static staticPath = join(root, "static");
    static server: Bun.Server;
    static setupMode = false;

    static init() {
        this.on(Recieves.FinishSetup, (_, { reply }) => {
            this.setupMode = false;
            reply(true);
        });

        // listen for websocket connections
        this.server = Bun.serve({
            fetch: (req, server) => {
                const url = new URL(req.url);
                const parts = url.pathname.split("/").slice(1);

                // Handle websocket connections
                if(parts[0] === "ws") {
                    let page = req.url.split("/").pop() as Page;
                    if(!topics[page]) return new Response("Invalid page", { status: 400 });
    
                    let data = { page };
                    if (server.upgrade(req, { data })) return;
    
                    return new Response("Upgrade failed", { status: 500 });
                }

                // Serve static files, if possible
                let isFile = parts.at(-1).indexOf(".") !== -1;

                if(!isFile && this.setupMode && url.pathname !== "/setup") {
                    return Response.redirect("/setup", 307);
                }
                
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
                        if(!topics[data.navigate]) {
                            Log.error("Invalid page navigation:", data.navigate);
                            return;
                        }

                        // Unsubscribe from the current page's topics and subscribe to the new page's topics
                        for(let topic of topics[ws.data.page]) ws.unsubscribe(topic);

                        const callback = (channel: any, data: any) => {
                            ws.send(JSON.stringify({ channel, data }));
                        }
                        ws.data.page = data.navigate;
                        for(let topic of topics[data.navigate]) {
                            ws.subscribe(topic);
                            this.events.emit(`${topic}-connect`, callback);
                        }

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
                    Log.info("Websocket connection established:", ws.data.page);

                    const callback = (channel: any, data: any) => {
                        ws.send(JSON.stringify({ channel, data }));
                    }

                    for(let topic of topics[ws.data.page]) {
                        ws.subscribe(topic);
                        this.events.emit(`${topic}-connect`, callback);
                    }
                }
            },
            port: networkPort
        });

        Log.info(`Server open on http://localhost:${networkPort}`)
    }

    static close() {
        this.server.stop(true);
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

    static once<C extends RecievesTypes["channel"]>(channel: C, callback: (data: Extract<RecievesTypes, SentMessage<C, any>>["data"], action: {
        reply: (response: Extract<RecievesTypes, SentMessage<C, any>>["replyType"]) => void,
        ws: WS
    }) => void) {
        this.events.once(channel.toString(), callback);
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