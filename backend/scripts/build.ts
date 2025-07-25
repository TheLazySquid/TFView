import { $ } from "bun";
import { cp, rmdir, exists, readdir } from "node:fs/promises";
import { zip } from "zip-a-folder";

if(await exists("dist")) {
    console.log("Clearing dist directory...");
    await rmdir("dist", { recursive: true });
}

if(!await exists("static")) {
    console.log("Building frontend...");
    await $`cd ../frontend && bun run build`.quiet();
}

if(!await exists("dirpicker/dist")) {
    console.log("Building dirpicker...");
    await $`bun run compilePicker`.quiet();
}

console.log("Building binary...");
// Waiting for https://github.com/oven-sh/bun/pull/20530 to be merged before icon/hideconsole can be used
// await $`bun build ./src/index.ts --compile --minify --bytecode --windows-icon=./resource/icon.ico --windows-hide-console --outfile dist/tfview`.text();
await $`bun build ./src/index.ts --compile --minify --bytecode --outfile dist/unpacked/tfview`.quiet();

console.log("Copying static files...");
await cp("static", "dist/unpacked/static", { recursive: true });

console.log("Copying dirpicker...");
const files = await readdir("dirpicker/dist");
await cp(`dirpicker/dist/${files[0]}`, `dist/unpacked/${files[0]}`);

console.log("Copying README.md...");
await cp("../README.md", "dist/unpacked/README.md");
 
let zipIndex = Bun.argv.indexOf("--zip");
if(zipIndex !== -1) {
    console.log("Zipping files...");
    let name = Bun.argv[zipIndex + 1] ?? "tfview";
    await zip("./dist/unpacked", `./dist/${name}.zip`);
}

console.log("Done!");