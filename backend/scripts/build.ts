import { $ } from "bun";
import { cp, rmdir, exists } from "node:fs/promises";
import { zip } from "zip-a-folder";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";

const args = parseArgs({
    args: process.argv.slice(2),
    options: {
        zip: {
            type: "string",
            short: "z"
        },
        resourcehacker: {
            type: "string"
        }
    }
});

if(await exists("dist")) {
    console.log("Clearing dist directory...");
    await rmdir("dist", { recursive: true });
}

if(!await exists("static")) {
    console.log("Building frontend...");
    await $`cd ../frontend && bun run build`.quiet();
}

console.log("Building binary...");
// Waiting for https://github.com/oven-sh/bun/pull/20530 to be merged before icon/hideconsole can be used
// await $`bun build ./src/index.ts --compile --minify --bytecode --windows-icon=./resource/icon.ico --windows-hide-console --outfile dist/tfview`.text();
await $`bun build ./src/index.ts --compile --minify --bytecode --outfile dist/unpacked/tfview`.quiet();

if(args.values.resourcehacker) {
    console.log("Adding icon with Resource Hacker...");
    await $`${args.values.resourcehacker} -script rh_changeicon.txt`.quiet();
    await $`rm dist/unpacked/tfview.exe`.quiet();
    await $`mv dist/unpacked/tfview_new.exe dist/unpacked/tfview.exe`.quiet();
}

console.log("Compiling updater...");
await $`cd updater && make`.quiet();

console.log("Copying static files...");
await cp("static", "dist/unpacked/static", { recursive: true });

console.log("Copying README.md...");
await cp("../README.md", "dist/unpacked/README.md");
 
if(args.values.zip) {
    console.log("Zipping files...");
    await zip("./dist/unpacked", `./dist/${args.values.zip}.zip`);
}

console.log("Done!");