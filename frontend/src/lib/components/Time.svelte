<script lang="ts">
    import { timeFmt } from "$lib/consts";

    let { date, duration = false }: { date: number, duration?: boolean } = $props();

    let text = $state("");

    const secondLen = 1000;
    const minuteLen = secondLen * 60;
    const hourLen = minuteLen * 60;

    if(duration) {
        const hours = Math.floor(date / hourLen);
        const minutes = Math.floor((date % hourLen) / minuteLen);
        const seconds = Math.ceil((date % minuteLen) / secondLen);

        if(hours === 0 && minutes === 0) {
            text = `${seconds} second${seconds > 1 ? "s" : ""}`;
        } else {
            if(hours > 0) {
                text = `${hours} hour${hours > 1 ? "s" : ""} `
            }
            text += `${minutes} minute${minutes > 1 ? "s" : ""}`
        }
    } else {
        text = timeFmt.format(date);
    }
</script>

{ text }