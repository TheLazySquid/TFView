import Settings from "src/settings/settings";
import { mapBits } from "./mapBits";
import { join } from "node:path";
import fsp from "node:fs/promises";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";
import type { CasualConfig } from "$types/data";

export default class Casual {
	static config: CasualConfig;

	static saveConfig() {
		Settings.set("casual", this.config);
	}

	static async init() {
		this.config = Settings.get("casual");

		this.checkCasual();
		Settings.on("tfPath", () => this.checkCasual());

		Server.onConnect("casual", (reply) => {
			reply(Message.CasualConfig, this.config);
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
			const selection = new Array(7).fill(0);
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
				this.config.selectedProfile = this.config.profiles[index].id;
			}

			Server.send("casual", Message.CasualConfig, this.config);
			this.setCasualCriteria(this.config.profiles[index].selection);
			this.saveConfig();
		});
	}
	
	static async checkCasual() {
		if(Settings.get("casual")) return;

		const selection = await this.readCasualCriteria();
		if(!selection) return;

		const id = crypto.randomUUID();
		Settings.set("casual", {
			profiles: [{ name: "Default Profile", id, selection }],
			selectedProfile: id
		});
	}

	static getCriteriaPath() {
		return join(Settings.get("tfPath"), "casual_criteria.vdf");
	}

	static async readCasualCriteria() {
		const path = this.getCriteriaPath();
		if(!await fsp.exists(path)) return;

		const data = await fsp.readFile(path);
		const lines = data.toString().replaceAll("\r\n", "\n").split("\n").filter(l => l);
		const selection = lines.map(line => parseInt(line.slice(line.indexOf(":") + 2)));

		return selection;
	}

	static async setCasualCriteria(selection: number[]) {
		const currentSelection = await this.readCasualCriteria();
		if(!currentSelection) return;

		// Take the existing selection, then add the bits from the new selection
		const numbers = currentSelection.map(BigInt);

		for(let i = 0; i < numbers.length; i++) {
			// Blank the corresponding mapBits, then set the new ones
			numbers[i] &= ~mapBits[i];
			numbers[i] |= BigInt(selection[i]);
		}

		const path = this.getCriteriaPath();
		const text = numbers.map((n) => `selected_maps_bits: ${n}`).join("\n");
		await fsp.writeFile(path, text);
	}
}