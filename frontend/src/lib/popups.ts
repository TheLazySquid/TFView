import type { Player } from "$types/lobby";

export interface PopupsType {
    openPlayerPopup: (player: Player) => void;
    openGamePopup: (rowid: number) => void;
    openPastPlayerPopup: (id: string, name: string) => void;
    openProfilePicturePopup: (avatarHash: string, name: string) => void;
}

let Popups: Partial<PopupsType> & { popupsOpen: number } = {
    popupsOpen: 0
};
export default Popups;