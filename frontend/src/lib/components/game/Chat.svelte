<script lang="ts">
    import { nameColors } from "$lib/consts";
    import Game from "$lib/ws/game.svelte";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Send from "@lucide/svelte/icons/send";

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

    const messages = $derived(id ? Game.chat.filter(m => m.senderId === id) : Game.chat);
</script>

<div class="h-full flex flex-col gap-2">
    <div class="flex flex-col items-start overflow-y-auto grow">
        {#each messages as message}
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