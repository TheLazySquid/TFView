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

export interface PopupArguments {
    player: Player;
    game: number;
    pastPlayer: string;
    profilePicture: { hash: string, name: string };
    input: InputOptions;
    confirm: ConfirmOptions;
}

interface PopupReturned {
    close: () => void;
    name: string;
}

interface Popup {
    overlay: boolean;
    callback: (args: any) => Promise<PopupReturned>;
}

export default new class Popups {
    closePopup?: () => void;
    callbacks: Record<string, Popup> = {};
    openPopups = 0;
    popupStack: { type: any, args: any, name: string }[] = [];

    register<T extends keyof PopupArguments>(type: T, overlay: boolean, callback: (args: PopupArguments[T]) => Promise<PopupReturned>) {
        this.callbacks[type] = { overlay, callback };
    }

    async open<T extends keyof PopupArguments>(type: T, args: PopupArguments[T]) {
        if(!this.callbacks[type]) {
            console.warn(`No callback registered for popup type: ${type}`);
            return;
        }

        this.openPopups++;
        
        let popup = this.callbacks[type];
        let { close, name } = await popup.callback(args);

        if(!popup.overlay) {
            this.closePopup?.();
            this.closePopup = close;

            this.popupStack.push({ type, args, name });
        }
    }

    onClose(overlay: boolean) {
        if(overlay) return;

        this.openPopups--;
        this.closePopup = undefined;
        this.popupStack = [];
    }

    goBack() {
        this.openPopups--;
        this.closePopup?.();

        this.popupStack.pop();
        let popup = this.popupStack.pop()!;

        this.open(popup.type, popup.args);
    }
}