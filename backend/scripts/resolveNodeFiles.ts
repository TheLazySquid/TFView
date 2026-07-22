// @ts-expect-error No types available and I don't care enough to do it myself
import { resolve } from "node-gyp-build";
import type { BunPlugin } from "bun";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

export default function resolveNodeFiles(): BunPlugin {
    return {
        name: "resolve-node-files",
        setup(build) {
            build.onResolve({ filter: /^node-gyp-build$/ }, (args) => {
                const path = getModuleName(args.importer);
                if(!path) return null;

                return {
                    path,
                    namespace: "resolve-gyp-build"
                }
            });

            build.onLoad({ filter: /./, namespace: "resolve-gyp-build" }, (args) => {
                const addonPath = resolveGypBuildPackage(args.path);
                const contents = `const addon = require(${JSON.stringify(addonPath)});\nmodule.exports=()=>addon;`;

                return { contents }
            });

            build.onResolve({ filter: /^bindings$/ }, (args) => {
                const path = getModuleName(args.importer);
                if(!path) return null;

                return {
                    path,
                    namespace: "resolve-bindings"
                }
            });

            build.onLoad({ filter: /./, namespace: "resolve-bindings" }, (args) => {
                const addonPath = resolveBindingsPackage(args.path);
                const contents = `const addon = require(${JSON.stringify(addonPath)});\nmodule.exports=()=>addon;`;

                return { contents }
            });
        }
    }
}

function getModuleName(path: string) {
    const pathParts = path.replaceAll("\\", "/").split("/");
    const modulesIndex = pathParts.lastIndexOf("node_modules");
    if(modulesIndex === -1) return null;

    return pathParts[modulesIndex + 1];
}

function getModuleRoot(module: string): string {
    const path = fileURLToPath(import.meta.resolve(module));
    const formattedPath = path.replaceAll("\\", "/");
    const moduleIndex = formattedPath.indexOf("/", formattedPath.lastIndexOf("/node_modules/") + 15);
    return path.slice(0, moduleIndex + 1);
}

function resolveGypBuildPackage(module: string): string {
    return resolve(getModuleRoot(module));
}

function resolveBindingsPackage(module: string): string {
    const path = join(getModuleRoot(module), "build", "Release");
    const items = readdirSync(path);
    const item = items.find((item) => item.endsWith(".node"));
    if(!item) throw new Error(`No .node file found in ${path}`);

    return join(path, item);
}