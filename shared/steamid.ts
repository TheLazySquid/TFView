// Slimmed down version of node-steamid, only needs to work with players
export const id64Flags = (1n << 56n) | (1n << 52n) | (1n << 32n);

export function id3ToId64(id3: string) {
    const int = id64Flags | BigInt(id3);
    return int.toString();
}

export function id64ToId3(id64: string) {
    const int = BigInt(id64) & 0xFFFFFFFFn;
    return int.toString();
}