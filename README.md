# TFView
[![Discord Support Server](https://img.shields.io/badge/Discord-Support_Server-5865F2?logo=discord)](https://discord.gg/XNvhjhDQhZ)

TFView is a TF2 interface that lets you easily view and interact with various things. It works by connecting to your TF2 console and gathering data by running console commands, similarly to [TF2BD](https://github.com/PazerOP/tf2_bot_detector) and [MegaAntiCheat](https://github.com/MegaAntiCheat/client-backend). This is intended by Valve, and does not put you at risk of being banned.

## Features

### Game View

Game view lets you get an overview of the people currently in your game. TFView can be configured to show any of the following: k/d, killstreak, ping, class (based on killfeed), health (only for teammates), and number of times you have encountered someone. You can also give users nicknames, notes, and configurable tags. There are panels available to view the chat and killfeed as well.

![Game View Preview](./images/Game_View.png)

### Player/Game Search

The main appeal behind TFView is that it stores the games you play and the people you meet so you can look them up later. For each player, you can see how many times you've seen them, the matches in which you saw them, their k/d during that match, and any demos you may have recorded during that match.

![Player Search Preview](./images/Player_Search.png)

### Casual Map Selection

TFView lets you create several profiles with different casual map selections, which you can then easily switch between. You need to hit "Load Saved Settings" in-game for the changes to apply if the game is active.

![Map Selection Preview](./images/Map_Selection.png)

### Weapon Kill Count Tracker

TFView tracks the number of kills you get with each weapon, letting you see how much you've used them. It also displays special kill types, showing you backstabs, headshots, penetration kills, taunt kills, and more.

![Weapon Kill Count Tracker Preview](./images/Weapon_Kill_Counts.png)

### Advanced Scripting

TFView can work in tandem with tf2 scripts to trigger effects outside of the game that would normally be impossible, such as saving data or modifying configs on the fly. See the [Scripting](#Scripting) section below for more info.

## Installation

* Download the windows or linux zip from [the latest release](https://github.com/TheLazySquid/TFView/releases/latest)
* Extract it somewhere
* Run the tfview executable
* Open the UI at [http://localhost:7523](http://localhost:7523) and follow the setup steps

## Usage

Run the TFView executable, then optionally open the UI at [http://localhost:7523](http://localhost:7523). You can open this in the browser of your choosing or even the steam overlay.

## Necessary Setup

You will be walked through setup upon opening TFView for the first time. There are a few things that need to be done in order to connect to RCON.

1. Add `-condebug -conclearlog -usercon -g15` to your TF2 launch options.
2. Add `ip 0.0.0.0`, `rcon_password [your password here]`, and `net_start` to your autoexec.
3. (Optional, but strongly recommended) Get a [Steam api key](https://steamcommunity.com/dev/apikey). This lets you see the profile pictures of the players in your game.
4. (Optional) Get a [MegaAntiCheat api key](https://megaanticheat.com/provision) to send demos of games you play to MegaAntiCheat's masterbase. (You will also need to run `ds_enable 2` in the console).

## Storage Usage

TFView uses a surprisngly small amount of storage space. Even with 100,000 different players and 6,500 different games recorded the database only uses roughly 42 megabytes.

## Scripting

TFView can detect when a string of the following format is echoed in the TF2 console: `tfview.script(arg1,arg2,etc)`. It will then attempt to run the file `[HOME]/.tfview/scripts/[SCRIPT].js` (.ts is also supported). For example, running `echo "tfview.hi(arg, 123)"` will run the file `[HOME]/.tfview/scripts/hi.js`. If the file exports a `run` function, it will be called with a context object (more on that below), and then all the arguments supplied, like so: `export function run(context, arg1, arg2, etc)`. Note that the arguments will always be strings. Calling a script in this way may add a second or two of delay, and has a chance of being dropped.

### Environment

Scripts run in a standard nodejs/bun esm environment. This means that node apis can be used, such as `import fs from "node:fs"`.

### Context

Scripts are given a context object which allows them to interact with TF2 and TFView, which looks like so:

|Property|Type|Description|
|--------|----|-----------|
|steamPath|string|The path to the user's steam directory.|
|tfPath|string|The path to the user's tf directory.|
|rcon.run|(command: string) => Promise<string \| null>|Runs a command in the user's TF2 console, and returns a promise containing the response, if there is any. Resolves with null if the command fails.|
|toast.success|(message: string) => void|Displays a success toast on the web UI.|
|toast.error|(message: string) => void|Displays an error toast on the web UI.|
|toast.warning|(message: string) => void|Displays a warning toast on the web UI.|
|log.info|(...items: any[]) => void|Logs info to the console and log file.|
|log.warning|(...items: any[]) => void|Logs a warning to the console and log file.|
|log.error|(...items: any[]) => void|Logs an error to the console and log file.|

### Persistent Scripts

By default, scripts are re-run every time they are called. By naming a script `[SCRIPT].persistent.js` it will instead be run on startup, with its exported `init` function being called with the context object. If a persistent script is deleted or updated its exported `close` function will be called with the context object. Like with a normal script, the `run` function will be called with the context and arguments when `echo "tfview.script(...args)"` is called. This is useful if state needs to be "remembered" between runs.

## Development

This project features two parts, a frontend written in [svelte](https://svelte.dev/) and a backend in typescript which is turned into an executable via [bun](https://bun.com/). There is also a small updater in the backend which handles the final stages of updating, written in C++. The backend records data to a sqlite database located at `[HOME]/.tfview/history.sqlite`. This database is used regardless of whether you're using the development or release version, so if you doing something risky you may want to take a backup.

### Setup

1. Make sure you have [git](https://git-scm.com/) and [bun](https://bun.com/) installed.
2. If you intent to distribute the executable, also install [make](https://www.gnu.org/software/make/) and [gcc](https://www.gnu.org/software/gcc/).
3. Clone this repo with git and cd into it
4. Run `bun install`

You'll then likely want to open a second terminal to run the frontend and backend simultaneously.

### Running the backend

1. cd into the `backend` directory
2. Run `bun start`

### Running the frontend

1. cd into the `frontend` directory
2. Run `bun run dev`

### Creating a release

1. cd into `backend`
2. If you have made changes to the frontend, clear the `static` directory.
3. Run `bun run compile`
4. The final contents will be in `dist/unpacked`