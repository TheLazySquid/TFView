<script lang="ts">
	import { casualMaps, type CasualMapCategory } from "$shared/maps";
	import { Switch } from "$lib/components/ui/switch";
    import WS from "$lib/ws/wsclient.svelte";
    import { Recieves } from "$types/messages";
    import Casual from "$lib/ws/pages/casual.svelte";
	import CirclePlus from "@lucide/svelte/icons/circle-plus";
	import Trash from "@lucide/svelte/icons/trash-2";
	import Pencil from "@lucide/svelte/icons/pencil";
    import InputPopup from "$lib/components/popups/InputPopup.svelte";
    import Popups from "$lib/popups";
    import type { CasualProfile } from "$types/data";
    import ConfirmPopup from "$lib/components/popups/ConfirmPopup.svelte";

	const updateProfile = () => {
		if(!Casual.selectedProfile) return;

		WS.send(Recieves.UpdateCasualProfile, {
			id: Casual.selectedProfileId,
			name: Casual.selectedProfile.name,
			selection: Casual.selection.map(Number)
		});
	}

	const getMasks = (category: CasualMapCategory) => {
		let masks: bigint[] = new Array(8).fill(0n);
		for(let map of category.maps) {
			masks[map.number] |= 1n << map.bit;
		}

		return masks;
	}

	const createNewProfile = () => {
		Popups.open("input", {
			title: "Create New Casual Profile",
			callback: (name) => {
				WS.send(Recieves.NewCasualProfile, name);
			}
		});
	}

	const renameProfile = (e: MouseEvent, profile: CasualProfile) => {
		e.stopPropagation();
		Popups.open("input", {
			title: "Rename Casual Profile",
			defaultValue: profile.name,
			callback: (name) => {
				profile.name = name;
				WS.send(Recieves.UpdateCasualProfile, {
					id: profile.id,
					name: profile.name,
					selection: profile.selection.map(Number)
				});
			}
		});
	}

	const deleteProfile = (e: MouseEvent, profile: CasualProfile) => {
		e.stopPropagation();
		Popups.open("confirm", {
			title: "Delete Casual Profile",
			message: `Are you sure you want to delete the profile "${profile.name}"?`,
			onConfirm: () => {
				WS.send(Recieves.DeleteCasualProfile, profile.id);
			}
		});
	}

	WS.init("casual");
</script>

<svelte:head>
	<title>Casual Map Selection | TFView</title>
</svelte:head>

<InputPopup />
<ConfirmPopup />

<div class="max-h-full flex">
	<div class="flex justify-end" style="width: max(270px, calc((100% - 550px) / 2));">
		<div class="flex flex-col pt-6 gap-1 w-[230px] pr-10">
			{#each Casual.profiles as profile}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div class="{profile.id === Casual.selectedProfileId ? "bg-primary" : "bg-accent"}
					text-left text-lg px-2 flex items-center casual-profile cursor-pointer"
					onclick={() => WS.send(Recieves.SelectCasualProfile, profile.id)}>
					<div class="flex-grow">{profile.name}</div>
					{#if Casual.profiles.length > 1}
						<button onclick={(e) => deleteProfile(e, profile)}>
							<Trash size={16} />
						</button>
					{/if}
					<button onclick={(e) => renameProfile(e, profile)}>
						<Pencil size={16} />
					</button>
				</div>
			{/each}
			<button class="flex justify-center" onclick={createNewProfile}>
				<CirclePlus />
			</button>
		</div>
	</div>
	<div class="flex flex-col gap-4 w-[550px] max-w-full max-h-full overflow-y-auto">
		{#each casualMaps as category}
			{@const masks = getMasks(category)}
			<div class="grid gap-x-2 w-full" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
				<h2 class="font-bold verdana col-span-full flex items-center gap-2 border-b">
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
</div>

<style>
	.casual-profile button {
		opacity: 0;
	}

	.casual-profile:hover button {
		opacity: 1;
	}
</style>