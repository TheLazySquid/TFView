<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Tag from "@lucide/svelte/icons/tag";
    import CircleX from "@lucide/svelte/icons/circle-x";
    import CirclePlus from "@lucide/svelte/icons/circle-plus";
    import Settings from "$lib/ws/topics/settings.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        you?: boolean;
        friend?: boolean;
        tagsObj?: Record<string, boolean>;
        onChange?: () => void;
        children?: Snippet;
    }

    let { you, friend, tagsObj = $bindable({}), onChange, children }: Props = $props();

    let hasTags = $derived(Settings.settings.tags.filter((t) => tagsObj[t.id]));
    let missingTags = $derived(Settings.settings.tags.filter((t) => !tagsObj[t.id]));

    function removeTag(id: string) {
        tagsObj[id] = false;
        onChange?.();
    }

    function addTag(id: string) {
        tagsObj[id] = true;
        onChange?.();
    }
</script>

{#snippet uninteractiveTag(name: string, color: string)}
    <button class="flex items-center text-sm rounded-full px-1.5 bg-accent gap-1">
        <Tag size={12} color={color} />
        <div class="-mt-0.5">{name}</div>
    </button>
{/snippet}

<div class="flex items-center flex-wrap gap-1">
    {@render children?.()}
    {#if you}
        {@render uninteractiveTag("You", Settings.settings.userColor)}
    {/if}
    {#if friend}
        {@render uninteractiveTag("Steam Friend", Settings.settings.friendColor)}
    {/if}
    {#each hasTags as tag (tag.id)}
        <button onclick={() => removeTag(tag.id)}
        class="flex items-center text-sm rounded-full px-1.5 bg-accent gap-1">
            <Tag size={12} color={tag.color} />
            <div class="-mt-0.5">{tag.name}</div>
            <CircleX size={12} />
        </button>
    {/each}
    {#if missingTags.length > 0}
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <CirclePlus size={16} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="z-[100]">
                {#each missingTags as tag}
                    <DropdownMenu.Item onclick={() => addTag(tag.id)}>
                        <Tag size={16} color={tag.color} />
                        {tag.name}
                    </DropdownMenu.Item>
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    {/if}
</div>