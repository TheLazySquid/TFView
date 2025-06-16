import type { StoredPlayer } from "$types/data";
import { Message } from "$types/messages";
import { PageStateWithTags } from "./wsclient.svelte";

export default new class PlayerHistory extends PageStateWithTags {
    type = "playerhistory";
    players: StoredPlayer[] = $state([]);
    totalPlayers: number | undefined = $state();

    setup() {
        
    }
}