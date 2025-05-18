<script lang="ts">
    import { chatBlue, chatRed, chatSpectator } from "$lib/consts";
    import Game from "$lib/game.svelte";
</script>

<div class="flex flex-col items-start">
    {#each Game.chat as message}
        <div class="text-[0px] *:text-base">
            {#if message.dead}
                <span class="mr-1">*DEAD*</span>
            {/if}
            {#if message.team}
                <span class="mr-1">(TEAM)</span>
            {/if}
            <span style="color: {message.senderTeam === 1 ? chatSpectator :
                message.senderTeam === 2 ? chatRed : chatBlue}">
                {message.name}
            </span>
            <span>: {message.text}</span>
        </div>
    {/each}
</div>