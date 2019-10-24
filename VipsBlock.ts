///<reference path="Box.ts"/>
///<reference path="ElementBox.ts"/>
///<reference path="TextBox.ts"/>
/**
 * Class that represents block on page.
 *
 * @author Tomas Popela
 * @author Lars Meyer
 */
class VipsBlock {
    // rendered Box that corresponds to DOM element
    private _box:       Box                 = null;
    // children of this node
    private _children:  Array<VipsBlock>    = null;
    // node id
    private _id:        number              = 0;
    // node's Degree of Coherence
    private _DoC:       number              = 0;

    // number of images in node
    private _containImg:        number  = 0;
    // if node is image
    private _isImg:             boolean = false;
    // if node is visual block
    private _isVisualBlock:     boolean = false;
    // if node contains table
    private _containTable:      boolean = false;
    // number of paragraphs in node
    private _containP:          number  = 0;
    // if node was already divided
    private _alreadyDivided:    boolean = false;
    // if node can be divided
    private _isDividable:       boolean = true;

    private _bgColor: string = null;

    private _sourceIndex:       number = 0;
    private _tmpSrcIndex:       number = 0;

    // length of text in node
    private _textLen:       number = 0;
    // length of text in links in node
    private _linkTextLen:   number = 0;

    constructor(id?: number, node?: VipsBlock) {
        this._children = new Array<VipsBlock>();

        if (!(typeof id === 'undefined')) {
            this.setId(id);
        }

        if (!(typeof node === 'undefined')) {
            this.addChild(node);
        }
    }

    /**
     * Sets block as visual block
     * @param isVisualBlock Value
     */
    public setIsVisualBlock(isVisualBlock: boolean): void {
        this._isVisualBlock = isVisualBlock;
        this.checkProperties();
    }

    /**
     * Checks if block is visual block
     * @return True if block is visual block, otherwise false
     */
    public isVisualBlock(): boolean {
        return this._isVisualBlock;
    }

    /**
     * Checks the properties of visual block
     */
    private checkProperties(): void {
        this.checkIsImg();
        this.checkContainImg(this);
        this.checkContainTable(this);
        this.checkContainP(this);

        this._linkTextLen   = 0;
        this._textLen       = 0;

        this.countTextLength(this);
        this.countLinkTextLength(this);
        this.setSourceIndex(this.getBox().getNode().ownerDocument);
    }

    /**
     * Checks if visual block is an image.
     */
    private checkIsImg(): void {
        this._isImg = (this._box.getNode().nodeName.toLowerCase() === "img");
    }

    /**
     * Checks if visual block contains image.
     * @param vipsBlock Visual block
     */
    private checkContainImg(vipsBlock: VipsBlock): void {
        if (vipsBlock.getBox().getNode().nodeName.toLowerCase() === "img") {
            vipsBlock._isImg = true;
            this._containImg++;
        }

        for (let childVipsBlock of vipsBlock.getChildren()) {
            this.checkContainImg(childVipsBlock);
        }
    }

    /**
     * Checks if visual block contains table.
     * @param vipsBlock Visual block
     */
    private checkContainTable(vipsBlock: VipsBlock): void {
        if (vipsBlock.getBox().getNode().nodeName.toLowerCase() === "table") {
            this._containTable = true;
        }

        for (let childVipsBlock of vipsBlock.getChildren()) {
            this.checkContainTable(childVipsBlock);
        }
    }

    /**
     * Checks number of paragraphs in visual block.
     * @param vipsBlock Visual block
     */
    private checkContainP(vipsBlock: VipsBlock): void {
        if (vipsBlock.getBox().getNode().nodeName.toLowerCase() === "p") {
            this._containP++;
        }

        for (let childVipsBlock of vipsBlock.getChildren()) {
            this.checkContainP(childVipsBlock);
        }
    }

    /**
     * Counts length of text in links in visual block
     * @param vipsBlock Visual block
     */
    private countLinkTextLength(vipsBlock: VipsBlock): void {
        if (vipsBlock.getBox().getNode().nodeName.toLowerCase() === "a") {
            this._linkTextLen += vipsBlock.getBox().getText().length;
        }

        for (let childVipsBlock of vipsBlock.getChildren()) {
            this.countLinkTextLength(childVipsBlock);
        }
    }

    /**
     * Counts length of text in visual block
     * @param vipsBlock Visual block
     */
    private countTextLength(vipsBlock: VipsBlock): void {
        this._textLen = vipsBlock.getBox().getText().replace("\n", "").length;
    }

    /**
     * Adds new child to blocks' children
     * @param child New child
     */
    public addChild(child: VipsBlock): void {
        this._children.push(child);
    }

    /**
     * Gets all blocks' children
     * @return List of children
     */
    public getChildren(): Array<VipsBlock> {
        return this._children;
    }

    /**
     * Sets block's corresponding Box
     * @param box Box
     */
    public setBox(box: Box): void {
        this._box = box;
    }

    /**
     * Gets Box corresponding to the block
     * @return Box
     */
    public getBox(): Box {
        return this._box;
    }

    /**
     * Gets ElementBox corresponding to the block
     * @return ElementBox
     */
    public getElementBox(): ElementBox {
        if (this._box instanceof ElementBox) {
            return this._box;
        } else {
            return null;
        }
    }

    /**
     * Sets block's id
     * @param id Id
     */
    public setId(id: number): void {
        this._id = id;
    }

    /**
     * Returns block's degree of coherence DoC
     * @return Degree of coherence
     */
    public getDoC(): number {
        return this._DoC;
    }

    /**
     * Sets block's degree of coherence
     * @param doC Degree of coherence
     */
    public setDoC(doC: number): void {
        this._DoC = doC;
    }

    /**
     * Checks if block is dividable
     * @return True if dividable, otherwise false
     */
    public isDividable(): boolean {
        return this._isDividable;
    }

    /**
     * Sets dividability of block
     * @param isDividable True if dividable, otherwise false
     */
    public setIsDividable(isDividable: boolean): void {
        this._isDividable = isDividable;
    }

    /**
     * Checks if node was already divided
     * @return True if block was divided, otherwise false
     */
    public isAlreadyDivided(): boolean {
        return this._alreadyDivided;
    }

    /**
     * Sets if block was divided
     * @param alreadyDivided True if block was divided, otherwise false
     */
    public setAlreadyDivided(alreadyDivided: boolean): void {
        this._alreadyDivided = alreadyDivided;
    }

    /**
     * Finds background color of element
     * @param element Element
     */
    private findBgColor(element: Element): void {
        let backgroundColor: string = element.getAttribute("background-color");

        if (backgroundColor.length === 0) {
            if (element.parentNode != null && !(element.tagName === "body")) {
                this.findBgColor(<Element> element.parentNode);
            } else {
                this._bgColor = "#ffffff";
                return;
            }
        } else {
            this._bgColor = backgroundColor;
            return;
        }
    }

    /**
     * Gets background color of element
     * @return Background color
     */
    public getBgColor(): string {
        if (this._bgColor != null) {
            return this._bgColor;
        }

        if (this.getBox() instanceof TextBox) {
            this._bgColor = "#ffffff";
        } else {
            this._bgColor = window.getComputedStyle(this.getElementBox().getElement()).getPropertyValue("background-color");
        }

        if (this._bgColor.length === 0) {
            this.findBgColor(this.getElementBox().getElement());
        }

        return this._bgColor;
    }

    /**
     * Sets source index of block
     * @param node Node
     */
    private setSourceIndex(node: Node): void {
        if (!(this.getBox().getNode() == node)) {
            this._tmpSrcIndex++;
        } else {
            this._sourceIndex = this._tmpSrcIndex;
        }

        for (let i: number = 0; i < node.childNodes.length; i++) {
            this.setSourceIndex(node.childNodes[i]);
        }
    }

}