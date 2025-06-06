<script lang="ts">
    import Toggle from "svelte-toggle";

    let { done = $bindable() }: { done: boolean } = $props();

    let mastercomfig = $state(false);
    let password = $state("");
    $effect(() => { done = !!password });

    let updated = false;
    $effect(() => {
        if(!updated) { updated = true; return }
        window.electron.ipcRenderer.send("setRconInfo", { mastercomfig, password });
    });

    window.electron.ipcRenderer.invoke("getRconInfo").then((info: { password: string, mastercomfig: boolean }) => {
        password = info.password;
        mastercomfig = info.mastercomfig;
    });
</script>

<h1 class="text-2xl font-bold">Pick RCON options</h1>
<div class="flex items-center gap-2">
    <div>
        <Toggle label={null} toggledColor="var(--color-amber-700)"
        on:click bind:toggled={mastercomfig} />
    </div>
    Do you use mastercomfig?
</div>
<p class="text-sm text-zinc-300 mb-3">
    This affects where your autoexec.cfg file is located.
</p>
<div class="flex items-center gap-2">
    Pick a RCON password:
    <input class="border-b border-zinc-700 outline-none" spellcheck="false"
    maxlength="50" placeholder="Enter a Password" bind:value={password} />
</div>
<p class="text-sm text-zinc-300">
    You won't need to remember this password, and it can always be changed later.
    The only risk if this password is leaked is that if you happen to have port 27015 forwarded
    then others can use your TF2 console.
</p>