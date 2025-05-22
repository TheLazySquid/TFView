<script lang="ts">
    import Game from "$lib/ws/game.svelte";
    import Killfeed from "./game/Killfeed.svelte";
    import Chat from "./game/Chat.svelte";
    import Teams from "./game/Teams.svelte";
    import * as Resizable from "$lib/components/ui/resizable";
    import PlayerPopup from "../lib/components/popups/PlayerPopup.svelte";
    import PastGamePopup from "../lib/components/popups/PastGamePopup.svelte";
    import PastPlayerPopup from "$lib/components/popups/PastPlayerPopup.svelte";

    Game.init();
</script>

<PlayerPopup ws={Game} />
<PastGamePopup ws={Game} />
<PastPlayerPopup ws={Game} />

<div class="w-full h-full">
    <!-- Temporary layout -->
    <Resizable.PaneGroup direction="horizontal">
        <Resizable.Pane defaultSize={50}>
            <Teams />
        </Resizable.Pane>
        <Resizable.Handle />
        <Resizable.Pane>
            <Killfeed />
        </Resizable.Pane>
        <Resizable.Handle />
        <Resizable.Pane>
            <Chat />
        </Resizable.Pane>
    </Resizable.PaneGroup>
</div>