import fs from "fs";
import { LionWebJsonChunkWrapper } from "../json/LionWebJsonChunkWrapper";
import { LionWebLanguageDefinition} from "../json/LionwebLanguageDefinition";
import { LionWebValidator } from "../validators/LionWebValidator";
import { printIssues } from "./Utils";


const modelFile = process.argv[2];
const language = process.argv[3];

if (modelFile !== null) {
    const jsonString1 = fs.readFileSync(modelFile, "utf-8");
    const jsonModel = JSON.parse(jsonString1);
    const languageString = fs.readFileSync(language, "utf-8");
    const languageJson = JSON.parse(languageString);

    const languageValidator = new LionWebValidator(languageJson, null);

    languageValidator.validateSyntax();
    languageValidator.validateReferences();
    console.log("===== Language errors ======")
    printIssues(languageValidator.validationResult);

    const modelValidator = new LionWebValidator(jsonModel, new LionWebLanguageDefinition(languageValidator.chunk as LionWebJsonChunkWrapper));
    modelValidator.validateAll();
    console.log("===== Model errors ======")
    printIssues(modelValidator.validationResult);
}
