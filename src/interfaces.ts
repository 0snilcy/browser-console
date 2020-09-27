import { EventEmitter } from 'events';
import logger from './components/Logger';

export class Emitter<T> {
	private readonly emitter = new EventEmitter();
	private logger = false;

	once<K extends keyof T>(event: K, listener: (arg: T[K]) => void) {
		this.emitter.once(event as string, listener);
	}

	on<K extends keyof T>(event: K | K[], listener: (arg: T[K]) => void) {
		if (Array.isArray(event)) {
			return event.forEach((eventEl) => this.emitter.on(eventEl as string, listener));
		}

		this.emitter.on(event as string, listener);
	}

	emit<K extends keyof T>(event: K, arg?: T[K]) {
		const message = `${this.constructor.name}.emit( "${event}", ${arg} )`;

		if (this.logger) {
			logger.log(message);
		}

		this.emitter.emit(event as string, arg);
	}
}
