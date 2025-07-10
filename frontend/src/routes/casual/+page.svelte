<script lang="ts">
	import { casualMaps } from "$shared/maps";
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

	WS.init("casual");
</script>

<div class="h-full overflow-auto pl-[30%]">
	{#each casualMaps as category}
		<h2 class="font-bold verdana">{category.name}</h2>
		<div>
			{#each category.maps as map}
				{@const mask = 1n << map.bit}
				{console.log(mask)}
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