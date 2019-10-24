///<reference path="VisualStructure.ts"/>
/**
 * Class that handles JSON output of VIPS algorithm
 *
 * @author Lars Meyer
 * @author Tomas Popela
 */
class VipsOutput {
    private _pDoC:  number = 0;
    private _id:    string;

    constructor(id: string, pDoC: number) {
        this._id = id;
        this.setPDoC(pDoC);
    }

    private writeVisualJSONBlocks(segmentations: Array<Array<Array<Array<Array<number>>>>>, visualStructure: VisualStructure) {
        let multiPolygonSet:    Array<Array<Array<Array<number>>>> = new Array<Array<Array<Array<number>>>>();
        let multiPolygon:       Array<Array<Array<number>>> = new Array<Array<Array<number>>>();
        let polygon:            Array<Array<number>> = new Array<Array<number>>();

        let start: Array<number> = new Array<number>(Math.round(visualStructure.getX()), Math.round(visualStructure.getY()));
        polygon.push(start);
        polygon.push(new Array<number>(Math.round(visualStructure.getX()), Math.round(visualStructure.getY() + visualStructure.getHeight())));
        polygon.push(new Array<number>(Math.round(visualStructure.getX() + visualStructure.getWidth()), Math.round(visualStructure.getY() + visualStructure.getHeight())));
        polygon.push(new Array<number>(Math.round(visualStructure.getX() + visualStructure.getWidth()), Math.round(visualStructure.getY())));
        polygon.push(start);

        multiPolygon.push(polygon);
        multiPolygonSet.push(multiPolygon);
        segmentations.push(multiPolygonSet);

        if (this._pDoC >= visualStructure.getDoC()) {
            // continue segmenting
            for (let child of visualStructure.getChildrenVisualStructures()) {
                this.writeVisualJSONBlocks(segmentations, child);
            }
        } // else "stop" segmentation
    }

    public writeJSON(visualStructure: VisualStructure): string {
        let boxes: Array<Array<Array<Array<Array<number>>>>> = new Array<Array<Array<Array<Array<number>>>>>();

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.writeVisualJSONBlocks(boxes, child);
        }

        return JSON.stringify({"id": this._id, "height": window.innerHeight, "width": window.innerWidth, "segmentations": {"vips": boxes}});
    }

    /**
     * Sets permitted degree of coherence pDoC
     * @param pDoC pDoC value
     */
    public setPDoC(pDoC: number): void {
        if (pDoC <= 0 || pDoC > 11) {
            console.error("pDoC value must be between 1 and 11! Not " + pDoC + "!");
            return;
        } else {
            this._pDoC = pDoC;
        }
    }
}