import { Protocol } from 'devtools-protocol';
import SourceMaps from './SourceMaps';
import { URL } from 'url';

export interface IPosition {
	line: number;
	column: number;
	source: string;
}

export interface IPreview {
	title: string;
	objectId?: Protocol.Runtime.RemoteObjectId;
}

export interface IDescriptor {
	enumerable?: boolean;
	configurable?: boolean;
	writable?: boolean;
	internalProperties?: boolean;
}

interface IGetPropsResponse {
	preview: IPreview;
	name: string;
	descriptors: IDescriptor;
}

export default class Log {
	private sourceMaps = SourceMaps;

	type: Protocol.Runtime.ConsoleAPICalledEvent['type'];
	args: Protocol.Runtime.RemoteObject[];
	generatedPosition: IPosition;
	originalPosition: IPosition;
	url: string;

	constructor(
		logEvent: Protocol.Runtime.ConsoleAPICalledEvent,
		private getPropsByObjectId: (
			objectId: Protocol.Runtime.RemoteObjectId,
			isProperty?: boolean
		) => Promise<Protocol.Runtime.GetPropertiesResponse | undefined>
	) {
		const { type, args, stackTrace } = logEvent;

		if (!stackTrace?.callFrames?.length) {
			return;
		}

		this.type = type;
		this.args = args;

		const callFrame = stackTrace.callFrames[0];
		const { url, lineNumber, columnNumber } = callFrame;

		this.url = url;
		this.generatedPosition = {
			line: lineNumber,
			column: columnNumber,
			source: this.getPathFromURL(url),
		};

		this.originalPosition = this.getOriginalPosition(lineNumber, columnNumber);
	}

	private getOriginalPosition(lineNumber: number, columnNumber: number) {
		const { line, column, source } = this.sourceMaps.getOriginalPosition(this.url, {
			line: lineNumber + 1,
			column: columnNumber + 1,
		});

		return {
			line,
			column,
			source: source ? this.getPathFromURL(source) : '',
		} as IPosition;
	}

	private foramtProps(props: Protocol.Runtime.PropertyDescriptor[]) {
		const descriptors = ['configurable', 'enumerable', 'writable'] as const;

		return props
			.filter(({ value }) => value)
			.map((propertyDescriptor) => {
				const { value, name } = propertyDescriptor;

				return {
					preview: this.getPreview(value as Protocol.Runtime.RemoteObject),
					name,
					descriptors: descriptors
						.filter((key) => Object.hasOwnProperty.call(propertyDescriptor, key))
						.reduce(
							(obj: IDescriptor, key) => ((obj[key] = propertyDescriptor[key]), obj),
							{}
						),
				};
			});
	}

	private foramtInternalProps(props: Protocol.Runtime.InternalPropertyDescriptor[]) {
		return props
			.filter(({ value }) => value)
			.map((propertyDescriptor) => {
				const { value, name } = propertyDescriptor;

				console.log(propertyDescriptor);

				return {
					preview: this.getPreview(value as Protocol.Runtime.RemoteObject),
					name,
					descriptors: {
						internalProperties: true,
					},
				};
			});
	}

	async getProps(object: IPreview): Promise<IGetPropsResponse[] | undefined> {
		if (object.objectId) {
			const ownPropsResponse = (await this.getPropsByObjectId(object.objectId)) || {};
			const propsResponse = (await this.getPropsByObjectId(object.objectId, false)) || {};

			const props = ([
				ownPropsResponse,
				propsResponse,
			] as Protocol.Runtime.GetPropertiesResponse[])
				.map(({ result = [], internalProperties = [] }) => [
					this.foramtProps(result),
					this.foramtInternalProps(internalProperties),
				])
				.flat(2);

			console.log(props);
			return props;
		}
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

	private propToString(prop: Protocol.Runtime.PropertyPreview | undefined) {
		if (prop) {
			return this.quoteString(prop.type === 'string', prop.value);
		}
	}

	private objectPreviewToString(obj: Protocol.Runtime.ObjectPreview) {
		return this.quoteString(obj.type === 'string', obj.description);
	}

	private entryToString(entry: Protocol.Runtime.EntryPreview | undefined) {
		if (entry?.value) {
			if (entry.key) {
				return `${this.objectPreviewToString(entry.key)} => ${this.objectPreviewToString(
					entry.value
				)}`;
			}

			return this.objectPreviewToString(entry.value);
		}
	}

	// private objectToString(obj: any): string {}

	getPreviewOfRemoteObject = (object: Protocol.Runtime.RemoteObject) => {
		const ignoreClasses = ['Object', 'Function'];
		const { type, value, subtype, preview, description, className } = object;
		const props = preview?.properties as Protocol.Runtime.PropertyPreview[];

		if (subtype === ('internal#location' as 'null')) {
			const { source, line } = this.getOriginalPosition(
				value.lineNumber,
				value.columnNumber
			);
			return `${source}:${line}`;
		}

		if (Object.hasOwnProperty.call(object, 'value')) {
			return this.valueToString(value);
		}

		const classDescription =
			className && !ignoreClasses.includes(className) ? `${className} ` : '';

		switch (type) {
			case 'undefined':
				return 'undefined';

			case 'object':
				if (!subtype) {
					return `${classDescription}{${preview?.properties
						.map((prop) => `${prop.name}: ${this.propToString(prop)}`)
						.join(', ')}}`;
				}

				switch (className) {
					case 'Array':
						if (preview?.properties && !preview.overflow) {
							return `[${preview?.properties.map(this.propToString, this).join(', ')}]`;
						}
						break;

					case 'Promise':
						return `${description}: {<${this.propToString(props[0])}> ${this.propToString(
							props[1]
						)}}`;

					case 'Map':
					case 'Set':
					case 'WeakMap':
					case 'WeakSet':
						return `${description} {${preview?.entries
							?.map(this.entryToString, this)
							.join(', ')}}`;
				}
		}

		return description?.replace(/[\s]+/g, ' ');
	};

	get preview() {
		return this.args.map(this.getPreview);
	}

	get previewTitle() {
		return this.preview.map((preview) => preview.title).join(', ');
	}

	getPreview = (remoteObject: Protocol.Runtime.RemoteObject): IPreview => {
		return {
			title: this.getPreviewOfRemoteObject(remoteObject),
			objectId: remoteObject.objectId,
		} as IPreview;
	};
}
