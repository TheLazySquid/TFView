<script lang="ts">
    import { dateFmt, killfeedBlue, timeFmt } from "$lib/consts";

    type Type = "date" | "duration" | "time" | "past";
    let { timestamp, type }: { timestamp: number, type: Type } = $props();

    let text = $state("");

    const secondLen = 1000;
    const minuteLen = secondLen * 60;
    const hourLen = minuteLen * 60;
    const dayLen = hourLen * 24;
    const monthLen = dayLen * 30;
    const yearLen = dayLen * 365;
    const times = [
        { length: yearLen, name: "year" },
        { length: monthLen, name: "month" },
        { length: dayLen, name: "day" },
        { length: hourLen, name: "hour" },
        { length: minuteLen, name: "minute" },
        { length: secondLen, name: "second" }
    ];

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
    } else if(type === "past") {
        const duration = Date.now() - timestamp;

        for(let time of times) {
            const amount = Math.floor(duration / time.length);
            if(amount > 0) {
                text = `${amount} ${time.name}${amount > 1 ? "s" : ""} ago`;
                break;
            }
        }
    } else if(type === "date") {
        text = dateFmt.format(timestamp);
    } else {
        text = timeFmt.format(timestamp);
    }
</script>

{ text }