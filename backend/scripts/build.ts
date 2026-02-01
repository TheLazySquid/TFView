import { $ } from "bun";
import { cp, rmdir, exists } from "node:fs/promises";
import { zip } from "zip-a-folder";
import { parseArgs } from "node:util";
import { version, author } from "../../package.json";

const args = parseArgs({
    args: process.argv.slice(2),
    options: {
        production: {
            type: "boolean",
            short: "p"
        },
        zip: {
            type: "string",
            short: "z"
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

const features = ["COMPILED"];
if(args.values.production) features.push("PRODUCTION");

await Bun.build({
    entrypoints: ["./src/index.ts"],
    minify: true,
    bytecode: true,
    features,
    compile: {
        outfile: "./dist/unpacked/tfview",
        windows: {
            title: "TFView",
            publisher: author,
            version,
            description: "TFView",
            icon: "./resource/icon.ico"
        }
    }
});

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