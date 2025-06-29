import { TF2Class } from "$types/lobby";

export const killfeedRed = "#b55c4c"
export const killfeedBlue = "#687d9c";
export const nameColors = ["#cdcdcd", "#cdcdcd", "#e96969", "#a9d5fe"];

// eg. Jun 23, 2025, 8:30 PM
export const dateFmt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
});

// eg. 8:30 PM
export const timeFmt = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
});

export const classIcons = {
    [TF2Class.Scout]: "Scout.png",
    [TF2Class.Soldier]: "Soldier.png",
    [TF2Class.Pyro]: "Pyro.png",
    [TF2Class.Demo]: "Demo.png",
    [TF2Class.Heavy]: "Heavy.png",
    [TF2Class.Engineer]: "Engineer.png",
    [TF2Class.Medic]: "Medic.png",
    [TF2Class.Sniper]: "Sniper.png",
    [TF2Class.Spy]: "Spy.png"
}

export const defaultClassHealth = {
    [TF2Class.Scout]: 125,
    [TF2Class.Soldier]: 200,
    [TF2Class.Pyro]: 175,
    [TF2Class.Demo]: 175,
    [TF2Class.Heavy]: 300,
    [TF2Class.Engineer]: 125,
    [TF2Class.Medic]: 150,
    [TF2Class.Sniper]: 125,
    [TF2Class.Spy]: 125
}