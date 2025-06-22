import type { Player } from "$types/lobby";

export interface InputOptions {
    title: string;
    defaultValue?: string;
    textarea?: boolean;
    callback: (value: string) => void;
}

export interface ConfirmOptions {
    title: string;
    message?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export interface PopupsType {
    openPlayerPopup: (player: Player) => void;
    openGamePopup: (rowid: number) => void;
    openPastPlayerPopup: (id: string) => void;
    openProfilePicturePopup: (avatarHash: string, name: string) => void;
    openInputPopup: (options: InputOptions) => void;
    openConfirmPopup: (options: ConfirmOptions) => void;
}

export interface PopupsMethods {
    closePopup: ((() => void) | undefined)[];
    openPopups: number;
}

let Popups: Partial<PopupsType> & PopupsMethods = {
    closePopup: [],
    openPopups: 0
};

export default Popups;