import { join } from "node:path";
import { homedir } from "node:os";

export const fakeData = Bun.argv.includes("--fakeData");
export const dataPath = join(homedir(), ".tfview");