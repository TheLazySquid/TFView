<script lang="ts">
    let { value = $bindable() }: { value?: string } = $props();
</script>

<input bind:value class="border { value ? "border-green-300" : "border-white"}
    outline-none rounded-sm p-0.5" />