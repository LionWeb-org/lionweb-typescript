import { ValidationResult } from "../validators/ValidationResult";

const fs = require("fs");
const path = require("path");

export function getAllFiles(dirPath: string, arrayOfFiles: string[]) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file: string) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

export function printIssues(result: ValidationResult): void {
    result.issues.forEach(issue => console.log(issue.errorMsg()));
}
