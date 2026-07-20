const defaultColumns = {
    class: true,
    killstreak: false,
    kd: true,
    health: true,
    ping: false,
    encounters: false,
    timeAlive: false
}

const saved = localStorage.getItem("game-columns");
const initialValue = Object.assign({}, defaultColumns, saved ? JSON.parse(saved) : {});
export let columns: typeof defaultColumns = $state(initialValue);