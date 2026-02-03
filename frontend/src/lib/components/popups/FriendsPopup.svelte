<script lang="ts">
    import type { PopupArguments } from "$lib/popups";
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { PastPlayer } from "$types/data";
    import Avatar from "../player/Avatar.svelte";
    import Nameplate from "../player/Nameplate.svelte";
    import Game from "$lib/ws/pages/game.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";

    let name = $state.raw("");
    let friends: PastPlayer[] | null | undefined = $state.raw(undefined);

    const onOpen = (opts: PopupArguments["friends"]) => {
        name = opts.name;
        friends = undefined;

        WS.sendAndRecieve(Recieves.GetFriends, opts.id3)
            .then(f => friends = f);

        return opts.name;
    }
</script>

<Popup type="friends" {onOpen}>
    <Dialog.Header>
        <Dialog.Title>Known Friends of {name}</Dialog.Title>
    </Dialog.Header>
    <div class="text-xs italic">This only includes players who you have encountered at least once</div>
    {#if friends?.length}
        <div class="flex flex-col max-h-[500px] overflow-y-auto">
            {#each friends as friend}
                <div class="flex items-center gap-2">
                    <Avatar avatarHash={friend.avatarHash} name={friend.lastName} />
                    <Nameplate current={false} player={friend} grow={true} onpointerdown={e => e.stopPropagation()}
                        onclick={() => Game.openPlayer(friend.id)} />
                </div>
            {/each}
        </div>
    {:else if friends}
        <div>This user has no known friends.</div>
    {:else if friends === null}
        <div>Friends list could not be loaded. The user may have a private profile.</div>
    {:else}
        <div>Loading...</div>
    {/if}
</Popup>