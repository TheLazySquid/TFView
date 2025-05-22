import type { Player } from "$types/lobby";

interface PopupsType {
    openPlayerPopup: (player: Player) => void;
    openGamePopup: (rowid: number) => void;
    openPastPlayerPopup: (id: string, name: string) => void;
}

let Popups: Partial<PopupsType> & { zIndex: number } = {
    zIndex: 50
};
export default Popups;