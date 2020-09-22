import { EventEmitter } from 'events';

export class Emitter<T> {
	private readonly emitter = new EventEmitter();

	on<K extends keyof T>(event: K, listener: (arg: T[K]) => void) {
		this.emitter.on(event as string, listener);
	}

	emit<K extends keyof T>(event: K, arg?: T[K]) {
		this.emitter.emit(event as string, arg);
	}
}
