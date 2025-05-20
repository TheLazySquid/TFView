import type { HistoryType, PastGame } from "$types/data";
import { HistoryMessages } from "$types/messages";
import { dataPath, fakeData } from "src/consts";
import { fakeHistory } from "src/fakedata/history";
import LogParser from "src/logParser";
import Socket from "src/socket";
import { join } from "node:path";
import fsp from "node:fs/promises";

export default class History {   
    static history: HistoryType = { pastGames: [] };
    static currentGame: PastGame | null = null;
    static gamesFile: Bun.BunFile;
    static pastGamesDir: string;
    static currentChunkNumber = 0;
    static currentChunk: PastGame[] = [];

    static init() {
        Socket.onConnect("history", (send) => {
            send(HistoryMessages.Initial, this.history);
        });

        if(fakeData) {
            this.history = fakeHistory;
            return;
        }

        this.loadInitial();
        this.listenToLog();
    }

    static async loadInitial() {
        // Past games are stored in 50 game chunks, with most recent at the start of the chunk
        this.pastGamesDir = join(dataPath, "pastGames");

        if(!await fsp.exists(this.pastGamesDir)) return;
        const numberOfChunks = (await fsp.readdir(this.pastGamesDir)).length;

        // read the most recent two, to guarantee we have >= 50 ready fast
        if(numberOfChunks > 0) {
            const chunk = await this.readChunk(numberOfChunks - 1);
            this.currentChunk = chunk;
            this.currentChunkNumber = numberOfChunks - 1;

            this.history.pastGames = [...chunk];
        }

        if(numberOfChunks > 1) {
            const chunk = await this.readChunk(numberOfChunks - 2);
            this.history.pastGames = this.history.pastGames.concat(chunk);
        }
    }

    static async readChunk(number: number): Promise<PastGame[]> {
        try {
            const text = await fsp.readFile(join(this.pastGamesDir, `${number}.json`));
            return JSON.parse(text.toString());
        } catch {
            return [];
        }
    }

    static mapChangeRegex = /(?:\n|^)Team Fortress\r?\nMap: (.+)/g;
    static listenToLog() {
        LogParser.on(this.mapChangeRegex, (data) => {
            this.onGameEnd();

            this.currentGame = {
                map: data[1],
                start: Date.now(),
                duration: 0,
                players: []
            }

            console.log("Game started:", this.currentGame);
        });
    }

    static onGameEnd() {
        if(!this.currentGame || fakeData) return;
        this.currentGame.duration = Date.now() - this.currentGame.start;

        // save the current game
        if(this.currentChunk.length === 50) {
            this.currentChunk = [];
            this.currentChunkNumber++;
        }
        this.currentChunk.unshift(this.currentGame);
        const file = join(this.pastGamesDir, `${this.currentChunkNumber}.json`);
        Bun.file(file).write(JSON.stringify(this.currentChunk));

        Socket.send("history", HistoryMessages.GameAdded, this.currentGame);
        this.history.pastGames.unshift(this.currentGame);
        
        console.log(`Recorded game: ${this.currentGame.map}`);
        this.currentGame = null;
    }
}