import Server, { type Topic } from "./server";

interface Options<T> {
	topic: Topic;
	listId: string;
	getTotal: () => number;
	getBatch: (offset: number) => T[];
}

export class InfiniteList<T> {
	constructor(private options: Options<T>) {
		Server.on(`list-${options.listId}`, (offset: number, { reply }) => {
			let items = options.getBatch(offset);
			
			if(offset === 0) {
				let total = options.getTotal();
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
}