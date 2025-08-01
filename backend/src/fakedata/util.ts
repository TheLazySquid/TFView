import { fakePlayers } from "./game";

export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const mapNames = [
    "pl_badwater",
    "pl_upward",
    "pl_borneo",
    "cp_dustbowl",
    "koth_harvest",
    "ctf_2fort"
]

export const playerNames = [
    "A Professional With Standards",
    "AimBot",
    "Aperture Science",
    "Archimedes!",
    "BeepBeepBoop",
    "Big Mean Muther Hubbard",
    "Black Mesa",
    "BoomerBile",
    "Cannon Fodder",
    "CEDA",
    "Chell",
    "Chucklenuts",
    "Companion Cube",
    "Crazed Gunman",
    "CreditToTeam",
    "CRITRAWKETS",
    "Crowbar",
    "CryBaby",
    "CrySomeMore",
    "C++",
    "Delicious Cake",
    "Divide by Zero",
    "Dog",
    "Force of Nature",
    "Freakin' Unbelievable",
    "Gentlemanne of Leisure",
    "GENTLE MANNE of LEISURE",
    "GLaDOS",
    "Glorified Toaster with Legs",
    "Grim Bloody Fable",
    "GutsAndGlory!",
    "Hat-Wearing MAN",
    "Headful of Eyeballs",
    "Herr Doktor",
    "Hostage",
    "H@XX0RZ",
    "I LIVE!",
    "It's Filthy in There!",
    "IvanTheSpaceBiker",
    "Kaboom!",
    "Kill Me",
    "LOS LOS LOS",
    "Maggot",
    "Mann Co.",
    "Mega Baboon",
    "Mentlegen",
    "MoreGun",
    "Nobody",
    "Nom Nom Nom",
    "Numnutz",
    "One-Man Cheeseburger Apocalypse",
    "Poopy Joe",
    "Pow!",
    "RageQuit",
    "Ribs Grow Back",
    "Saxton Hale",
    "Screamin' Eagles",
    "SMELLY UNFORTUNATE",
    "Still Alive",
    "TAAAAANK!",
    "Target Practice",
    "The Administrator",
    "The Combine",
    "The Freeman",
    "The G-Man",
    "Tiny Baby Man",
    "trigger_hurt",
    "WITCH",
    "Ze Ubermensch",
    "Zepheniah Mann",
    "0xDEADBEEF",
    "10001011101"
]

export const playerIds = [];

for(let player of fakePlayers) {
    playerIds.push(player.ID3);
}

for(let i = playerIds.length; i < playerNames.length; i++) {
    playerIds.push(random(1e7, 1e10 - 1).toString());
}