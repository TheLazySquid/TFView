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
    const pathParts = path.replaceAll("\\", "/").split("/");
    const modulesIndex = pathParts.lastIndexOf("node_modules");
    const modulePath = join(...pathParts.slice(0, modulesIndex + 2));
    return resolve(modulePath);
}