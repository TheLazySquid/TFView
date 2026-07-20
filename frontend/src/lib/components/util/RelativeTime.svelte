<script lang="ts">
    import { onMount } from "svelte";

    let { time }: { time: number } = $props();
    let display = $state("");
    let timeout: ReturnType<typeof setTimeout>;

    onMount(() => {
        updateDisplay();
        return () => clearTimeout(timeout)
    });

    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;
    
    function updateDisplay() {
        const diff = Date.now() - time;
        if(diff < minute) {
            timeout = setTimeout(updateDisplay, second);
            display = `${Math.floor(diff / second)}s`;
        } else if(diff < hour) {
            timeout = setTimeout(updateDisplay, second);
            display = `${Math.floor(diff / minute)}m ${Math.floor((diff % minute) / second)}s`;
        } else {
            timeout = setTimeout(updateDisplay, minute);
            display = `${Math.floor(diff / hour)}h ${Math.floor((diff % hour) / minute)}m`;
        }
    }
</script>

{display}