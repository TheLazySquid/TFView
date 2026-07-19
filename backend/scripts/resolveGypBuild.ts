import type { BunPlugin } from "bun";
import { join } from "node:path";
import { resolve } from "node-gyp-build";
import { fileURLToPath } from "node:url";

export default function resolveGypBuild(): BunPlugin {
    return {
        name: "resolve-gyp-build",
        setup(build) {
            build.onResolve({ filter: /^node-gyp-build$/ }, (args) => {
                const pathParts = args.importer.replaceAll("\\", "/").split("/");
                const modulesIndex = pathParts.lastIndexOf("node_modules");
                if(modulesIndex === -1) return;

                return {
                    path: pathParts[modulesIndex + 1],
                    namespace: "resolve-gyp-build"
                }
            });

            build.onLoad({ filter: /./, namespace: "resolve-gyp-build" }, (args) => {
                const addonPath = resolveAddonPath(args.path);
                const contents = `const addon = require(${JSON.stringify(addonPath)});\nmodule.exports=()=>addon;`;

                return { contents }
            });
        }
    }
}

function resolveAddonPath(module: string): string {
    const path = fileURLToPath(import.meta.resolve(module));
    const formattedPath = path.replaceAll("\\", "/");
    const moduleIndex = formattedPath.indexOf("/", formattedPath.lastIndexOf("/node_modules/") + 15);
    return resolve(path.slice(0, moduleIndex + 1));
}