///<reference path="VipsParser.ts"/>
///<reference path="VisualStructureConstructor.ts"/>
///<reference path="VipsOutput.ts"/>
/**
 * Vision-based Page Segmentation algorithm
 *
 * @author Tomas Popela
 * @author Lars Meyer
 */
class Vips {
    private _pDoC:      number = 11;
    private _filename:  string = "";

    private sizeThresholdWidth:     number = 350;
    private sizeThresholdHeight:    number = 400;

    constructor(filename: string) {
        this._filename = filename;
    }

    /**
     * Sets permitted degree of coherence (pDoC) value.
     * @param value pDoC value.
     */
    public setPredefinedDoC(value: number): void {
        if (value <= 0 || value > 11) {
            console.error("pDoC value must be between 1 and 11! Not " + value + "!");
            return;
        } else {
            this._pDoC = value;
        }
    }

    public setOutputFileName(filename: string): void {
        if (!(filename === "")) {
            this._filename = filename;
        } else {
            console.log("Invalid filename!");
        }
    }

    /**
     * Performs page segmentation.
     */
    public performSegmentation(): string {
        try {
            let numberOfIterations: number = 10;

            let pageWidth:  number = window.innerWidth;
            let pageHeight: number = window.innerHeight;

            let vipsParser:     VipsParser                  = new VipsParser();
            let constructor:    VisualStructureConstructor  = new VisualStructureConstructor(undefined, this._pDoC);

            for (let iterationNumber = 1; iterationNumber < numberOfIterations + 1; iterationNumber++) {
                //visual blocks detection
                vipsParser.setSizeThresholdHeight(this.sizeThresholdHeight);
                vipsParser.setSizeThresholdWidth(this.sizeThresholdWidth);

                vipsParser.parse();

                let vipsBlocks: VipsBlock = vipsParser.getVipsBlocks();

                if (iterationNumber === 1) {
                    // visual structure construction
                    constructor.setVipsBlocks(vipsBlocks);
                    constructor.setPageSize(pageWidth, pageHeight);
                } else {
                    vipsBlocks = vipsParser.getVipsBlocks();
                    constructor.updateVipsBlocks(vipsBlocks);
                }

                // visual structure construction
                constructor.constructVisualStructure();

                // prepare thresholds for next iteration
                if (iterationNumber <= 5 ) {
                    this.sizeThresholdHeight    -= 50;
                    this.sizeThresholdWidth     -= 50;

                }

                if (iterationNumber == 6) {
                    this.sizeThresholdHeight    = 100;
                    this.sizeThresholdWidth     = 100;
                }

                if (iterationNumber == 7) {
                    this.sizeThresholdHeight    = 80;
                    this.sizeThresholdWidth     = 80;
                }

                if (iterationNumber == 8) {
                    this.sizeThresholdHeight    = 40;
                    this.sizeThresholdWidth     = 10;
                }

                if (iterationNumber == 9) {
                    this.sizeThresholdHeight    = 1;
                    this.sizeThresholdWidth     = 1;
                }
            }

            constructor.normalizeSeparatorsMinMax();

            let vipsOutput: VipsOutput = new VipsOutput(this._filename, this._pDoC);

            return vipsOutput.writeJSON(constructor.getVisualStructure());
        } catch (Error) {
            console.error("Something's wrong!");
            console.error(Error.message);
            console.error(Error.stack);
        }
    }
}