<script lang="ts">
	import '../app.css';
    import { page } from '$app/state';
	import { crossfade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { Toaster } from '$lib/components/ui/sonner';
    import WS from '$lib/ws/wsclient.svelte';
	import { WifiFade } from 'svelte-svg-spinners';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import Game from "@lucide/svelte/icons/gamepad-2";
	import FolderSearch from "@lucide/svelte/icons/folder-search";
	import UserSearch from "@lucide/svelte/icons/user-search";
	import Settings from "@lucide/svelte/icons/settings";
	import Power from "@lucide/svelte/icons/power";
	import Map from "@lucide/svelte/icons/map";
	import Play from "@lucide/svelte/icons/play";
	import Tally from "@lucide/svelte/icons/tally-5";
    import { Message, Recieves } from '$types/messages';
    import { toast } from 'svelte-sonner';
    import RconConnected from '$lib/ws/topics/rconConnected.svelte';
	
	let { children } = $props();

	const links = [
		{ Icon: Game, href: "/", title: "Game View" },
		{ Icon: UserSearch, href: "/playerHistory", title: "Player History" },
		{ Icon: FolderSearch, href: "/gameHistory", title: "Game History" },
		{ Icon: Map, href: "/casual", title: "Casual Map Selection" },
		{ Icon: Tally, href: "/killTracker", title: "Weapon Kill Counts" }, 
		{ Icon: Settings, href: "/settings", title: "Settings" }
	]

	const [send, recieve] = crossfade({
		duration: 500,
		easing: quintOut
	});

	WS.on(Message.Success, (message) => toast.success(message));
	WS.on(Message.Warning, (message) => toast.warning(message));
	WS.on(Message.Error, (message) => toast.error(message));
	WS.on(Message.OfferStartMenuShortcut, () => {
		toast("Would you like to create a start menu shortcut for TFView?", {
			action: {
				label: "Create",
				onClick: () => WS.send(Recieves.WantsStartMenuShortcut, true)
			},
			onDismiss: () => WS.send(Recieves.WantsStartMenuShortcut, false),
			closeButton: true,
			duration: Number.POSITIVE_INFINITY
		});
	});

	const closeApp = (closeGame: boolean) => {
		WS.send(Recieves.CloseApp, closeGame);
		WS.closed = true;
	}

	let unloading = $state(false);
</script>

<svelte:window onbeforeunload={() => unloading = true} />

<Toaster richColors />

<AlertDialog.Root open={WS.status === "disconnected" && !unloading && !WS.closed}>
	<AlertDialog.Content style="z-index: 100">
		<AlertDialog.Title>Connection with backend failed</AlertDialog.Title>
		<p>Please confirm that the backend is running</p>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root open={WS.closed}>
	<AlertDialog.Content style="z-index: 100">
		<AlertDialog.Title>Backend Closed</AlertDialog.Title>
		<p>You may close this page if you wish.</p>
	</AlertDialog.Content>
</AlertDialog.Root>

<div class="flex h-full">
	<div class="w-12 border-r-2 flex flex-col items-center py-1 shrink-0">
		{#each links as { Icon, href, title }}
			<div {title} class="relative w-full flex justify-center items-center py-1">
				{#if page.url.pathname === href}
					<div class="absolute top-0 left-0 bg-accent h-full z-0 border-r-2
					border-primary" style="width: calc(100% + 2px)"
					in:recieve={{ key: "location" }}
					out:send={{ key: "location" }}
					></div>
				{/if}
				<a {href} class="z-10 relative">
					<Icon size={32} />
				</a>
			</div>
		{/each}
		<div class="flex-grow"></div>
		{#if WS.status === "connecting" || WS.status === "disconnected"}
			<WifiFade dur="0.2" />
		{/if}
		{#if !RconConnected.connected}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger class="py-1" onclick={() => WS.send(Recieves.LaunchGame, undefined)}>
						<Play size={24} />
					</Tooltip.Trigger>
					<Tooltip.Content>
						Launch TF2
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="py-1">
				<Power size={24} color={RconConnected.connected ? "var(--color-primary)" : "white"} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item onclick={() => closeApp(false)}>
					Close TFView
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled={!RconConnected.connected}
					onclick={() => WS.send(Recieves.CloseGame, undefined)}>
					Close TF2
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled={!RconConnected.connected}
					onclick={() => closeApp(true)}>
					Close All
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="flex-grow max-w-full">
		{@render children()}
	</div>
</div>
