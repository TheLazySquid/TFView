<script lang="ts">
    import type { Component, Snippet } from "svelte";
    import * as Resizable from "$lib/components/ui/resizable";
    import TeamView from "./TeamView.svelte";
    import Split from "@lucide/svelte/icons/table";
    import Together from "@lucide/svelte/icons/rows-3";
    import Game from "$lib/ws/game.svelte";

    let { children }: { children?: Snippet } = $props();

    const storageKey = "game-teamsSplit";
    let split = $state((localStorage.getItem(storageKey) ?? "true") === "true");

    const setSplit = (splitVal: boolean) => {
        split = splitVal;
        localStorage.setItem(storageKey, split ? "true" : "false");
    }
</script>

{#snippet splitButton(Icon: Component, value: boolean, className: string)}
    <button class="p-1 border {className}" class:bg-accent={split === value}
        onclick={() => setSplit(value)}>
        <Icon size={20} />
    </button>
{/snippet}

<div class="w-full h-full flex flex-col">
    <div class="flex grow min-h-0">
        {#if split}
            <Resizable.PaneGroup direction="horizontal">
                <Resizable.Pane>
                    <TeamView id={2} name="Red" />
                </Resizable.Pane>
                <Resizable.Handle />
                <Resizable.Pane>
                    <TeamView id={3} name="Blue" />
                </Resizable.Pane>
            </Resizable.PaneGroup>
        {:else}
            <TeamView name="Players" />
        {/if}
        {#if children}
            {@render children()}
        {/if}
    </div>
    <div class="border-t p-1 flex items-center">
        {@render splitButton(Split, true, "rounded-l-sm")}
        {@render splitButton(Together, false, "rounded-r-sm")}
        {#if Game.currentServer}
            <div class="pl-5">
                Map: <i>{Game.currentServer.map}</i>
            </div>
            <div class="pl-5">
                Server: <i>{Game.currentServer.hostname}</i>
            </div>
        {/if}
    </div>
</div>