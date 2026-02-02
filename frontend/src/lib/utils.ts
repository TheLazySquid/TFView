import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { dateFmt, timeFmt } from "./consts";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;	
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

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

export function formatDuration(timestamp: number) {
	const hours = Math.floor(timestamp / hourLen);
	const minutes = Math.floor((timestamp % hourLen) / minuteLen);
	const seconds = Math.ceil((timestamp % minuteLen) / secondLen);

	let text = "";
	if(hours === 0 && minutes === 0) {
		text = `${seconds} second${seconds > 1 ? "s" : ""}`;
	} else {
		if(hours > 0) {
			text = `${hours} hour${hours > 1 ? "s" : ""} `
		}
		text += `${minutes} minute${minutes > 1 ? "s" : ""}`
	}

	return text;
}

export function formatTimeAgo(timestamp: number) {
	const duration = Date.now() - timestamp;

	for(let time of times) {
		const amount = Math.floor(duration / time.length);
		if(amount > 0) {
			return `${amount} ${time.name}${amount > 1 ? "s" : ""} ago`;
		}
	}
}

export function formatDate(timestamp: number) {
	return dateFmt.format(timestamp);
}

export function formatTime(timestamp: number) {
	return timeFmt.format(timestamp);
}