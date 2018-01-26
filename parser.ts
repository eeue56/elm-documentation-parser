import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";

export interface ExposedValue {
    comment: string;
    name: string;
    type: string;
}

export interface Module {
    aliases: any[];
    comment: string;
    name: string;
    types: any[];
    values: ExposedValue[];
}

function parseValue(str: string): ExposedValue {
    const pieces = str.split("-}");
    const comment = pieces[0].split("{-|")[1].trim();
    const name = pieces[1].split(":")[0].trim();
    const type = pieces[1].split(":")[1].trim();

    if (name.length === 0) { return null; }

    return {
        comment,
        name,
        type,
    };
}

export function readDocumentationForFile(filePath: string): Promise<Module> {
    return fs.readFile(filePath).then((contents) => {
        const strContents = contents.toString();
        const res = strContents.match(/{-\|(\n|.)+?-}\n(.+)?\n/gm);

        const values = res.map(parseValue).filter((x) => x != null);
        return {
            aliases: [],
            comment: "",
            name: filePath,
            types: [],
            values,
        };
    });
}

export function readDocumentation(pathToElmPackageJson: string): Promise<Module[]> {
    return fs.readFile(pathToElmPackageJson).then((elmPackageJsonAsString) => {
        const elmPackageJson = JSON.parse(elmPackageJsonAsString.toString());
        const paths = elmPackageJson["source-directories"].map((dir: string) => {
            return path.join(pathToElmPackageJson, "../", dir);
        });

        const globs = paths.map((ourPath: string) => {
            return new Promise((resolve, reject) => {
                glob("**/*.elm", { cwd: ourPath, absolute: true }, (err, files) => {
                    if (err) { return reject(err); }
                    return resolve(files);
                });
            });
        });

        return Promise.all(globs)
            .then((files) => {
                return [].concat.apply([], files);
            })
            .then((files) => {
                return files.map(readDocumentationForFile);
            })
            .then((promises) => {
                return Promise.all(promises).then((stuff) => [].concat.apply([], stuff));
            });
    });
}
