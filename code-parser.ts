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

		let notebook;
		try {
			notebook = JSON.parse(src);
		} catch (error) {
			return "Improperly formatted .ipynb file";
		}

		let codeBlocks: string[] = [];
		if (Array.isArray(notebook.cells) && notebook.cells.length !== 0) {
			notebook.cells.forEach((cell: any) => {
				if (cell.cell_type === 'code' && Array.isArray(cell.source)) {
					let codeBlock = cell.source.join('');
					if (codeBlock.length > 0) {
						codeBlocks.push(codeBlock);
					}
				}
			});
		} else {
			return "No cells found in the notebook";
		}

		if (codeBlocks.length === 0) {
			return "No code cells in the notebook";
		}

		codeBlocks.forEach((block: string, index: number) => {
			if (codeBlocks.length != 1) {
				code += `# Cell ${index + 1}:\n\n`;
			}
			code += block;
			if (index !== codeBlocks.length - 1) {
				code += "\n\n";
			}
		});

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
