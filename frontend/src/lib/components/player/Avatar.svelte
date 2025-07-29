<script lang="ts">
    import Popups from "$lib/popups";
    import User from "@lucide/svelte/icons/square-user-round";
    let { avatarHash, name }: { avatarHash?: string, name: string } = $props();
</script>

{#if avatarHash}
    <button onclick={() => Popups.open("profilePicture", { hash: avatarHash!, name })}
    class="contents">
        <img src="https://avatars.steamstatic.com/{avatarHash}_medium.jpg"
        class="w-8 h-8" alt="Avatar" />
    </button>
{:else}
    <User size={32} />
{/if}