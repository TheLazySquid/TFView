<script lang="ts">
    import { nameColors } from "$lib/consts";
    import { InfiniteList } from "$lib/ws/infiniteList.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import type { ChatMessage } from "$types/lobby";
    import { Recieves } from "$types/messages";
    import type { ChatSearchParams } from "$types/search";
    import Send from "@lucide/svelte/icons/send";
    import { onDestroy, onMount } from "svelte";
    import InfiniteLoading from "svelte-infinite-loading";
    import Time from "../Time.svelte";

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

    const chat = new InfiniteList<ChatMessage, ChatSearchParams>({
        listId: "chat",
        filter: (item, params) => !params.id || item.senderId === params.id,
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
            <InfiniteLoading on:infinite={chat.infiniteHandler} direction="top">
                <div slot="noResults"></div>
                <div slot="noMore"></div>
            </InfiniteLoading>
        </div>
        {#each chat.items as message}
            <div class="text-zinc-400 content-center"><Time timestamp={message.timestamp} type="time" /></div>
            <div class="text-[0px] *:text-base">
                {#if message.dead}
                    <span class="mr-1">*DEAD*</span>
                {/if}
                {#if message.team}
                    <span class="mr-1">(TEAM)</span>
                {/if}
                <span style="color: {nameColors[message.senderTeam]}">
                    {message.name}
                </span>
                <span>: {message.text}</span>
            </div>
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