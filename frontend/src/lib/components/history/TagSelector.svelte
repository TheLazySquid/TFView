<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Tag from "@lucide/svelte/icons/tag";
    import CircleX from "@lucide/svelte/icons/circle-x";
    import CirclePlus from "@lucide/svelte/icons/circle-plus";
    import Settings from "$lib/ws/topics/settings.svelte";
    import type { Snippet } from "svelte";
    import { watch } from "runed";

    interface Props {
        you?: boolean;
        friend?: boolean;
        tags?: string[];
        tagsObj?: Record<string, boolean>;
        onChange?: () => void;
        children?: Snippet;
    }

    let { you, friend, tags = $bindable(), tagsObj = $bindable({}), onChange, children }: Props = $props();
    if(tags) tagsObj = Object.fromEntries(tags.map((t) => [t, true]));

    watch(() => Object.values(tagsObj), () => {
        if(tags) {
            tags = Object.keys(tagsObj).filter((key) => tagsObj[key]);
        }

        onChange?.();
    }, { lazy: true });

    let hasTags = $derived(Settings.settings.tags.filter((t) => tagsObj[t.id]));
    let missingTags = $derived(Settings.settings.tags.filter((t) => !tagsObj[t.id]));
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
        <button onclick={() => tagsObj[tag.id] = false}
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
                    <DropdownMenu.Item onclick={() => tagsObj[tag.id] = true}>
                        <Tag size={16} color={tag.color} />
                        {tag.name}
                    </DropdownMenu.Item>
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    {/if}
</div>