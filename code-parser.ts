import { EmbedCodeFileSettings } from "./settings";

export interface CodeParser {
	parseCode: (code: string, args: string) => string | Error;
	getOutputLanguage: () => string;
}

//Factory method for future complex code types
export function createCodeParser(inputLanguage: string, settings: EmbedCodeFileSettings): CodeParser {
	switch (inputLanguage) {
		case "ipynb":
			return new IpynbParser(settings.displayIpynbAsPython, settings.showIpynbCellNumbers);
			break;
		default:
			return new DefaultParser(inputLanguage);
	}
}

export class IpynbParser implements CodeParser {
	private enabled: boolean;
	private cellNumbers: boolean;

	constructor(enabled: boolean, cellNumbers: boolean) {
		this.enabled = enabled;
		this.cellNumbers = cellNumbers;
	}

	parseCode(src: string, args: string): string | Error {
		if (!this.enabled) {
			return src;
		}

		let keep_cells: number[] = [];
		if (args) {
			const regex = /^(\d+)(,\d+)*$/;
			if (regex.test(args)) {
				keep_cells = args.split(",").map(value => parseInt(value));
			} else {
				return new Error("Cell numbers should be a list of comma-separated, 1-based numbers, with no spaces, in quotes");
			}
		}

		let code = ""

		let notebook;
		try {
			notebook = JSON.parse(src);
		} catch (error) {
			return new Error("Improperly formatted .ipynb file");
		}

		let codeBlocks: string[] = [];
		if (Array.isArray(notebook.cells) && notebook.cells.length !== 0) {
			notebook.cells.forEach((cell: any, index: number) => {
				if (cell.cell_type === 'code' && Array.isArray(cell.source)
						&& (keep_cells.length === 0 ||
							(keep_cells.length > 0 && keep_cells.includes(index + 1)))) {
					let codeBlock = cell.source.join('');
					if (codeBlock.length > 0) {
						codeBlocks.push(codeBlock);
					}
				}
			});
		} else {
			return new Error("No cells found in the notebook");
		}

		if (codeBlocks.length === 0) {
			return new Error("No code cells in the notebook");
		}

		codeBlocks.forEach((block: string, index: number) => {
			if (codeBlocks.length != 1 && this.cellNumbers) {
				code += `# Cell ${index + 1}:\n\n`;
			}
			code += block;
			if (index !== codeBlocks.length - 1) {
				code += "\n";
				if (this.cellNumbers) {
					code += "\n";
				}
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

	parseCode(src: string, args: string): string {
		return src;
	}

	getOutputLanguage(): string {
		return this.inputLanguage;
	}
}
