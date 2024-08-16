import { EmbedCodeFileSettings } from "./settings";

export interface CodeParser {
	parseCode: (code: string) => string;
	getOutputLanguage: () => string;
}

//Factory method for future complex code types
export function createCodeParser(inputLanguage: string, settings: EmbedCodeFileSettings): CodeParser {
	switch (inputLanguage) {
		case "ipynb":
			return new IpynbParser(settings.displayIpynbAsPython);
			break;
		default:
			return new DefaultParser(inputLanguage);
	}
}

export class IpynbParser implements CodeParser {
	private enabled: boolean;

	constructor(enabled: boolean) {
		this.enabled = enabled;
	}

	parseCode(src: string): string {
		if (!this.enabled) {
			return src;
		}

		let code = ""
		try {
			let notebook = JSON.parse(src);
			if (Array.isArray(notebook.cells)) {
				notebook.cells.forEach((cell: any) => {
					if (cell.cell_type === 'code' && Array.isArray(cell.source)) {
						code += cell.source.join('')
					}
				});
			} else {
				console.error('No cells found in the notebook.');
			}
		} catch (error) {
			console.error("Invalid JSON string:", error);
		}
		return code
	}

	getOutputLanguage(): string {
		if (!this.enabled) {
			return 'ipynb'
		}
		return 'python'
	}
}

export class DefaultParser implements CodeParser {
	private inputLanguage: string;

	constructor(inputLanguage: string) {
		this.inputLanguage = inputLanguage;
	}

	parseCode(src: string): string {
		return src;
	}

	getOutputLanguage(): string {
		return this.inputLanguage;
	}
}
