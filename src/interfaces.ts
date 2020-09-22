import { EventEmitter } from 'events';

export class Emitter<T> {
	private readonly emitter = new EventEmitter();
	private logger = true;

	on<K extends keyof T>(event: K | K[], listener: (arg: T[K]) => void) {
		if (Array.isArray(event)) {
			return event.forEach((eventEl) => this.emitter.on(eventEl as string, listener));
		}

		this.emitter.on(event as string, listener);
	}

	emit<K extends keyof T>(event: K, arg?: T[K]) {
		if (this.logger) {
			console.log(`${this.constructor.name}.emit( "${event}", ${arg} )`);
		}

		this.emitter.emit(event as string, arg);
	}
}
