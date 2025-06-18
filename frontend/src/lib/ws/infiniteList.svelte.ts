import type { InfiniteEvent } from "svelte-infinite-loading";
import WS from "./wsclient.svelte";

interface Options<T, Params> {
    listId: string;
    idKey: keyof T;
    params?: Params;
}

export class InfiniteList<T, Params extends Record<string, any>> {
    items: T[] = $state([]);
    total: number | undefined = $state();
    params: Params = $state({} as Params);

    constructor(private options: Options<T, Params>) {
        if(options.params) this.params = options.params;

        WS.onSwitch(`list-${options.listId}`, () => {
            this.items = [];
            this.total = undefined;
        });

        WS.on(`list-${options.listId}-addStart`, (item: T) => {
            this.items.unshift(item);
            if(this.total !== undefined) this.total++;
        });

        WS.on(`list-${options.listId}-update`, ({ id, update }: { id: any, update: Partial<T> }) => {
            let item = this.items.find((i) => i[options.idKey] === id);

            for(let key in update) {
                // @ts-ignore trust me the alternative is worse
                item[key] = update[key];
            }
        });
    }

    destroy() {
        WS.offSwitch(`list-${this.options.listId}`);
        WS.off(`list-${this.options.listId}-addStart`);
        this.total = undefined;
        this.items = [];
    }

    infiniteHandler = this.handleInfinite.bind(this);
    async handleInfinite(e: InfiniteEvent) {
        let res = await WS.sendAndRecieve(`list-${this.options.listId}`, {
            offset: this.items.length,
            params: this.params
        });
        if(res.total) this.total = res.total;

        this.items.push(...res.items);
        if(res.items.length === 0) e.detail.complete();
        else e.detail.loaded();
    }
}