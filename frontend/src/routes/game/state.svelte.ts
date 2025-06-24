const defaultColumns = {
    class: true,
    killstreak: false,
    kd: true,
    health: true,
    ping: false,
    encounters: false
}

const saved = localStorage.getItem("game-columns");
export let columns: typeof defaultColumns = $state(saved ? JSON.parse(saved) : defaultColumns);