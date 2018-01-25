import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";

export interface ExposedValue {
    name: string;
    comment: string;
    type: string;
};

export interface Module {
    name: string;
    comment: string;
    aliases: any[];
    types: any[]
    values: ExposedValue[];
}


function parseValue(str: string): ExposedValue {
  let pieces = str.split("-}");
  let comment = pieces[0].split('{-|')[1].trim();
  let name = pieces[1].split(':')[0].trim();
  let type = pieces[1].split(':')[1].trim();

  if (name.length === 0) return null;

  return {
    name: name,
    comment: comment,
    type: type
  };
}


export function readDocumentationForFile(filePath: string) : Promise<Module> {
  return fs.readFile(filePath).then((contents) => {
    let strContents = contents.toString();
    let res = strContents.match(/{-\|(\n|.)+?-}\n(.+)?\n/gm);

    let values = res.map(parseValue).filter((x) => x != null);
    return {
      name: filePath,
      comment: "",
      aliases: [],
      types: [],
      values: values
     }
  });
}


export function readDocumentation(pathToElmPackageJson: string) : Promise<Module[]> {
  return fs.readFile(pathToElmPackageJson).then((elmPackageJsonAsString) => {
    let elmPackageJson = JSON.parse(elmPackageJsonAsString.toString());
    let paths = elmPackageJson["source-directories"].map(function(dir){
      return path.join(pathToElmPackageJson, "../", dir);
    });

    let globs = paths.map((path) => {
      return new Promise((resolve, reject) => {
        glob("**/*.elm", {cwd: path, absolute: true}, (err, files) => {
          if (err) return reject(err);
          return resolve(files);
        });
      });
    });

    return Promise.all(globs)
    .then((files) => {
      return [].concat.apply([], files)
    })
    .then((files) => {
      return files.map(readDocumentationForFile)
    })
    .then((promises) =>{
      return Promise.all(promises).then((stuff) => [].concat.apply([], stuff));
    });
  })
}