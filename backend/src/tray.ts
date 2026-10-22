import { join } from "node:path";
import { isLinux, root } from "./consts";
import open from "tiny-open";
import { networkPort } from "$shared/consts";
import Close from "./close";

export default async function createSystrayIcon() {
    const { default: Tray } = await import("ctray");
    // IDK why but I could not get ico working
    const iconPath = join(root, "static", isLinux ? "icon.png" : "icon.ico");
    const tray = new Tray(iconPath);

    tray.tooltip = "TFView";
    tray.menu = [
        {
            text: "Open UI",
            callback: () => open(`http://localhost:${networkPort}`)
        },
        {
            text: "View Log",
            callback: () => open(join(root, "tfview.log"))
        },
        {
            text: "Close TFView",
            callback: () => Close.close()
        }
    ]

    Close.on("close", () => tray.close());
}