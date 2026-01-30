<script lang="ts">
    import type { Component } from "svelte";
    import Game from "$lib/ws/pages/game.svelte";
    import Killfeed from "$lib/components/game/Killfeed.svelte";
    import Chat from "$lib/components/game/Chat.svelte";
    import Teams from "./game/Teams.svelte";
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Card from "$lib/components/ui/card";
    import PlayerPopup from "../lib/components/popups/PlayerPopup.svelte";
    import PastGamePopup from "../lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";
    import ProfilePicturePopup from "$lib/components/popups/ProfilePicturePopup.svelte";
    import Swords from "@lucide/svelte/icons/swords";
    import Message from "@lucide/svelte/icons/message-square-more";
    import Close from "@lucide/svelte/icons/chevron-last";
    import InputPopup from "$lib/components/popups/InputPopup.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import popups from "$lib/popups";

    WS.init("game");

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

    window.test = () => {
        popups.open("player", Game.players.find(p => p.name === "TheLazySquid"));
    }
</script>

<svelte:head>
	<title>Game View | TFView</title>
</svelte:head>

<PlayerPopup />
<PastGamePopup />
<PastPlayerPopup />
<ProfilePicturePopup />
<InputPopup />

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
    </div>
{/snippet}

<div class="w-full h-full relative">
    {#if (Game.players.length === 0 && !Game.currentServer) || Game.definitelyNotInGame}
        <div class="absolute top-0 left-0 w-full h-full backdrop-blur-xs z-10 flex items-center justify-center"
        style="background-color: rgba(0,0,0,0.5)">
            <Card.Root class="w-[500px]">
                <Card.Header>
                    <Card.Title class="text-xl verdana">No game is currently active</Card.Title>
                    <Card.Description>The game view will appear here once you join a game.</Card.Description>
                </Card.Header>
            </Card.Root>
        </div>
    {/if}
    {#if openPanel}
        <Resizable.PaneGroup direction="horizontal" autoSaveId="game-view">
            <Resizable.Pane>
                <Teams>
                    {@render buttons()}
                </Teams>
            </Resizable.Pane>
            <Resizable.Handle />
            <Resizable.Pane>
                <div class="px-2 w-full h-full">
                    {#if openPanel === "chat"}
                        <Chat />
                    {:else if openPanel === "killfeed"}
                        <Killfeed />
                    {/if}
                </div>
            </Resizable.Pane>
        </Resizable.PaneGroup>
    {:else}
        <div class="w-full h-full flex">
            <Teams />
            <div class="w-px bg-accent mr-2"></div>
            {@render buttons()}
        </div>
    {/if}
</div>