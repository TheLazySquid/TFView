import { pageSize } from "src/consts";
import Server, { type Topic } from "./server";

interface Options<T, Params> {
	topic: Topic;
	listId: string;
	getTotal: (params: any) => number;
	getBatch: (offset: number, params: Params) => T[];
}

export class InfiniteList<T, Params> {
	constructor(private options: Options<T, Params>) {
		Server.on(`list-${options.listId}`, ({ offset, params }, { reply }) => {
			let items = options.getBatch(offset, params);
			
			if(offset === 0) {
				let total = options.getTotal(params);
				reply({ items, total });
			} else {
				reply({ items });
			}
		});
	}

	addStart(item: T) {
		Server.send(this.options.topic, `list-${this.options.listId}-addStart`, item);
	}

	update(id: any, update: Partial<T>) {
		Server.send(this.options.topic, `list-${this.options.listId}-update`, { id, update });
	}

	delete(id: any) {
		Server.send(this.options.topic, `list-${this.options.listId}-delete`, id);
	}
}

interface LoadedOptions<T, Params> {
	topic: Topic;
	listId: string;
	filter: (item: T, params: Params) => boolean;
	getParamsId: (params: Params) => string;
	reverse?: boolean;
}

export class LoadedInfiniteList<T, Params> {
	items: T[] = [];
	lastId?: string;
	lastParams?: Params;
	filteredItems?: T[];

	constructor(private options: LoadedOptions<T, Params>) {
		Server.on(`list-${options.listId}`, ({ offset, params }, { reply }) => {
			let items = this.getBatch(offset, params);
			
			if(offset === 0) {
				let total = this.getTotal(params);
				reply({ items, total });
			} else {
				reply({ items });
			}
		});
	}

	push(item: T) {
		this.items.push(item);
		if(this.lastParams && this.options.filter(item, this.lastParams)) this.filteredItems?.push(item);

		Server.send(this.options.topic, `list-${this.options.listId}-addStart`, item);
	}

	getFiltered(params: Params) {
		let id = this.options.getParamsId(params);
		if(this.lastId === id && this.filteredItems) {
			return this.filteredItems;
		}

		this.lastId = id;
		this.lastParams = params;
		this.filteredItems = this.items.filter((item) => this.options.filter(item, params));
		return this.filteredItems;
	}

	getTotal(params: Params): number {
		return this.getFiltered(params).length;
	}

	getBatch(offset: number, params: Params): T[] {
		let filtered = this.getFiltered(params);

		if(!this.options.reverse) {
			return filtered.slice(offset, offset + pageSize);
		} else {
			const start = Math.max(0, filtered.length - offset - pageSize);
			return filtered.slice(start, filtered.length - offset);
		}
	}

	clear() {
		this.items = [];
		this.filteredItems = undefined;
		this.lastId = undefined;
		this.lastParams = undefined;
	}
}