<script lang="ts">
    import Popup from "./Popup.svelte";
    import * as Dialog from "$lib/components/ui/dialog";

    let avatarHash = $state("");
    let playerName = $state("");

    const onOpen = (hash: string, name: string) => {
        avatarHash = hash;
        playerName = name;
    }
</script>

<Popup type="openProfilePicturePopup" {onOpen} style="max-width: fit-content">
    <Dialog.Header class="text-2xl verdana whitespace-nowrap">{ playerName }'s Profile Picture</Dialog.Header>
    <div class="w-full h-full flex items-center justify-center">
        <img src={`https://avatars.steamstatic.com/${avatarHash}_full.jpg`}
        class="w-[400px] h-[400px]" alt="Avatar" />
    </div>
</Popup>