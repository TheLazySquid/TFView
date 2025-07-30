<script lang="ts">
    import type { Component, Snippet } from "svelte";
    import * as Resizable from "$lib/components/ui/resizable";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import TeamView from "./TeamView.svelte";
    import Settings from "@lucide/svelte/icons/settings";
    import Split from "@lucide/svelte/icons/table";
    import Together from "@lucide/svelte/icons/rows-3";
    import TV from "@lucide/svelte/icons/tv";
    import Game from "$lib/ws/pages/game.svelte";
    import { columns } from "./state.svelte";

    let { children }: { children?: Snippet } = $props();

    const splitKey = "game-teamsSplit";
    let split = $state((localStorage.getItem(splitKey) ?? "true") === "true");

    const setSplit = (splitVal: boolean) => {
        split = splitVal;
        localStorage.setItem(splitKey, split ? "true" : "false");
    }

    const spectatorsKey = "game-showSpectators";
    let showSpectators = $state(localStorage.getItem(spectatorsKey)=== "true");
    let spectators = $derived(Game.players.filter(p => p.team === 1).length);

    const toggleShowSpectators = () => {
        showSpectators = !showSpectators;
        localStorage.setItem(spectatorsKey, showSpectators ? "true" : "false");
    }

    const saveColumns = () => {
        localStorage.setItem("game-columns", JSON.stringify($state.snapshot(columns)))
    }
</script>

{#snippet splitButton(Icon: Component, value: boolean, className: string)}
    <button class="p-1 border {className}" class:bg-accent={split === value}
        onclick={() => setSplit(value)}>
        <Icon size={20} />
    </button>
{/snippet}

<div class="w-full h-full flex flex-col">
    <div class="grow min-h-0">
        <Resizable.PaneGroup direction="vertical" autoSaveId="players-spectators">
            <Resizable.Pane>
                <div class="flex w-full h-full">
                    {#if split}
                        <Resizable.PaneGroup direction="horizontal" autoSaveId="teams-split">
                            <Resizable.Pane>
                                <TeamView ids={[3]} name="Blue" inSplit={true} />
                            </Resizable.Pane>
                            <Resizable.Handle />
                            <Resizable.Pane>
                                <TeamView ids={[2]} name="Red" inSplit={true} />
                            </Resizable.Pane>
                        </Resizable.PaneGroup>
                    {:else}
                        <TeamView name="Players" />
                    {/if}
                    {@render children?.()}
                </div>
            </Resizable.Pane>
            {#if showSpectators}
                <Resizable.Handle />
                <Resizable.Pane defaultSize={40}>
                    <TeamView ids={[1]} name="Spectators" spectator={true} />
                </Resizable.Pane>
            {/if}
        </Resizable.PaneGroup>
    </div>
    <div class="border-t p-1 flex items-center">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger class="pr-3 pl-1">
                <Settings size={20} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.class}>Class</DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.killstreak}>Killstreak</DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.kd}>K/D</DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.ping}>Ping</DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.health}>Health</DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem onCheckedChange={saveColumns} bind:checked={columns.encounters}>Encounters</DropdownMenu.CheckboxItem>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
        {@render splitButton(Split, true, "rounded-l-sm")}
        {@render splitButton(Together, false, "rounded-r-sm")}
        <button class="ml-3 p-1 border rounded-sm flex items-center gap-2" class:bg-accent={showSpectators}
            onclick={toggleShowSpectators}>
            <TV size={20} /> ({spectators})
        </button>
        {#if Game.currentServer}
            <div class="pl-3">
                Map: <i>{Game.currentServer.map}</i>
            </div>
            <div class="pl-5">
                Server: <i>{Game.currentServer.hostname}</i>
            </div>
        {:else}
            <div class="pl-3">
                Current game not detected
            </div>
        {/if}
    </div>
</div>