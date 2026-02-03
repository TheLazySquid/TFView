<script lang="ts">
    import type { Tag } from "$types/data";
	import GripVertical from "@lucide/svelte/icons/grip-vertical";
    import Trash from "@lucide/svelte/icons/trash-2";
	import ColorPicker from "svelte-awesome-color-picker";
	import { watch } from "runed";
	import { Checkbox } from "$lib/components/ui/checkbox";
	
	interface Props {
		tag: Tag;
		ondelete: (tag: Tag) => void;
		onupdate: () => void;
		dragDisabled: boolean;
	}

	let { tag = $bindable(), ondelete, onupdate, dragDisabled = $bindable() }: Props = $props();
	let lastName = tag.name;

	const onchange = () => {
		if(tag.name.length === 0) {
			tag.name = lastName;
		} else {
			lastName = tag.name;
			onupdate();
		}
	}

	// Update when the color changes (onInput sucks)
	watch([() => tag.color, () => tag.highlight], onupdate, { lazy: true });
</script>

<Checkbox class="mb-1" bind:checked={tag.highlight} />

<div class="picker">
	<ColorPicker bind:hex={tag.color} label="" isAlpha={false} />
</div>

<input class="border-b border-zinc-600 w-[250px] outline-none"
	bind:value={tag.name} {onchange} />

<button onclick={() => ondelete(tag)}>
	<Trash />
</button>

<button class={dragDisabled ? "cursor-grab" : "cursor-grabbing"}
onpointerdown={() => dragDisabled = false}>
	<GripVertical />
</button>

<style>
    .picker {
        --cp-bg-color: #333;
		--cp-border-color: white;
		--cp-text-color: white;
		--cp-input-color: #555;
		--cp-button-hover-color: #777;
    }
</style>