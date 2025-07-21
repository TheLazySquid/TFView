<script lang="ts">
	import { casualMaps, type CasualMapCategory } from "$shared/maps";
	import { Switch } from "$lib/components/ui/switch";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Casual from "$lib/ws/pages/casual.svelte";

	const updateProfile = () => {
		if(!Casual.selectedProfile) return;

		WS.send(Recieves.UpdateCasualProfile, {
			id: Casual.selectedProfileId,
			name: Casual.selectedProfile.name,
			selection: Casual.selection.map(Number)
		});
	}

	const getMasks = (category: CasualMapCategory) => {
		let masks: bigint[] = new Array(7).fill(0n);
		for(let map of category.maps) {
			masks[map.number] |= 1n << map.bit;
		}

		return masks;
	}

	WS.init("casual");
</script>

<div class="h-full overflow-auto flex flex-col items-center gap-y-4">
	{#each casualMaps as category}
		{@const masks = getMasks(category)}
		<div class="grid gap-x-2" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		width: min(90%, 530px)">
			<h2 class="font-bold verdana col-span-full flex items-center gap-2">
				<Switch bind:checked={
					() => Casual.selection.some((s, i) => (s & masks[i]) > 0n),
					(checked) => {
						for(let i = 0; i < Casual.selection.length; i++) {
							if(checked) Casual.selection[i] |= masks[i];
							else Casual.selection[i] &= ~masks[i];
						}
						updateProfile();
					}
				} />
				{category.name}
			</h2>
			{#each category.maps as map}
				{@const mask = 1n << map.bit}
				<div class="flex items-center gap-2">
					<Switch bind:checked={
						() => (Casual.selection[map.number] & mask) > 0n,
						(checked) => {
							if (checked) Casual.selection[map.number] |= mask;
							else Casual.selection[map.number] &= ~mask;
							updateProfile();
						}
					} />
					<div>{map.name}</div>
				</div>
			{/each}
		</div>
	{/each}
</div>