import { mergedWeapons, mergeWith } from "$lib/killfeed";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

interface Weapon {
    id: string;
    noncrit: number;
    crit: number;
    expanded?: boolean;
    merge?: Weapon[];
}

export default new class KillTracker {
    // counts: Record<string, [number, number]> = $state({});
    weapons: Weapon[] = $state([]);

    constructor() {
        WS.on(Message.KillCounts, (data) => {
            this.weapons = []

            for(let id in data) {
                if(id in mergedWeapons) continue;

                let weapon = this.createWeapon(id, data[id][0], data[id][1], data);
                this.weapons.push(weapon);
            }

            this.weapons.sort((a, b) => this.getTotal(b) - this.getTotal(a));
        });

        WS.on(Message.KillCountUpdate, ({ weapon, count }) => {
            if(weapon in mergedWeapons) {
                // Update the stats within another weapon
                let existing = this.weapons.find(w => w.id === mergedWeapons[weapon]);
                if(existing) {
                    let mergedWeapon = existing.merge?.find(m => m.id === weapon);
                    if(!mergedWeapon) return;

                    mergedWeapon.noncrit = count[0] - count[1];
                    mergedWeapon.crit = count[1];
                } else {
                    let newWeapon = this.createWeapon(mergedWeapons[weapon], count[0], count[1], { [weapon]: count });
                    this.weapons.push(newWeapon);
                }
            } else {
                // Update or create this weapon
                let existing = this.weapons.find(w => w.id === weapon);
                if(existing) {
                    existing.noncrit = count[0] - count[1];
                    existing.crit = count[1];
                } else {
                    let newWeapon = this.createWeapon(weapon, count[0], count[1]);
                    this.weapons.push(newWeapon);
                }
            }

            this.weapons.sort((a, b) => this.getTotal(b) - this.getTotal(a));
        });
    }

    createWeapon(id: string, total: number, crit: number, otherWeapons?: Record<string, [number, number]>) {
        let weapon: Weapon = { id, noncrit: total - crit, crit };

        // Some weapons have two kill icons, eg machina with player_penetration
        if(id in mergeWith) {
            weapon.merge = [];

            for(let mergeId of mergeWith[id]) {
                let total = 0, crit = 0;

                if(otherWeapons && mergeId in otherWeapons) {
                    total = otherWeapons[mergeId][0];
                    crit = otherWeapons[mergeId][1];
                }

                let merge: Weapon = {
                    id: mergeId,
                    crit,
                    noncrit: total - crit,
                }

                weapon.merge.push(merge);
            }
        }

        return weapon;
    }

    getTotal(weapon: Weapon) {
        let total = weapon.noncrit + weapon.crit;

        if(weapon.merge) {
            for(let merge of weapon.merge) {
                total += merge.noncrit + merge.crit;
            }
        }

        return total;
    }
}