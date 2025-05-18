<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import TeamView from "./TeamView.svelte";
</script>

<Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane>
        <TeamView id={2} name="Red" />
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane>
        <TeamView id={3} name="Blue" />
    </Resizable.Pane>
</Resizable.PaneGroup>