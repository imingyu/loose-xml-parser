# forgiving-xml-parser

[![Build Status](https://travis-ci.org/imingyu/forgiving-xml-parser.svg?branch=master)](https://travis-ci.org/imingyu/forgiving-xml-parser)
![image](https://img.shields.io/npm/l/forgiving-xml-parser.svg)
[![image](https://img.shields.io/npm/v/forgiving-xml-parser.svg)](https://www.npmjs.com/package/forgiving-xml-parser)
[![image](https://img.shields.io/npm/dt/forgiving-xml-parser.svg)](https://www.npmjs.com/package/forgiving-xml-parser)

Enligsh | [简体中文](./README.zh-CN.md)

An XML/HTML parser and serializer for JavaScript. [Playground](https://imingyu.github.io/forgiving-xml-parser/)

![spec](./docs/img/ad.png)

# Features

-   Transform XML/HTML to JSON(carry code locationInfo or parse steps)
-   Transform JSON back to XML
-   Works with node packages, in browser(like browser such as Miniprogram)
-   Various options are available to customize the transformation
    -   custom parsing behavior(souch as allow `node-name` is empty)
    -   supported events
    -   custom node parser

# Usage

-   1.install

```bash
# using npm
npm i forgiving-xml-parser -S
# using yarn
yarn add forgiving-xml-parser
```

-   2.include

```javascript
// in node
const ForgivingXmlParser = require('forgiving-xml-parser');
const json = ForgivingXmlParser.parse('...');

// in webpack
import {parse, serialize, ...} from 'forgiving-xml-parser';
const json = parse('...');
```

```html
<!-- in browser -->
<script src="xxx/forgiving-xml-parser.js"></script>
<script>
    // global variable
    const json = ForgivingXmlParser.parse("...");
</script>
```

-   3.use

```javascript
const { parse, serialize, parseResultToJSON, FxParser } = require("forgiving-xml-parser");

const xml = `<p>hi xml</p>`;
const json = parseResultToJSON(parse(xml), {
    allowAttrContentHasBr: true,
    allowNodeNameEmpty: true,
    allowNodeNotClose: true,
    allowStartTagBoundaryNearSpace: true,
    allowEndTagBoundaryNearSpace: true,
    allowTagNameHasSpace: true,
    allowNearAttrEqualSpace: true,
    ignoreTagNameCaseEqual: false,
    onEvent(type, context, data) {},
}); // { "nodes": [{ "type": "element", "name": "p", "children": [{ "type": "text", "content": "hi xml" }] }] }

serialize(json); // <p>hi xml</p>

const fxParser = new FxParser();
const json2 = parseResultToJSON(fxParser.parse(xml));
console.log(JSON.stringify(json2) === JSON.stringify(json)); // true
console.log(fxParser.serialize(json2) === serialize(json)); // true
```

<details>
<summary>Event trigger timing</summary>

![Legend](./docs/img/legend.png)

</details>
