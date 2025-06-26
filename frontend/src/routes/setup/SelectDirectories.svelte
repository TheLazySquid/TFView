<script lang="ts">
    import Directory from "$lib/components/setup/Directory.svelte";
    import Directories from "$lib/ws/topics/directories.svelte";
    import Heading from "./Heading.svelte";
</script>

<Heading text="Locate Game Directories" done={Directories.valid} />
<h2 class="text-lg">Steam Directory</h2>
<Directory dir={Directories.steam} type="steam" />
<h2 class="text-lg">TF Directory</h2>
<Directory dir={Directories.tf} type="tf" />