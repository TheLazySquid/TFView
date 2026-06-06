<script lang="ts">
    import Popups from "$lib/popups";
    import User from "@lucide/svelte/icons/square-user-round";

    let { avatarHash, name }: { avatarHash?: string, name: string } = $props();
    let hasErrored = $state(false);
</script>

{#if avatarHash && !hasErrored}
    <button onclick={() => Popups.open("profilePicture", { hash: avatarHash!, name })}
    class="contents">
        <img src="https://avatars.steamstatic.com/{avatarHash}_medium.jpg"
            class="w-8 h-8" alt="Avatar" onerror={() => hasErrored = true} />
    </button>
{:else}
    <User size={32} />
{/if}