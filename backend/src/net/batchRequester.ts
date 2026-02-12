import Log from "src/log";

export interface QueuedRequest<T> {
    id: string;
    res: (result: T) => void;
    rej: () => void;
    failedAttempts: number;
}

interface BatchRequesterOptions {
    name: string;
    batchSize: number;
    getUrl: (ids: string[]) => string;
    handleResponse: (data: any, batch: QueuedRequest<any>[]) => void;
}

export class BatchRequester<T> {
    queue: QueuedRequest<T>[] = [];
    baseDelay = 5000;
    delay = this.baseDelay;
	lastProcessTime = 0;
	processTimeout: Timer | null = null;

    name: string;
    batchSize: number;
    getUrl: (ids: string[]) => string;
    handleResponse: (data: any, batch: QueuedRequest<T>[]) => void;

    constructor(options: BatchRequesterOptions) {
        this.getUrl = options.getUrl;
        this.handleResponse = options.handleResponse;
        this.name = options.name;
        this.batchSize = options.batchSize;
    }

    get batchFull() {
        return this.queue.length >= this.batchSize;
    }

    async runFetch() {
        if(this.queue.length === 0) return;
        
        const batch = this.queue.splice(0, this.batchSize);
        const url = this.getUrl(batch.map(r => r.id));

        try {
            const res = await fetch(url);

            // Increase delay when ratelimited
            if(res.status === 429) this.delay += this.baseDelay;
            if(res.status !== 200) {
                throw new Error(`Recieved status ${res.status}`);
            }

            const data = await res.json();

            // Reset delay on success
            this.delay = this.baseDelay;
            this.handleResponse(data, batch);
            this.processQueue();
        } catch(e) {
            Log.error("Batch request failed", e);

            // Try again, up to 5 times
            for(let i = 0; i < batch.length; i++) {
                if(batch[i].failedAttempts >= 5) {
                    Log.warning(`${this.name} query for id ${batch[i].id} failed after 5 attempts`);
                    batch[i].rej();
                    batch.splice(i, 1);
                    i--;
                } else {
                    batch[i].failedAttempts++;
                }
            }

            // Put them back in the queue, try again later
            this.queue.push(...batch);
            this.processQueue();
        }
    }

	processQueue() {
		const now = Date.now();
		const elapsed = now - this.lastProcessTime;

		if (elapsed >= this.delay) {
			this.lastProcessTime = now;
			this.runFetch();
		} else if (!this.processTimeout) {
			this.processTimeout = setTimeout(() => {
				this.processTimeout = null;
				this.lastProcessTime = Date.now();
				this.runFetch();
			}, this.delay - elapsed);
			this.processTimeout.unref();
		}
	}

    request(id: string, startTimeout: number): Promise<T> {
        return new Promise<T>((res, rej) => {
            this.queue.push({
                id,
                res,
                rej,
                failedAttempts: 0
            });

            setTimeout(this.processQueue.bind(this), startTimeout).unref();
        });
    }
}