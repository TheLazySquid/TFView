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