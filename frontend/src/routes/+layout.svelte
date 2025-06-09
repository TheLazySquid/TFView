<script lang="ts">
	import '../app.css';
    import { page } from '$app/state';
	import { crossfade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { Toaster } from '$lib/components/ui/sonner';
    import WS from '$lib/ws/wsclient.svelte';
	import { WifiFade } from 'svelte-svg-spinners';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import Game from "@lucide/svelte/icons/gamepad-2";
	import FolderClock from "@lucide/svelte/icons/folder-clock";
	import Settings from "@lucide/svelte/icons/settings";
    import { GlobalMessages } from '$types/messages';
    import { toast } from 'svelte-sonner';
	
	let { children } = $props();

	const links = [
		{ Icon: Game, href: "/" },
		{ Icon: FolderClock, href: "/history" },
		{ Icon: Settings, href: "/settings" }
	]

	const [send, recieve] = crossfade({
		duration: 500,
		easing: quintOut
	});

	WS.onGlobal(GlobalMessages.Warning, (message) => toast.warning(message));
	WS.onGlobal(GlobalMessages.Error, (message) => toast.error(message));
</script>

<Toaster richColors />

<AlertDialog.Root open={WS.status === "disconnected"}>
	<AlertDialog.Content style="z-index: 100">
		<h1 class="text-2xl verdana">Connection with backend failed</h1>
		<p>Please confirm that the backend is running</p>
	</AlertDialog.Content>
</AlertDialog.Root>

<div class="flex h-full">
	<div class="w-12 border-r-2 flex flex-col items-center py-1 shrink-0">
		{#each links as { Icon, href }}
			<div class="relative w-full flex justify-center items-center py-1">
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
	</div>
	<div class="flex-grow">
		{@render children()}
	</div>
</div>
