<script lang="ts">
    import { nameColors } from "$lib/consts";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import type { ChatEntry } from "$types/lobby";
    import { Recieves } from "$types/messages";
    import type { ChatSearchParams } from "$types/search";
    import Send from "@lucide/svelte/icons/send";
    import { onDestroy, onMount } from "svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import Time from "../Time.svelte";
    import Game from "$lib/ws/pages/game.svelte";
    import Separator from "./Separator.svelte";

    let { id }: { id?: string } = $props();
    let team = $state(false);
    let message = $state("");

    function onKeydown(e: KeyboardEvent) {
        if(e.code === "Enter") send();
    }

    function send() {
        if(message.length === 0) return;

        if(team) WS.send(Recieves.ChatTeam, message);
        else WS.send(Recieves.Chat, message);
        message = "";
    }

    const chat = new InfiniteList<ChatEntry, ChatSearchParams>({
        listId: "chat",
        filter: (item, params) => item.type === "event" || !params.id || item.senderId === params.id,
        params: { id },
        reverse: true
    });
    
    let scrollContainer: HTMLElement;
    onMount(() => chat.setScrollContainer(scrollContainer));
    onDestroy(() => chat.destroy());
</script>

<div class="max-h-full h-full min-h-0 flex flex-col gap-2">
    <div class="overflow-y-auto grow min-h-0 grid auto-rows-max gap-x-2" bind:this={scrollContainer}
        style="grid-template-columns: auto 1fr">
        <div class="col-span-2">
            <InfiniteLoading on:infinite={chat.infiniteHandler} direction="top"
                identifier={chat.identifier}>
                <div slot="noResults"></div>
                <div slot="noMore"></div>
            </InfiniteLoading>
        </div>
        {#if chat.items.length === 0}
            <div class="col-span-2 text-center text-zinc-400 pt-2">
                No Chat Messages Recorded
            </div>
        {/if}
        {#each chat.items as item, i}
            {#if item.type === "event"}
                {#if chat.items[i - 1] && chat.items[i - 1].type !== "event"}
                    <Separator class="col-span-2">{item.text}</Separator>
                {/if}
            {:else}
                {@const player = Game.playersMap.get(item.senderId)}
                <div class="text-zinc-400 content-start whitespace-nowrap">
                    <Time timestamp={item.timestamp} type="time" />
                </div>
                <div class="text-[0px] *:text-base">
                    {#if item.dead}
                        <span class="mr-1">*DEAD*</span>
                    {/if}
                    {#if item.team}
                        <span class="mr-1">(TEAM)</span>
                    {/if}
                    <button style="color: {nameColors[item.senderTeam]}" class:italic={player?.nickname}
                        onclick={() => Game.openPlayer(item.senderId)}>
                        {player?.nickname ?? item.name}
                    </button>
                    <span>: {item.text}</span>
                </div>
            {/if}
        {/each}
    </div>
    {#if !id}
        <div class="w-full flex gap-2 pb-1">
            <button class="bg-white text-black rounded-md px-3 py-1"
                onclick={() => team = !team}>
                {team ? "Team" : "Public"}
            </button>
            <input class="border-1 rounded-sm flex-grow px-1" onkeydown={onKeydown}
                placeholder="Type here..." bind:value={message} />
            <button onclick={send}>
                <Send />
            </button>
        </div>
    {/if}
</div>