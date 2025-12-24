import type { CasualProfile } from "$types/data";
import { Message } from "$types/messages"
import WS from "../wsclient.svelte"

export default new class Casual {
	profiles: CasualProfile[] = $state([]);
	selectedProfileId = $state("");
	selectedProfile?: CasualProfile = $state();
	selection: bigint[] = $state(new Array(8).fill(0n));
	
	constructor() {
		WS.on(Message.CasualConfig, (config) => {
			this.profiles = config.profiles;
			this.selectedProfileId = config.selectedProfile;

			let selected = this.profiles.find(p => p.id === this.selectedProfileId);
			this.selectedProfile = selected;

			if(!selected) return;
			this.selection = selected.selection.map(BigInt);
		});
	}
}