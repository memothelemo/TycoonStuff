const fs = require("fs");
const path = require("path");

const repoDirectory = path.join(__dirname, "..");
const excludedFolders = [
	"node_modules",
	"out",
	".github",
	".vscode",
	"snippets",
	"rbxlua",
	"typings"
];

let linesOfCode = 0;

function visitDirectory(directory, excludeEmptyLines) {
	for (const child of fs.readdirSync(directory)) {
		if (excludedFolders.includes(child)) {
			continue;
		}

		const realPath = path.join(directory, child);
		const stat = fs.statSync(realPath);

		if (stat.isDirectory()) {
			visitDirectory(realPath, excludeEmptyLines);
		} else if (stat.isFile()) {
			const ext = path.extname(realPath);
			if (ext === ".ts" || ext === ".tsx") {
				console.log(`Counting ${realPath}`);

				const lines = fs.readFileSync(realPath)
					.toString()
					.split("\n")
					.filter(line => {
						if (excludeEmptyLines) {
							return line !== "";
						}
						return true;
					})
					.length;

				linesOfCode += lines;
			}
		}
	}
}

// parse parameters
const parameters = process.argv.slice(2);
const excludeEmptyLines = parameters.includes("--exclude-empty-lines");

visitDirectory(repoDirectory, excludeEmptyLines);
console.log(`You've written ${linesOfCode} lines of code${
	excludeEmptyLines
		? " without empty lines."
		: "."
}`);
