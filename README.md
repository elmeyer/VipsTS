VipsTS
======
A TypeScript (transpilable to JavaScript) port of Tomáš Popela's [vips_java](https://github.com/tpopela/vips_java).

#### Differences / Drawbacks
- does not support graphical output
- does not reproduce most unused fields and methods
- does not support setting custom size thresholds (`VipsParser.ts`)

#### Usage

Transpile the code to JavaScript (e.g. using IntelliJ IDEA), then run it in a browser / engine of your choice.
An example is provided in `VipsTester.ts`.
So far, this project has only been tested with Chromium.

#### Output

The output is provided in JSON format, containing:

- `"id"`: an identifier for the segmented web page, provided in the `Vips` constructor
- `"width"` and `"height"`: dimensions of the segmented web page
- `"segmentations"`: an object holding polygon (bounding box) coordinates for the detected segments in the following format:
    ```
           |-segment array
           ||-multipolygon set
           |||-multipolygon
           ||||-polygon 
           |||||-x,y
    "vips":[[[[[201,23],[1142,23],[1142,0],[201,0],[201,23]]]],...]
    ```
  The polygon is always closed, i.e. it ends with the same coordinates it starts with.
