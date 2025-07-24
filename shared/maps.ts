export interface CasualMap {
	name: string;
	// Bigint is used since the number used to store map selections is a uint32
	// And javascript bitwise operations on numbers always cast to a signed 32-bit integer
	bit: bigint;
	number: number;
}

export interface CasualMapCategory {
	name: string;
	maps: CasualMap[];
}

// I'm resigning myself to manually updating this every time new stuff is added
// Hopefully there's a way to properly extract this from the files, but the way that it's encoded
// Into the binary looks pretty gnarly
export const casualMaps: CasualMapCategory[] = [
	{
		name: "Attack / Defense",
		maps: [
			{ name: "Altitude", bit: 4n, number: 4 },
			{ name: "Brew", bit: 14n, number: 5 },
			{ name: "Dustbowl", bit: 10n, number: 0 },
			{ name: "Egypt", bit: 20n, number: 0 },
			{ name: "Fortezza", bit: 7n, number: 6 },
			{ name: "Gorge", bit: 1n, number: 0 },
			{ name: "Gravelpit", bit: 9n, number: 0 },
			{ name: "Haarp", bit: 13n, number: 5 },
			{ name: "Hadal", bit: 26n, number: 5 },
			{ name: "Hardwood", bit: 24n, number: 4 },
			{ name: "Junction", bit: 21n, number: 0 },
			{ name: "Mercenary Park", bit: 5n, number: 3 },
			{ name: "Mossrock", bit: 6n, number: 3 },
			{ name: "Mountain Lab", bit: 3n, number: 1 },
			{ name: "Overgrown", bit: 25n, number: 5 },
			{ name: "Snowplow", bit: 22n, number: 1 },
			{ name: "Steel", bit: 19n, number: 0 },
			{ name: "Sulfur", bit: 23n, number: 4 }
		]
	},
	{
		name: "Capture the Flag",
		maps: [
			{ name: "2Fort", bit: 12n, number: 0 },
			{ name: "2Fort Invasion", bit: 23n, number: 1 },
			{ name: "Applejack", bit: 27n, number: 5 },
			{ name: "Doublecross", bit: 29n, number: 0 },
			{ name: "Frosty", bit: 15n, number: 4 },
			{ name: "Landfall", bit: 21n, number: 1 },
			{ name: "Pelican Peak", bit: 25n, number: 4 },
			{ name: "Penguin Peak", bit: 8n, number: 6 },
			{ name: "Sawmill", bit: 26n, number: 0 },
			{ name: "Turbine", bit: 17n, number: 0 },
			{ name: "Well", bit: 14n, number: 0 }
		]
	},
	{
		name: "Control Points",
		maps: [
			{ name: "5Gorge", bit: 5n, number: 1 },
			{ name: "Badlands", bit: 2n, number: 0 },
			{ name: "Canaveral", bit: 29n, number: 5 },
			{ name: "Coldfront", bit: 2n, number: 1 },
			{ name: "Fastlane", bit: 16n, number: 0 },
			{ name: "Foundry", bit: 5n, number: 0 },
			{ name: "Freight", bit: 30n, number: 0 },
			{ name: "Granary", bit: 4n, number: 0 },
			{ name: "Gullywash", bit: 6n, number: 0 },
			{ name: "Metalworks", bit: 16n, number: 1 },
			{ name: "Powerhouse", bit: 24n, number: 1 },
			{ name: "Process", bit: 14n, number: 1 },
			{ name: "Reckoner", bit: 22n, number: 4 },
			{ name: "Snakewater", bit: 7n, number: 0 },
			{ name: "Standin", bit: 13n, number: 1 },
			{ name: "Sunshine", bit: 15n, number: 1 },
			{ name: "Vanguard", bit: 3n, number: 0 },
			{ name: "Well", bit: 11n, number: 0 },
			{ name: "Yukon", bit: 27n, number: 0 }
		]
	},
	{
		name: "King of the Hill",
		maps: [
			{ name: "Badlands", bit: 9n, number: 1 },
			{ name: "Brazil", bit: 10n, number: 3 },
			{ name: "Cachoeira", bit: 24n, number: 5 },
			{ name: "Cascade", bit: 3n, number: 4 },
			{ name: "Harvest", bit: 28n, number: 0 },
			{ name: "Highpass", bit: 27n, number: 1 },
			{ name: "Kong King", bit: 12n, number: 1 },
			{ name: "Lakeside", bit: 8n, number: 1 },
			{ name: "Lazarus", bit: 7n, number: 3 },
			{ name: "Megaton", bit: 23n, number: 5 },
			{ name: "Nucleus", bit: 25n, number: 0 },
			{ name: "Overcast", bit: 6n, number: 6 },
			{ name: "Probed", bit: 26n, number: 1 },
			{ name: "Rotunda", bit: 18n, number: 4 },
			{ name: "Sawmill", bit: 24n, number: 0 },
			{ name: "Sharkbay", bit: 17n, number: 4 },
			{ name: "Snowtower", bit: 11n, number: 5 },
			{ name: "Suijin", bit: 25n, number: 1 },
			{ name: "Viaduct", bit: 8n, number: 0 }
		]
	},
	{
		name: "Payload",
		maps: [
			{ name: "Badwater", bit: 18n, number: 0 },
			{ name: "Barnblitz", bit: 10n, number: 1 },
			{ name: "Borneo", bit: 29n, number: 1 },
			{ name: "Bread Space", bit: 1n, number: 4 },
			{ name: "Camber", bit: 20n, number: 5 },
			{ name: "Cashworks", bit: 20n, number: 4 },
			{ name: "Embargo", bit: 21n, number: 5 },
			{ name: "Emerge", bit: 19n, number: 5 },
			{ name: "Enclosure", bit: 9n, number: 3 },
			{ name: "Frontier", bit: 6n, number: 1 },
			{ name: "Goldrush", bit: 15n, number: 0 },
			{ name: "Hoodoo", bit: 23n, number: 0 },
			{ name: "Odyssey", bit: 22n, number: 5 },
			{ name: "Patagonia", bit: 9n, number: 6 },
			{ name: "Phoenix", bit: 19n, number: 4 },
			{ name: "Pier", bit: 22n, number: 3 },
			{ name: "Rumford", bit: 14n, number: 4 },
			{ name: "Snowycoast", bit: 30n, number: 1 },
			{ name: "Swiftwater", bit: 17n, number: 1 },
			{ name: "Thundermountain", bit: 1n, number: 1 },
			{ name: "Upward", bit: 31n, number: 0 },
			{ name: "Venice", bit: 21n, number: 4 }
		]
	},
	{
		name: "Payload Race",
		maps: [
			{ name: "Banana Bay", bit: 8n, number: 3 },
			{ name: "Hacksaw", bit: 15n, number: 5 },
			{ name: "Hightower", bit: 0n, number: 1 },
			{ name: "Nightfall", bit: 7n, number: 1 },
			{ name: "Pipeline", bit: 22n, number: 0 }
		]
	},
	{
		name: "Misc",
		maps: [
			{ name: "Atom Smash", bit: 28n, number: 5 },
			{ name: "Burghausen", bit: 30n, number: 5 },
			{ name: "DeGroot Keep", bit: 4n, number: 1 },
			{ name: "Distillery", bit: 28n, number: 4 },
			{ name: "Doomsday", bit: 11n, number: 1 },
			{ name: "Hydro", bit: 13n, number: 0 },
			{ name: "Nucleus VSH", bit: 30n, number: 4 },
			{ name: "Selbyen", bit: 26n, number: 4 },
			{ name: "Skirmish", bit: 29n, number: 4 },
			{ name: "Tiny Rock", bit: 27n, number: 4 },
			{ name: "Watergate", bit: 31n, number: 1 }
		]
	},
	{
		name: "Mannpower",
		maps: [
			{ name: "Foundry", bit: 21n, number: 2 },
			{ name: "Gorge", bit: 22n, number: 2 },
			{ name: "Hellfire", bit: 24n, number: 2 },
			{ name: "Thundermountain", bit: 23n, number: 2 }
		]
	},
	{
		name: "PASS Time",
		maps: [
			{ name: "Brickyard", bit: 18n, number: 1 },
			{ name: "District", bit: 20n, number: 1 },
			{ name: "Timbertown", bit: 19n, number: 1 }
		]
	}
]