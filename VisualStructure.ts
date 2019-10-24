///<reference path="VipsBlock.ts"/>
///<reference path="Separator.ts"/>
/**
 * Class that represents a visual structure.
 * @author Tomas Popela
 * @author Lars Meyer
 */
class VisualStructure {
    private _nestedBlocks:              Array<VipsBlock>        = null;
    private _childrenVisualStructures:  Array<VisualStructure>  = null;
    private _horizontalSeparators:      Array<Separator>        = null;
    private _verticalSeparators:        Array<Separator>        = null;

    private _width:             number = 0;
    private _height:            number = 0;
    private _x:                 number = 0;
    private _y:                 number = 0;
    private _doC:               number = 12;
    private _containImg:        number = -1;
    private _containP:          number = -1;
    private _textLength:        number = -1;
    private _linkTextLength:    number = -1;
    private _order:             number;

    private _containTable:      boolean = false;
    private _id:                string  = null;

    private _tmpSrcIndex:   number = 0;
    private _srcIndex:      number = 0;
    private _minimalDoC:    number = 0;

    constructor() {
        this._nestedBlocks = new Array<VipsBlock>();
        this._childrenVisualStructures = new Array<VisualStructure>();
        this._horizontalSeparators = new Array<Separator>();
        this._verticalSeparators = new Array<Separator>();
    }

    /**
     * @return Nested blocks in structure
     */
    public getNestedBlocks(): Array<VipsBlock> {
        return this._nestedBlocks;
    }

    /**
     * Adds block to nested blocks
     * @param nestedBlock New block
     */
    public addNestedBlock(nestedBlock: VipsBlock): void {
        this._nestedBlocks.push(nestedBlock);
    }

    /**
     * Sets blocks as nested blocks
     * @param vipsBlocks
     */
    public setNestedBlocks(vipsBlocks: Array<VipsBlock>): void {
        this._nestedBlocks = vipsBlocks;
    }

    /**
     * Clears nested blocks list
     */
    public clearNestedBlocks(): void {
        while (this._nestedBlocks.length > 0) {
            this._nestedBlocks.pop();
        }
    }

    /**
     * Adds new child to visual structure children
     * @param visualStructure New child
     */
    public addChild(visualStructure: VisualStructure): void {
        this._childrenVisualStructures.push(visualStructure);
    }

    /**
     * Adds new child to visual structure at given index
     * @param visualStructure New child
     * @param index Index
     */
    public addChildAt(visualStructure: VisualStructure, index: number) {
        this._childrenVisualStructures.splice(index, 0, visualStructure);
    }

    /**
     * Returns all children structures
     * @return Children structures
     */
    public getChildrenVisualStructures(): Array<VisualStructure> {
        return this._childrenVisualStructures;
    }

    /**
     * Returns all horizontal separators form structure
     * @return List of horizontal separators
     */
    public getHorizontalSeparators(): Array<Separator> {
        return this._horizontalSeparators;
    }

    /**
     * Adds separators to horizontal separators of structure
     * @param horizontalSeparators
     */
    public addHorizontalSeparators(horizontalSeparators: Array<Separator>) {
        for (let sep of horizontalSeparators) {
            this._horizontalSeparators.push(sep);
        }
    }

    /**
     * Returns structure's X coordinate
     * @return X coordinate
     */
    public getX(): number {
        return this._x;
    }

    /**
     * Returns structure's Y coordinate
     * @return Y coordinate
     */
    public getY(): number {
        return this._y;
    }

    /**
     * Sets X coordinate
     * @param x X coordinate
     */
    public setX(x: number): void {
        this._x = x;
    }

    /**
     * Sets Y coordinate
     * @param y Y coordinate
     */
    public setY(y: number): void {
        this._y = y;
    }

    /**
     * Sets width of visual structure
     * @param width Width
     */
    public setWidth(width: number): void {
        this._width = width;
    }

    /**
     * Sets height of visual structure
     * @param height Height
     */
    public setHeight(height: number): void {
        this._height = height;
    }

    /**
     * Returns width of visual structure
     * @return Visual structure's width
     */
    public getWidth(): number {
        return this._width;
    }

    /**
     * Returns height of visual structure
     * @return Visual structure's height
     */
    public getHeight(): number {
        return this._height;
    }

    /**
     * Returns list of all vertical separators in visual structure
     * @return List of vertical separators
     */
    public getVerticalSeparators(): Array<Separator> {
        return this._verticalSeparators;
    }

    /**
     * Sets id of visual structure
     * @param id Id
     */
    public setId(id: string): void {
        this._id = id;
    }

    /**
     * Returns id of visual structure
     * @return Visual structure's id
     */
    public getId(): string {
        return this._id;
    }

    /**
     * Sets visual structure's degree of coherence DoC
     * @param doC Degree of coherence - DoC
     */
    public setDoC(doC: number): void {
        this._doC = doC;
    }

    /**
     * Returns structure's degree of coherence DoC
     * @return Degree of coherence - DoC
     */
    public getDoC(): number {
        return this._doC;
    }

    /**
     * Finds minimal DoC in all children visual structures
     * @param visualStructure Given visual structure
     */
    private findMinimalDoC(visualStructure: VisualStructure): void {
        if (!(visualStructure.getId() === "1")) {
            if (visualStructure.getDoC() < this._minimalDoC)
                this._minimalDoC = visualStructure.getDoC();
        }

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.findMinimalDoC(child);
        }
    }

    /**
     * Updates DoC to normalized DoC
     */
    public updateToNormalizedDoC(): void {
        this._doC = 12;

        for (let separator of this._horizontalSeparators) {
            if (separator.normalizedWeight < this._doC)
                this._doC = separator.normalizedWeight;
        }

        for (let separator of this._verticalSeparators) {
            if (separator.normalizedWeight < this._doC)
                this._doC = separator.normalizedWeight;
        }

        if (this._doC == 12) {
            for (let nestedBlock of this._nestedBlocks)
            {
                if (nestedBlock.getDoC() < this._doC)
                    this._doC = nestedBlock.getDoC();
            }
        }

        this._minimalDoC = 12;

        this.findMinimalDoC(this);

        if (this._minimalDoC < this._doC) {
            this._doC = this._minimalDoC;
        }
    }

    /**
     * Sets visual structure order
     * @param order Order
     */
    public setOrder(order: number) {
        this._order = order;
    }

    /**
     * Adds list of separators to visual structure vertical separators list.
     * @param verticalSeparators
     */
    public addVerticalSeparators(verticalSeparators: Array<Separator>): void {
        for (let sep of verticalSeparators) {
            this._verticalSeparators.push(sep);
        }
    }
}