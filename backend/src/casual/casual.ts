import type { CasualConfig } from "$types/data";
import Settings from "$src/settings/settings";
import { mapBits } from "$shared/maps";
import { join } from "node:path";
import fsp from "node:fs/promises";
import Server from "$src/net/server";
import { Message, Recieves } from "$types/messages";
import { exists } from "$src/util";
import { watch, type FSWatcher } from "chokidar";
import Log from "$src/log";

export default class Casual {
	static config: CasualConfig;
	static manualSelectionChange: number[] | null = null;

	static saveConfig() {
		Settings.set("casual", this.config);
	}

	static async init() {
		this.loadConfig();
		this.watchCasualCriteria();
		Settings.on("tfPath", () => this.watchCasualCriteria());

		Server.onConnect("casual", (reply) => {
			reply(Message.CasualConfig, this.config);
			if(this.manualSelectionChange) reply(Message.CasualSelectionChanged, true);
		});

		Server.on(Recieves.UpdateCasualProfile, (data, { ws }) => {
			const profile = this.config.profiles.find(p => p.id === data.id);
			if(!profile) return;

			profile.name = data.name;
			profile.selection = data.selection;
			Server.sendOthers(ws, "casual", Message.CasualConfig, this.config);
			
			if(profile.id === this.config.selectedProfile) {
				this.setCasualCriteria(data.selection);
			}
			this.saveConfig();
		});

		Server.on(Recieves.NewCasualProfile, (name) => {
			const selection = new Array(8).fill(0);
			const id = crypto.randomUUID();

			this.config.profiles.push({ name, id, selection });
			this.config.selectedProfile = id;
			Server.send("casual", Message.CasualConfig, this.config);

			this.setCasualCriteria(selection);
			this.saveConfig();
		});

		Server.on(Recieves.SelectCasualProfile, (id) => {
			const selected = this.config.profiles.find(p => p.id === id);
			if(!selected) return;

			this.config.selectedProfile = id;
			
			Server.send("casual", Message.CasualConfig, this.config);
			this.setCasualCriteria(selected.selection);
			this.saveConfig();
		});

		Server.on(Recieves.DeleteCasualProfile, (id) => {
			let index = this.config.profiles.findIndex(p => p.id === id);
			if(index === -1) return;

			// Go to the nearest selection if the deleted profile was selected
			this.config.profiles.splice(index, 1);
			if(this.config.selectedProfile === id) {
				index = Math.min(index, this.config.profiles.length - 1);

				const newSelection = this.config.profiles[index];
				if(newSelection) this.config.selectedProfile = newSelection.id;
			}

			Server.send("casual", Message.CasualConfig, this.config);
			this.setCasualCriteria(this.config.profiles[index]!.selection);
			this.saveConfig();
		});

		Server.on(Recieves.HandleCasualChanged, (data) => {
			if(!this.manualSelectionChange) return;

			if(data.action === "new") {
				const id = crypto.randomUUID();

				this.config.profiles.push({
					name: data.name,
					id,
					selection: this.manualSelectionChange
				});

				this.config.selectedProfile = id;
			} else if(data.action === "overwrite") {
				const profile = this.config.profiles.find(p => p.id === data.id);
				if(profile) {
					profile.selection = this.manualSelectionChange;
					this.config.selectedProfile = profile.id;
				}
			} else {
				const profile = this.config.profiles.find(p => p.id === this.config.selectedProfile);
				if(profile) this.setCasualCriteria(profile.selection);
			}

			this.manualSelectionChange = null;
			Server.send("casual", Message.CasualConfig, this.config);
			Server.send("casual", Message.CasualSelectionChanged, false);
		});
	}

	static watcher?: FSWatcher;
	static async watchCasualCriteria() {
		this.watcher?.close();
		
		const path = this.getCriteriaPath();
		if(!path) return;
		
		this.watcher = watch(path, {
			persistent: false,
			ignoreInitial: true
		});

		this.watcher.on("change", () => this.checkMatch());
		this.checkMatch();
	}

	static async checkMatch() {
		const selection = await this.readCasualCriteria();
		if(!selection) return;

		// Create a default profile picture if the user doesn't have one
		if(!this.config) {
			const id = crypto.randomUUID();
			const defaultConfig: CasualConfig = {
				profiles: [{ name: "Default Profile", id, selection }],
				selectedProfile: id
			};

			Settings.set("casual", defaultConfig);
			this.config = defaultConfig;
			return;
		}

		// If the user has manually changed their selection note it so once they go to /casual we can ask what to do
		const profile = this.config.profiles.find(p => p.id === this.config.selectedProfile);
		if(!profile || this.selectionsMatch(profile.selection, selection)) return;
		if(this.manualSelectionChange && this.selectionsMatch(this.manualSelectionChange, selection)) return;

		Log.info("Casual criteria changed externally");
		this.manualSelectionChange = selection;
		Server.send("casual", Message.CasualSelectionChanged, true);
	}
	
	static loadConfig() {
		const savedConfig = Settings.get("casual");
		if(savedConfig) this.config = savedConfig;
	}

	static getCriteriaPath() {
		if(!Settings.get("tfPath")) return null;
		return join(Settings.get("tfPath"), "casual_criteria.vdf");
	}

	static async readCasualCriteria() {
		const path = this.getCriteriaPath();
		if(!path || !await exists(path)) return;

		const data = await fsp.readFile(path);
		const lines = data.toString().replaceAll("\r\n", "\n").split("\n").filter(l => l);
		const selection = lines.map(line => parseInt(line.slice(line.indexOf(":") + 2), 10));

		return selection;
	}

	static async setCasualCriteria(selection: number[]) {
		const currentSelection = await this.readCasualCriteria();
		if(!currentSelection) return;

		// Take the existing selection, then add the bits from the new selection
		const numbers = currentSelection.map(BigInt);

		for(let i = 0; i < numbers.length; i++) {
			// Blank the corresponding mapBits, then set the new ones
			numbers[i]! &= ~(mapBits[i] ?? 0n);
			numbers[i]! |= BigInt(selection[i] ?? 0n);
		}

		const path = this.getCriteriaPath();
		const text = numbers.map((n) => `selected_maps_bits: ${n}`).join("\n");
		if(path) await fsp.writeFile(path, text);
	}

	static selectionsMatch(a: number[], b: number[]) {
		const aMasked = a.map((bits, i) => bits & Number(mapBits[i]));
		const bMasked = b.map((bits, i) => bits & Number(mapBits[i]));
		return aMasked.every((bits, i) => bits === bMasked[i]);
	}
}