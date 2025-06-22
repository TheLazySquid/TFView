import Server, { type Topic } from "./server";

interface Options<T> {
	topic: Topic;
	listId: string;
	getTotal: (params: any) => number;
	getBatch: (offset: number, params: any) => T[];
}

export class InfiniteList<T> {
	constructor(private options: Options<T>) {
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