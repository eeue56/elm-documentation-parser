# elm-documentation-parser

A parser for documentation from a folder with an elm-package.json in.

## Installation 

```
npm install --save elm-documentation-parser
```

## Usage

```javascript

readDocumentation("/home/noah/some-elm-project/elm-package.json")
.then((modules) => {
    // module information
});

```
