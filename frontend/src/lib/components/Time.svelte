<script lang="ts">
    import { dateFmt, timeFmt } from "$lib/consts";

    type Type = "date" | "duration" | "time";
    let { timestamp, type }: { timestamp: number, type: Type } = $props();

    let text = $state("");

    const secondLen = 1000;
    const minuteLen = secondLen * 60;
    const hourLen = minuteLen * 60;

    if(type === "duration") {
        const hours = Math.floor(timestamp / hourLen);
        const minutes = Math.floor((timestamp % hourLen) / minuteLen);
        const seconds = Math.ceil((timestamp % minuteLen) / secondLen);

        if(hours === 0 && minutes === 0) {
            text = `${seconds} second${seconds > 1 ? "s" : ""}`;
        } else {
            if(hours > 0) {
                text = `${hours} hour${hours > 1 ? "s" : ""} `
            }
            text += `${minutes} minute${minutes > 1 ? "s" : ""}`
        }
    } else if(type === "date") {
        text = dateFmt.format(timestamp);
    } else {
        text = timeFmt.format(timestamp);
    }
</script>

{ text }