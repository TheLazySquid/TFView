import type { InfiniteEvent } from "svelte-infinite-loading";
import WS from "./wsclient.svelte";
import { tick } from "svelte";

interface Options<T, Params> {
    listId: string;
    idKey?: keyof T;
    params?: Params;
    filter: (item: T, params: Params) => boolean;
    reverse?: boolean;
}

export class InfiniteList<T, Params extends Record<string, any>> {
    items: T[] = $state([]);
    total: number | undefined = $state();
    params: Params = $state({} as Params);
    identifier = $state(0);
    scrollContainer?: HTMLElement;

    constructor(private options: Options<T, Params>) {
        if(options.params) this.params = options.params;

        WS.onSwitch(this.destroyBound);
        WS.on(`list-${options.listId}-addStart`, this.onAddStart);

        if(options.idKey) {
            WS.on(`list-${options.listId}-update`, this.onUpdate);
            WS.on(`list-${options.listId}-delete`, this.onDelete);
        }
    }

    destroyBound = this.destroy.bind(this);
    onAddStart = this.addStart.bind(this);
    onUpdate = this.update.bind(this);
    onDelete = this.delete.bind(this);

    destroy() {
        WS.offSwitch(this.destroyBound);
        WS.off(`list-${this.options.listId}-addStart`, this.onAddStart);
        if(this.options.idKey) {
            WS.off(`list-${this.options.listId}-update`, this.onUpdate);
            WS.off(`list-${this.options.listId}-delete`, this.onDelete);
        }
        this.total = undefined;
        this.items = [];
    }

    async addStart(item: T) {
        if(!this.options.filter(item, this.params)) return;
        if(this.total !== undefined) this.total++;

        if(this.options.reverse) {
            this.items.push(item);

            // Stick to the bottom
            if(this.scrollContainer) {
                let atBottom = this.scrollContainer.scrollHeight - this.scrollContainer.scrollTop <= this.scrollContainer.clientHeight + 1;
                await tick();

                if(atBottom) this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
            }
        } else {
            this.items.unshift(item);
        }
    }

    update({ id, update }: { id: any, update: Partial<T> }) {
        let item = this.items.find((i) => i[this.options.idKey!] === id);
        if(!item) return;

        for(let key in update) {
            // @ts-ignore trust me the alternative is worse
            item[key] = update[key];
        }
    }

    delete(id: any) {
        let index = this.items.findIndex((i) => i[this.options.idKey!] === id);
        if(index === -1) return;

        this.items.splice(index, 1);
        if(this.total !== undefined) this.total--;
    }

    infiniteHandler = this.handleInfinite.bind(this);
    async handleInfinite(e: InfiniteEvent) {
        let res = await WS.sendAndRecieve(`list-${this.options.listId}`, {
            offset: this.items.length,
            params: this.params
        });
        if(res.total !== undefined) this.total = res.total;

        if(this.options.reverse) this.items.unshift(...res.items);
        else this.items.push(...res.items);

        if(res.items.length === 0) e.detail.complete();
        else e.detail.loaded();
    }

    resetSearch() {
        this.total = undefined;
        this.items = [];
        this.identifier++;
    }

    clearSearch(params = {} as Params) {
        this.params = params;
        this.resetSearch();
    }

    setScrollContainer(element: HTMLElement) {
        this.scrollContainer = element;
    }
}