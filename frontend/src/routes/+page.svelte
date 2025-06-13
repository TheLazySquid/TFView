<script lang="ts">
    import type { Component } from "svelte";
    import Game from "$lib/ws/game.svelte";
    import Killfeed from "$lib/components/game/Killfeed.svelte";
    import Chat from "$lib/components/game/Chat.svelte";
    import Teams from "./game/Teams.svelte";
    import * as Resizable from "$lib/components/ui/resizable";
    import PlayerPopup from "../lib/components/popups/PlayerPopup.svelte";
    import PastGamePopup from "../lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import ProfilePicturePopup from "$lib/components/popups/ProfilePicturePopup.svelte";
    import Swords from "@lucide/svelte/icons/swords";
    import Message from "@lucide/svelte/icons/message-square-more";
    import Close from "@lucide/svelte/icons/chevron-last";
    import Server from "@lucide/svelte/icons/server";
    import ServerInfo from "./game/ServerInfo.svelte";

    Game.init();

    const storageKey = "game-openPanel";
    let openPanel = $state(localStorage.getItem(storageKey));

    const toggle = (type: string) => {
        if(openPanel === type) {
            openPanel = null;
            localStorage.removeItem(storageKey);
        } else {
            openPanel = type
            localStorage.setItem(storageKey, openPanel);
        }
    }
</script>

<PlayerPopup />
<PastGamePopup />
<PastPlayerPopup />
<ProfilePicturePopup />

{#snippet button(Icon: Component, type: string)}
    <button class="bg-accent py-3 px-1 rounded-l-md"
        onclick={() => toggle(type)}>
        {#if openPanel != type}
            <Icon size={20} />
        {:else}
            <Close size={20} />
        {/if}
    </button>
{/snippet}

{#snippet buttons()}
    <div class="flex flex-col gap-2 pt-2">
        {@render button(Message, "chat")}
        {@render button(Swords, "killfeed")}
        {@render button(Server, "server")}
    </div>
{/snippet}

<div class="w-full h-full">
    {#if openPanel}
        <Resizable.PaneGroup direction="horizontal">
            <Resizable.Pane>
                <div class="w-full h-full flex gap-2">
                    <Teams />
                    {@render buttons()}
                </div>
            </Resizable.Pane>
            <Resizable.Handle />
            <Resizable.Pane>
                <div class="px-2 w-full h-full">
                    {#if openPanel === "chat"}
                        <Chat />
                    {:else if openPanel === "killfeed"}
                        <Killfeed />
                    {:else if openPanel === "server"}
                        <ServerInfo />
                    {/if}
                </div>
            </Resizable.Pane>
        </Resizable.PaneGroup>
    {:else}
        <div class="w-full h-full flex gap-2">
            <Teams />
            <div class="w-px bg-accent"></div>
            {@render buttons()}
        </div>
    {/if}
</div>