<script lang="ts">
    import { watch } from "runed";

    let { timestamp = $bindable() }: { timestamp: number | undefined } = $props();

    let input: HTMLInputElement;
    let valid = $derived(timestamp !== undefined);

    let ignoreNext = false;
    watch(() => timestamp, () => {
        if(ignoreNext) {
            ignoreNext = false;
            return;
        }

        input.valueAsNumber = timestamp ?? NaN;
    }, { lazy: true });

    const update = () => {
        ignoreNext = true;
        if(isNaN(input.valueAsNumber)) timestamp = undefined;
        else timestamp = input.valueAsNumber;
    }
</script>

<input type="date" bind:this={input} onchange={update}
    class="border { valid ? "border-green-300" : "border-white"} outline-none rounded-sm p-0.5" />