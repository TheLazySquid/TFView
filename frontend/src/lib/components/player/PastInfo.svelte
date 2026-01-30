<script lang="ts">
    import Images from "@lucide/svelte/icons/images";
    import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
    import Avatar from "./Avatar.svelte";

    interface Props {
        names: string[];
        avatars: string[];
        name: string;
        avatarHash?: string;
    }

    let { names, avatars, name, avatarHash }: Props = $props();
</script>

{#if names.length > 1}
    <TextCursorInput />
    <div>Past names</div>
    <div>{names.filter(n => n !== name).join(", ")}</div>
{/if}

{#if avatars?.length > 1}
    <Images class="h-full" />
    <div class="content-center">Past profile pictures</div>
    <div class="flex items-center gap-1">
        {#each avatars as hash}
            {#if hash !== avatarHash}
                <Avatar avatarHash={hash} {name} />
            {/if}
        {/each}
    </div>
{/if}