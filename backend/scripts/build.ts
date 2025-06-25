import { $ } from "bun";
import { cp, rmdir, exists } from "node:fs/promises";

if(await exists("dist")) {
    console.log("Clearing dist directory...");
    await rmdir("dist", { recursive: true });
}

console.log("Building binary...");
// Waiting for https://github.com/oven-sh/bun/pull/20530 to be merged before icon/hideconsole can be used
// await $`bun build ./src/index.ts --compile --minify --bytecode --windows-icon=./resource/icon.ico --windows-hide-console --outfile dist/tfview`.text();
await $`bun build ./src/index.ts --compile --minify --bytecode --outfile dist/tfview`.text();

console.log("Copying static files...");
await cp("static", "dist/static", { recursive: true });

console.log("Copying README.md...");
await cp("../README.md", "dist/README.md");

if(Bun.argv.includes("--zip")) {
    console.log("Zipping the dist directory...");
    await $`cd dist && 7z a -tzip tfview.zip ./*`.text();
}

console.log("Done!");