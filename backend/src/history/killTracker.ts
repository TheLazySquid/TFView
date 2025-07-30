import { Message } from "$types/messages";
import { flags } from "src/consts";
import { fakeKillCounts } from "src/fakedata/killCounts";
import Server from "src/net/server";
import Values from "src/settings/values";

export default class KillTracker {
    static init() {
        Server.onConnect("killcounts", (reply) => {
            if(flags.fakeData) {
                reply(Message.KillCounts, fakeKillCounts);
            } else {
                reply(Message.KillCounts, Values.get("killCounts"));
            }
        });
    }

    static onKill(weapon: string, crit: boolean) {
        let killCounts = Values.get("killCounts");

        if(killCounts) {
            killCounts[weapon] ??= [0, 0];
            killCounts[weapon][0]++;
            if(crit) killCounts[weapon][1]++;
            
            Values.save();
        } else {
            killCounts = { [weapon]: [1, crit ? 1 : 0] };
            Values.set("killCounts", killCounts);
        }

        Server.send("killcounts", Message.KillCountUpdate, { weapon, count: killCounts[weapon] });
    }
}