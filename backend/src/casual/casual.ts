import Settings from "src/settings/settings";
import { mapBits } from "./mapBits";
import { join } from "node:path";
import fsp from "node:fs/promises";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";

export default class Casual {
	static async init() {
		this.checkCasual();
		Settings.on("tfPath", () => this.checkCasual());

		Server.onConnect("casual", (reply) => {
			reply(Message.CasualConfig, Settings.get("casual"));
		});

		// TODO: Selecting and deleting
		Server.on(Recieves.UpdateCasualProfile, (data) => {
			const casual = Settings.get("casual");
			if(!casual) return;

			const profile = casual.profiles.find(p => p.id === data.id);
			if(!profile) return;

			profile.name = data.name;
			profile.selection = data.selection;
			if(profile.id === casual.selectedProfile) {
				this.setCasualCriteria(data.selection);
			}

			Settings.set("casual", casual);
		});
	}
	
	static async checkCasual() {
		if(Settings.get("casual")) return;

		const selection = await this.readCasualCriteria();
		if(!selection) return;

		const id = crypto.randomUUID();
		Settings.set("casual", {
			profiles: [{ name: "default", id, selection }],
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
		const numbers: bigint[] = [];
		for(let number of currentSelection) numbers.push(BigInt(number));

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