<script lang="ts">
    import { Portal } from "bits-ui";
    import ArrowUp from "@lucide/svelte/icons/arrow-up";
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";

    let childElement: HTMLElement;
    let showScrollUp = $state(false);
    const showDistance = 450;

    onMount(() => {
        const scrollElement = childElement.parentElement;
        if(!scrollElement) return;

        const onScroll = () => {
            showScrollUp = scrollElement.scrollTop > showDistance;
        }

        onScroll();
        scrollElement.addEventListener("scroll", onScroll);
        return () => scrollElement.removeEventListener("scroll", onScroll);
    });

    function scrollToTop() {
        const scrollElement = childElement.parentElement;
        scrollElement?.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<div bind:this={childElement}></div>

<Portal>
    {#if showScrollUp}
        <button class="fixed bottom-4 right-4 p-3 rounded-full bg-accent"
            transition:fly={{ y: 20, duration: 200 }} onclick={scrollToTop}>
            <ArrowUp size={24} />
        </button>
    {/if}
</Portal>