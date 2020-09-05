import { Protocol } from 'devtools-protocol';
import SourceMaps from './SourceMaps';

export interface Position {
	line: number;
	column: number;
	source: string;
}

type LogType = ConsoleEvent['type'];
type ConsoleEvent = Protocol.Runtime.ConsoleAPICalledEvent;
type ClientObject = Protocol.Runtime.RemoteObject;
type PropertyPreview = Protocol.Runtime.PropertyPreview;
type EntryPreview = Protocol.Runtime.EntryPreview;
type ObjectPreview = Protocol.Runtime.ObjectPreview;

export default class Log {
	private sourceMaps = SourceMaps;

	type: LogType;
	args: ClientObject[];
	generatedPosition: Position;
	originalPosition: Position;

	constructor(logEvent: ConsoleEvent) {
		const { type, args, stackTrace } = logEvent;

		if (!stackTrace?.callFrames?.length) {
			return;
		}

		this.type = type;
		this.args = args;

		const callFrame = stackTrace.callFrames[0];
		const { url, lineNumber, columnNumber } = callFrame;

		this.generatedPosition = {
			line: lineNumber,
			column: columnNumber,
			source: this.getPathFromURL(url),
		};

		const sourceMapPosition = this.sourceMaps.getOriginalPosition(url, {
			line: lineNumber + 1,
			column: columnNumber + 1,
		});

		this.originalPosition = {
			line: sourceMapPosition.line as number,
			column: sourceMapPosition.column as number,
			source: sourceMapPosition.source ? this.getPathFromURL(sourceMapPosition.source) : '',
		};
	}

	private getPathFromURL(url: string) {
		return new URL(url).pathname;
	}

	get existOnClient() {
		return Boolean(
			this.args.length && this.originalPosition.source && this.originalPosition.line
		);
	}

	private quoteString(isQuote: boolean, value: any) {
		return `${isQuote ? `'${value}'` : value}`;
	}

	private valueToString(arg: any) {
		return this.quoteString(typeof arg === 'string', arg);
	}

	private propToString(prop: PropertyPreview | undefined) {
		if (prop) {
			return this.quoteString(prop.type === 'string', prop.value);
		}
	}

	private objectToString(obj: ObjectPreview) {
		return this.quoteString(obj.type === 'string', obj.description);
	}

	private entryToString(entry: EntryPreview | undefined) {
		if (entry?.value) {
			if (entry.key) {
				return `${this.objectToString(entry.key)} => ${this.objectToString(entry.value)}`;
			}

			return this.objectToString(entry.value);
		}
	}

	get preview() {
		const ignoreClasses = ['Object', 'Function'];

		return this.args
			.map((arg) => {
				const { type, value, subtype, preview, description, className } = arg;
				const props = preview?.properties as PropertyPreview[];

				if (Object.hasOwnProperty.call(arg, 'value')) {
					return this.valueToString(value);
				}

				const classDescription =
					className && !ignoreClasses.includes(className) ? `${className}: ` : '';

				switch (type) {
					case 'object':
						if (!subtype) {
							return `${classDescription}{ ${preview?.properties
								.map((prop) => `${prop.name}: ${this.propToString(prop)}`)
								.join(', ')} }`;
						}

						switch (subtype) {
							case 'array':
								return `[ ${preview?.properties.map(this.propToString, this).join(', ')} ]`;

							case 'promise':
								return `${description}: { <${this.propToString(
									props[0]
								)}>: ${this.propToString(props[1])} }`;

							case 'map':
							case 'set':
							case 'weakmap':
							case 'weakset':
								return `${description}: { ${preview?.entries
									?.map(this.entryToString, this)
									.join(', ')} }`;
						}
				}

				return `${classDescription}${description}`;
			})
			.join(', ');
	}
}
