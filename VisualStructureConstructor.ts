///<reference path="VipsBlock.ts"/>
///<reference path="VisualStructure.ts"/>
///<reference path="ElementBox.ts"/>
///<reference path="VipsSeparatorDetector.ts"/>
///<reference path="VipsSeparatorNonGraphicsDetector.ts"/>
/**
 * Class that constructs final visual structure of page.
 * @author Tomas Popela
 * @author Lars Meyer
 */
class VisualStructureConstructor {
    private _vipsBlocks:            VipsBlock = null;
    private _visualBlocks:          Array<VipsBlock> = null;
    private _visualStructure:       VisualStructure = null;
    private _horizontalSeparators:  Array<Separator> = null;
    private _verticalSeparators:    Array<Separator> = null;

    private _pageWidth:     number = 0;
    private _pageHeight:    number = 0;
    private _srcOrder:      number = 1;
    private _iteration:     number = 0;
    private _pDoC:          number = 5;
    private _maxDoC:        number = 11;
    private _minDoC:        number = 11;

    constructor();

    constructor(vipsBlocks: VipsBlock);

    constructor(vipsBlocks: VipsBlock, pDoC: number);

    constructor(vipsBlocks?: VipsBlock, pDoC?: number) {
        this._horizontalSeparators  = new Array<Separator>();
        this._verticalSeparators    = new Array<Separator>();

        if (!(typeof pDoC === 'undefined')) {
            this.setPDoC(pDoC);
        }

        if (!(typeof vipsBlocks === 'undefined')) {
            this._vipsBlocks = vipsBlocks;
        }
    }

    /**
     * Sets Permitted Degree of Coherence
     * @param pDoC Permitted Degree of Coherence
     */
    public setPDoC(pDoC: number): void {
        if (pDoC <= 0 || pDoC > 11) {
            console.error("pDoC value must be between 1 and 11! Not " + pDoC + "!");
            return;
        } else {
            this._pDoC = pDoC;
        }
    }

    /**
     * Tries to construct visual structure
     */
    public constructVisualStructure(): void {
        this._iteration++;

        // in first iterations we try to find vertical separators before horizontal
        if (this._iteration < 4) {
            this.constructVerticalVisualStructure();
            this.constructHorizontalVisualStructure();
            this.constructVerticalVisualStructure();
            this.constructHorizontalVisualStructure();
        } else {
            // and now we are trying to find horizontal before vertical separators
            this.constructHorizontalVisualStructure();
            this.constructVerticalVisualStructure();
        }

        if (this._iteration != 1) {
            this.updateSeparators();
        }

        // sets order to visual structure
        this._srcOrder = 1;
        this.setOrder(this._visualStructure);
    }

    /**
     * Constructs visual structure with blocks and horizontal separators
     */
    private constructHorizontalVisualStructure(): void {
        // first run
        if (this._visualStructure == null) {
            let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

            detector.setCleanUpSeparators(3);
            detector.setVipsBlock(this._vipsBlocks);
            detector.setVisualBlocks(this._visualBlocks);
            detector.detectHorizontalSeparators();
            this._horizontalSeparators = detector.getHorizontalSeparators();

            this._visualStructure = new VisualStructure();
            this._visualStructure.setId("1");
            this._visualStructure.setNestedBlocks(this._visualBlocks);
            this._visualStructure.setWidth(this._pageWidth);
            this._visualStructure.setHeight(this._pageHeight);

            for (let separator of this._horizontalSeparators) {
                separator.setLeftUp(this._visualStructure.getX(), separator.startPoint);
                separator.setRightDown(this._visualStructure.getX() + this._visualStructure.getWidth(), separator.endPoint);
            }

            this.constructWithHorizontalSeparators(this._visualStructure);
        } else {
            let listStructures: Array<VisualStructure> = new Array<VisualStructure>();
            this.findListVisualStructures(this._visualStructure, listStructures);

            for (let childVisualStructure of listStructures) {
                let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

                detector.setCleanUpSeparators(4);

                detector.setVipsBlock(this._vipsBlocks);
                detector.setVisualBlocks(childVisualStructure.getNestedBlocks());
                detector.detectHorizontalSeparators();
                this._horizontalSeparators = detector.getHorizontalSeparators();

                for (let separator of this._horizontalSeparators)
                {
                    separator.setLeftUp(childVisualStructure.getX(), separator.startPoint);
                    separator.setRightDown(childVisualStructure.getX() + childVisualStructure.getWidth(), separator.endPoint);
                }

                this.constructWithHorizontalSeparators(childVisualStructure);
            }
        }
    }

    /**
     * Constructs visual structure with blocks and vertical separators
     */
    private constructVerticalVisualStructure(): void {
        // first run
        if (this._visualStructure === null) {
            let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

            detector.setCleanUpSeparators(3);
            detector.setVipsBlock(this._vipsBlocks);
            detector.setVisualBlocks(this._visualBlocks);
            detector.detectVerticalSeparators();
            this._verticalSeparators = detector.getVerticalSeparators();
            // the Java implementation sorts again here; skipped here because sorting is performed in detectVerticalSeparators()

            this._visualStructure = new VisualStructure();
            this._visualStructure.setId("1");
            this._visualStructure.setNestedBlocks(this._visualBlocks);
            this._visualStructure.setWidth(this._pageWidth);
            this._visualStructure.setHeight(this._pageHeight);

            for (let separator of this._verticalSeparators) {
                separator.setLeftUp(separator.startPoint, this._visualStructure.getY());
                separator.setRightDown(separator.endPoint, this._visualStructure.getY() + this._visualStructure.getHeight());
            }

            this.constructWithVerticalSeparators(this._visualStructure);
        } else {
            let listStructures: Array<VisualStructure> = new Array<VisualStructure>();
            this.findListVisualStructures(this._visualStructure, listStructures);
            for (let childVisualStructure of listStructures) {
                let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

                detector.setCleanUpSeparators(4);

                detector.setVipsBlock(this._vipsBlocks);
                detector.setVisualBlocks(childVisualStructure.getNestedBlocks());
                detector.detectVerticalSeparators();
                this._verticalSeparators = detector.getVerticalSeparators();

                for (let separator of this._verticalSeparators) {
                    separator.setLeftUp(separator.startPoint, childVisualStructure.getY());
                    separator.setRightDown(separator.endPoint, childVisualStructure.getY() + childVisualStructure.getHeight());
                }

                this.constructWithVerticalSeparators(childVisualStructure);
            }
        }
    }

    /**
     * Performs actual constructing of visual structure with horizontal separators
     * @param actualStructure Actual visual structure
     */
    private constructWithHorizontalSeparators(actualStructure: VisualStructure): void {
        if (actualStructure.getNestedBlocks().length === 0 || this._horizontalSeparators.length === 0) {
            return;
        }

        let topVisualStructure: VisualStructure = null;
        let bottomVisualStructure: VisualStructure = null;
        let nestedBlocks: Array<VipsBlock> = null;

        //construct children visual structures
        for (let separator of this._horizontalSeparators) {
            if (actualStructure.getChildrenVisualStructures().length === 0) {
                topVisualStructure = new VisualStructure();
                topVisualStructure.setX(actualStructure.getX());
                topVisualStructure.setY(actualStructure.getY());
                topVisualStructure.setHeight((separator.startPoint - 1) - actualStructure.getY());
                topVisualStructure.setWidth(actualStructure.getWidth());
                actualStructure.addChild(topVisualStructure);

                bottomVisualStructure = new VisualStructure();
                bottomVisualStructure.setX(actualStructure.getX());
                bottomVisualStructure.setY(separator.endPoint + 1);
                bottomVisualStructure.setHeight((actualStructure.getHeight() + actualStructure.getY()) - separator.endPoint - 1);
                bottomVisualStructure.setWidth(actualStructure.getWidth());
                actualStructure.addChild(bottomVisualStructure);

                nestedBlocks = actualStructure.getNestedBlocks();
            } else {
                let oldStructure: VisualStructure = null;

                for (let childVisualStructure of actualStructure.getChildrenVisualStructures()) {
                    if (separator.startPoint >= childVisualStructure.getY() &&
                        separator.endPoint <= (childVisualStructure.getY() + childVisualStructure.getHeight())) {
                        topVisualStructure = new VisualStructure();
                        topVisualStructure.setX(childVisualStructure.getX());
                        topVisualStructure.setY(childVisualStructure.getY());
                        topVisualStructure.setHeight((separator.startPoint - 1 ) - childVisualStructure.getY());
                        topVisualStructure.setWidth(childVisualStructure.getWidth());
                        let index: number = actualStructure.getChildrenVisualStructures().indexOf(childVisualStructure);
                        actualStructure.addChildAt(topVisualStructure, index);

                        bottomVisualStructure = new VisualStructure();
                        bottomVisualStructure.setX(childVisualStructure.getX());
                        bottomVisualStructure.setY(separator.endPoint + 1);
                        let height: number = (childVisualStructure.getHeight() + childVisualStructure.getY()) - separator.endPoint - 1;
                        bottomVisualStructure.setHeight(height);
                        bottomVisualStructure.setWidth(childVisualStructure.getWidth());
                        actualStructure.addChildAt(bottomVisualStructure, index+1);

                        oldStructure = childVisualStructure;
                        break;
                    }
                }

                if (oldStructure != null) {
                    nestedBlocks = oldStructure.getNestedBlocks();
                    actualStructure.getChildrenVisualStructures().splice(actualStructure.getChildrenVisualStructures().indexOf(oldStructure), 1);
                }
            }

            if (topVisualStructure == null || bottomVisualStructure == null) {
                return;
            }

            for (let vipsBlock of nestedBlocks) {
                if (vipsBlock.getElementBox() != null) {
                    if (vipsBlock.getElementBox().getElement().getBoundingClientRect().top <= separator.startPoint) {
                        topVisualStructure.addNestedBlock(vipsBlock);
                    } else {
                        bottomVisualStructure.addNestedBlock(vipsBlock);
                    }
                }
            }

            topVisualStructure = null;
            bottomVisualStructure = null;
        }

        // set id for visual structures
        let iterator: number = 1;
        for (let visualStructure of actualStructure.getChildrenVisualStructures()) {
            visualStructure.setId(actualStructure.getId() + "-" + String(iterator));
            iterator++;
        }

        let allSeparatorsInBlock: Array<Separator> = new Array<Separator>();
        for (let sep of this._horizontalSeparators) {
            allSeparatorsInBlock.push(sep);
        }

        //remove all children separators
        for (let vs of actualStructure.getChildrenVisualStructures()) {
            while (vs.getHorizontalSeparators().length > 0) {
                vs.getHorizontalSeparators().pop();
            }
        }

        //save all horizontal separators in my region
        actualStructure.addHorizontalSeparators(this._horizontalSeparators);
    }

    /**
     * Performs actual constructing of visual structure with vertical separators
     * @param actualStructure Actual visual structure
     */
    private constructWithVerticalSeparators(actualStructure: VisualStructure): void {
        if (actualStructure.getNestedBlocks().length === 0 || this._verticalSeparators.length === 0) {
            return;
        }

        let leftVisualStructure:    VisualStructure     = null;
        let rightVisualStructure:   VisualStructure     = null;
        let nestedBlocks:           Array<VipsBlock>    = null;

        //construct children visual structures
        for (let separator of this._verticalSeparators) {
            if (actualStructure.getChildrenVisualStructures().length === 0) {
                leftVisualStructure = new VisualStructure();
                leftVisualStructure.setX(actualStructure.getX());
                leftVisualStructure.setY(actualStructure.getY());
                leftVisualStructure.setHeight(actualStructure.getHeight());
                leftVisualStructure.setWidth((separator.startPoint - 1) - actualStructure.getX());
                actualStructure.addChild(leftVisualStructure);

                rightVisualStructure = new VisualStructure();
                rightVisualStructure.setX(separator.endPoint+1);
                rightVisualStructure.setY(actualStructure.getY());
                rightVisualStructure.setHeight(actualStructure.getHeight());
                rightVisualStructure.setWidth((actualStructure.getWidth()+actualStructure.getX()) - separator.endPoint-1);
                actualStructure.addChild(rightVisualStructure);

                nestedBlocks = actualStructure.getNestedBlocks();
            } else {
                let oldStructure: VisualStructure = null;

                for (let childVisualStructure of actualStructure.getChildrenVisualStructures()) {
                    if (separator.startPoint >= childVisualStructure.getX() &&
                        separator.endPoint <= (childVisualStructure.getX() + childVisualStructure.getWidth())) {
                        leftVisualStructure = new VisualStructure();
                        leftVisualStructure.setX(childVisualStructure.getX());
                        leftVisualStructure.setY(childVisualStructure.getY());
                        leftVisualStructure.setHeight(childVisualStructure.getHeight());
                        leftVisualStructure.setWidth((separator.startPoint-1)-childVisualStructure.getX());
                        let index: number = actualStructure.getChildrenVisualStructures().indexOf(childVisualStructure);
                        actualStructure.addChildAt(leftVisualStructure, index);

                        rightVisualStructure = new VisualStructure();
                        rightVisualStructure.setX(separator.endPoint+1);
                        rightVisualStructure.setY(childVisualStructure.getY());
                        rightVisualStructure.setHeight(childVisualStructure.getHeight());
                        let width: number = (childVisualStructure.getWidth()+childVisualStructure.getX())-separator.endPoint-1;
                        rightVisualStructure.setWidth(width);
                        actualStructure.addChildAt(rightVisualStructure, index+1);

                        oldStructure = childVisualStructure;
                        break;
                    }
                }

                if (oldStructure != null) {
                    nestedBlocks = oldStructure.getNestedBlocks();
                    actualStructure.getChildrenVisualStructures().splice(actualStructure.getChildrenVisualStructures().indexOf(oldStructure), 1);
                }
            }

            if (leftVisualStructure == null || rightVisualStructure == null) {
                return;
            }

            for (let vipsBlock of nestedBlocks) {
                if (vipsBlock.getElementBox() != null) {
                    if (vipsBlock.getElementBox().getElement().getBoundingClientRect().left <= separator.startPoint) {
                        leftVisualStructure.addNestedBlock(vipsBlock);
                    } else {
                        rightVisualStructure.addNestedBlock(vipsBlock);
                    }
                }
            }

            leftVisualStructure = null;
            rightVisualStructure = null;
        }

        // set id for visual structures
        let iterator: number = 1;
        for (let visualStructure of actualStructure.getChildrenVisualStructures()) {
            visualStructure.setId(actualStructure.getId() + "-" + String(iterator));
            iterator++;
        }

        let allSeparatorsInBlock: Array<Separator> = new Array<Separator>();
        for (let sep of this._verticalSeparators) {
            allSeparatorsInBlock.push(sep);
        }

        //remove all children separators
        for (let vs of actualStructure.getChildrenVisualStructures()) {
            while (vs.getVerticalSeparators().length > 0) {
                vs.getVerticalSeparators().pop();
            }
        }

        //save all vertical separators in my region
        actualStructure.addVerticalSeparators(this._verticalSeparators);
    }

    /**
     * Sets page's size
     * @param width Page's width
     * @param height Page's height
     */
    public setPageSize(width: number, height: number): void {
        this._pageHeight    = height;
        this._pageWidth     = width;
    }

    /**
     * @return Returns final visual structure
     */
    public getVisualStructure(): VisualStructure {
        return this._visualStructure;
    }

    /**
     * Finds all visual blocks in VipsBlock structure
     * @param vipsBlock Actual VipsBlock
     * @param results	Results
     */
    private findVisualBlocks(vipsBlock: VipsBlock, results: Array<VipsBlock>) {
        if (vipsBlock.isVisualBlock()) {
            results.push(vipsBlock);
        }

        for (let child of vipsBlock.getChildren()) {
            this.findVisualBlocks(child, results);
        }
    }

    /**
     * Sets VipsBlock structure and also finds and saves all visual blocks from it
     * @param vipsBlocks VipsBlock structure
     */
    public setVipsBlocks(vipsBlocks: VipsBlock): void {
        this._vipsBlocks    = vipsBlocks;
        this._visualBlocks  = new Array<VipsBlock>();

        this.findVisualBlocks(vipsBlocks, this._visualBlocks);
    }

    /**
     * Finds list visual structures in visual structure tree
     * @param visualStructure Actual structure
     * @param results Results
     */
    private findListVisualStructures(visualStructure: VisualStructure, results: Array<VisualStructure>) {
        if (visualStructure.getChildrenVisualStructures().length === 0) {
            results.push(visualStructure);
        }

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.findListVisualStructures(child, results);
        }
    }

    /**
     * Replaces given old blocks with given new ones
     * @param oldBlocks	List of old blocks
     * @param newBlocks List of new blocks
     * @param actualStructure Actual Structure
     * @param pathStructures Path from structure to root of the structure
     */
    private replaceBlocksInPredecessors(oldBlocks: Array<VipsBlock>, newBlocks: Array<VipsBlock>, actualStructure: VisualStructure, pathStructures: Array<string>) {
        for (let child of actualStructure.getChildrenVisualStructures()) {
            this.replaceBlocksInPredecessors(oldBlocks, newBlocks, child, pathStructures);
        }

        for (let structureId of pathStructures) {
            if (actualStructure.getId() === structureId) {
                let tempBlocks: Array<VipsBlock> = new Array<VipsBlock>();

                for (let nestedBlock of actualStructure.getNestedBlocks()) {
                    tempBlocks.push(nestedBlock);
                }

                for (let block of tempBlocks) {
                    for (let oldBlock of oldBlocks) {
                        if (block === oldBlock) {
                            actualStructure.getNestedBlocks().splice(actualStructure.getNestedBlocks().indexOf(block), 1);
                        }
                    }
                }

                for (let newBlock of newBlocks) {
                    actualStructure.addNestedBlock(newBlock);
                }
            }
        }
    }

    /**
     * Generates element's ids for elements that are on path
     * @param path (Start visual structure id)
     * @return List of ids
     */
    private generatePathStructures(path: string): Array<string> {
        let pathStructures: Array<string>   = new Array<string>();
        let aaa:            string[]        = path.split("-");
        let tmp:            string          = "";

        for (let i: number = 0; i < aaa.length - 1; i++) {
            tmp.concat(aaa[i]);
            pathStructures.push(tmp);
            tmp += "-";
        }

        return pathStructures;
    }

    /**
     * Updates VipsBlock structure with the new one and also updates visual blocks on page
     * @param vipsBlocks New VipsBlock structure
     */
    public updateVipsBlocks(vipsBlocks: VipsBlock): void {
        this.setVipsBlocks(vipsBlocks);

        let listsVisualStructures:  Array<VisualStructure>  = new Array<VisualStructure>();
        let oldNestedBlocks:        Array<VipsBlock>        = new Array<VipsBlock>();
        this.findListVisualStructures(this._visualStructure, listsVisualStructures);

        for (let visualStructure of listsVisualStructures) {
            for (let oldNestedBlock of visualStructure.getNestedBlocks()) {
                oldNestedBlocks.push(oldNestedBlock);
            }

            visualStructure.clearNestedBlocks();

            for (let visualBlock of this._visualBlocks) {
                let elementBox: ElementBox = visualBlock.getElementBox();

                if (elementBox != null) {
                    if (elementBox.getElement().getBoundingClientRect().left >= visualStructure.getX() &&
                        elementBox.getElement().getBoundingClientRect().left <= (visualStructure.getX() + visualStructure.getWidth())) {
                        if (elementBox.getElement().getBoundingClientRect().top >= visualStructure.getY() &&
                            elementBox.getElement().getBoundingClientRect().top <= (visualStructure.getY() + visualStructure.getHeight())) {
                            if (elementBox.getElement().getBoundingClientRect().height != 0 && elementBox.getElement().getBoundingClientRect().width != 0) {
                                visualStructure.addNestedBlock(visualBlock);
                            }
                        }
                    }
                }
            }

            if (visualStructure.getNestedBlocks().length === 0) {
                for (let oldNestedBlock of oldNestedBlocks) {
                    visualStructure.addNestedBlock(oldNestedBlock);
                    this._visualBlocks.push(oldNestedBlock);
                }
            }

            let path:           string          = visualStructure.getId();
            let pathStructures: Array<string>   = this.generatePathStructures(path);

            this.replaceBlocksInPredecessors(oldNestedBlocks, visualStructure.getNestedBlocks(), this._visualStructure, pathStructures);

            while (oldNestedBlocks.length > 0) {
                oldNestedBlocks.pop();
            }
        }
    }

    /**
     * Sets order to visual structure
     * @param visualStructure
     */
    private setOrder(visualStructure: VisualStructure): void {
        visualStructure.setOrder(this._srcOrder);
        this._srcOrder++;

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.setOrder(child);
        }
    }

    /**
     * Finds all horizontal and vertical separators in given structure
     * @param visualStructure Given structure
     * @param result Results
     */
    private getAllSeparators(visualStructure: VisualStructure, result: Array<Separator>): void {
        this.findAllHorizontalSeparators(visualStructure, result);
        this.findAllVerticalSeparators(visualStructure, result);
        this.removeDuplicates(result);
    }

    /**
     * Finds all horizontal separators in given structure
     * @param visualStructure Given structure
     * @param result Results
     */
    private findAllHorizontalSeparators(visualStructure: VisualStructure, result: Array<Separator>): void {
        for (let sep of visualStructure.getHorizontalSeparators()) {
            result.push(sep);
        }

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.findAllHorizontalSeparators(child, result);
        }
    }

    /**
     * Finds all vertical separators in given structure
     * @param visualStructure Given structure
     * @param result Results
     */
    private findAllVerticalSeparators(visualStructure: VisualStructure, result: Array<Separator>): void {
        for (let sep of visualStructure.getVerticalSeparators()) {
            result.push(sep);
        }

        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.findAllVerticalSeparators(child, result);
        }
    }

    /**
     * Updates separators when replacing blocks
     * @param visualStructure Actual visual structure
     */
    private updateSeparatorsInStructure(visualStructure: VisualStructure): void {
        let adjacentBlocks: Array<VipsBlock> = new Array<VipsBlock>();
        let allSeparators:  Array<Separator> = new Array<Separator>();

        for (let sep of visualStructure.getHorizontalSeparators()) {
            allSeparators.push(sep);
        }

        // separator between blocks
        for (let separator of allSeparators){
            let aboveBottom:    number = 0;
            let belowTop:       number = this._pageHeight;
            let above: VipsBlock = null;
            let below: VipsBlock = null;

            while (adjacentBlocks.length > 0) {
                adjacentBlocks.pop();
            }

            for (let block of visualStructure.getNestedBlocks()) {
                if (block.getElementBox() != null) {
                    let top:    number = block.getElementBox().getElement().getBoundingClientRect().top;
                    let bottom: number = block.getElementBox().getElement().getBoundingClientRect().bottom;

                    if (bottom <= separator.startPoint && bottom > aboveBottom) {
                        aboveBottom = bottom;
                        above = block;
                    }

                    if (top >= separator.endPoint && top < belowTop) {
                        belowTop = top;
                        below = block;
                        adjacentBlocks.push(block);
                    }
                }
            }

            if (above == null || below == null) {
                continue;
            }

            adjacentBlocks.push(above);
            adjacentBlocks.push(below);

            if (aboveBottom == separator.startPoint - 1 && belowTop == separator.endPoint + 1) {
                continue;
            }

            if (adjacentBlocks.length < 2) {
                continue;
            }

            let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

            detector.setCleanUpSeparators(3);
            if (this._iteration > 3) {
                detector.setCleanUpSeparators(6);
            }

            //detector.setVipsBlock(_vipsBlocks);
            detector.setVisualBlocks(adjacentBlocks);
            detector.detectHorizontalSeparators();

            let tempSeparators: Array<Separator> = new Array<Separator>();
            for (let sep of visualStructure.getHorizontalSeparators()) {
                tempSeparators.push(sep);
            }

            if (detector.getHorizontalSeparators().length === 0) {
                continue;
            }

            let newSeparator: Separator = detector.getHorizontalSeparators()[0];
            newSeparator.setLeftUp(visualStructure.getX(), newSeparator.startPoint);
            newSeparator.setRightDown(visualStructure.getX() + visualStructure.getWidth(), newSeparator.endPoint);

            //remove all separators that are included in block
            for (let other of tempSeparators)
            {
                if (other === separator) {
                    visualStructure.getHorizontalSeparators().splice(visualStructure.getHorizontalSeparators().indexOf(other) + 1, 0, newSeparator);
                    visualStructure.getHorizontalSeparators().splice(visualStructure.getHorizontalSeparators().indexOf(other), 1);
                    break;
                }
            }
        }

        // new blocks in separator
        for (let separator of allSeparators) {
            let blockTop:   number = this._pageHeight;
            let blockDown:  number = 0;
            while (adjacentBlocks.length > 0) {
                adjacentBlocks.pop();
            }

            for (let block of visualStructure.getNestedBlocks()) {
                if (block.getElementBox() != null) {
                    let top:    number = block.getElementBox().getElement().getBoundingClientRect().top;
                    let bottom: number = block.getElementBox().getElement().getBoundingClientRect().bottom;

                    // block is inside the separator
                    if (top > separator.startPoint && bottom < separator.endPoint) {
                        adjacentBlocks.push(block);

                        if (top < blockTop)
                            blockTop = top;

                        if (bottom > blockDown)
                            blockDown = bottom;
                    }
                }
            }

            if (adjacentBlocks.length === 0) {
                continue;
            }

            let detector: VipsSeparatorDetector = new VipsSeparatorNonGraphicsDetector(this._pageWidth, this._pageHeight);

            detector.setCleanUpSeparators(3);
            if (this._iteration > 3) {
                detector.setCleanUpSeparators(6);
            }

            detector.setVisualBlocks(adjacentBlocks);
            detector.detectHorizontalSeparators();

            let tempSeparators: Array<Separator> = new Array<Separator>();
            for (let sep of visualStructure.getHorizontalSeparators()) {
                tempSeparators.push(sep);
            }

            let newSeparators: Array<Separator> = new Array<Separator>();

            let newSeparatorTop: Separator = new Separator(separator.startPoint, blockTop - 1, separator.weight);
            newSeparatorTop.setLeftUp(visualStructure.getX(), newSeparatorTop.startPoint);
            newSeparatorTop.setRightDown(visualStructure.getX() + visualStructure.getWidth(), newSeparatorTop.endPoint);

            newSeparators.push(newSeparatorTop);

            let newSeparatorBottom: Separator = new Separator(blockDown + 1, separator.endPoint, separator.weight);
            newSeparatorBottom.setLeftUp(visualStructure.getX(), newSeparatorBottom.startPoint);
            newSeparatorBottom.setRightDown(visualStructure.getX() + visualStructure.getWidth(), newSeparatorBottom.endPoint);

            if (detector.getHorizontalSeparators().length != 0) {
                for (let sep of detector.getHorizontalSeparators()) {
                    newSeparators.push(sep);
                }
            }

            newSeparators.push(newSeparatorBottom);

            //remove all separators that are included in block
            for (let other of tempSeparators) {
                if (other === separator) {
                    let index: number = visualStructure.getHorizontalSeparators().indexOf(other) + 1;
                    for (let sep of newSeparators) {
                        visualStructure.getHorizontalSeparators().splice(index, 0, sep);
                        index++;
                    }

                    while (visualStructure.getHorizontalSeparators().length > 0) {
                        visualStructure.getHorizontalSeparators().pop();
                    }
                    break;
                }
            }
        }
        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.updateSeparatorsInStructure(child);
        }
    }

    /**
     * Updates separators on whole page
     */
    private updateSeparators(): void {
        this.updateSeparatorsInStructure(this._visualStructure);
    }

    /**
     * Removes duplicates from list of separators
     * @param separators
     */
    private removeDuplicates(separators: Array<Separator>): void {
        let set: Array<Separator> = new Array<Separator>();
        for (let sep of separators) {
            if (set.indexOf(sep) == -1) {
                set.push(sep);
            }
        }

        while (separators.length > 0) {
            separators.pop();
        }

        for (let sep of set) {
            separators.push(sep);
        }
    }

    /**
     * Converts normalized weight of separator to DoC
     * @param value Normalized weight of separator
     * @return DoC
     */
    private getDoCValue(value: number): number {
        if (value === 0) {
            return this._maxDoC;
        }

        return ((this._maxDoC + 1) - value);
    }

    /**
     * Normalizes separators' weights with linear normalization
     */
    public normalizeSeparatorsMinMax(): void {
        let separators: Array<Separator> = new Array<Separator>();

        this.getAllSeparators(this._visualStructure, separators);

        let maxSep: Separator = new Separator(0, this._pageHeight);
        separators.push(maxSep);
        maxSep.weight = 40;

        separators.sort(function(a, b) {return a.weight - b.weight;});

        let minWeight: number = separators[0].weight;
        let maxWeight: number = separators[separators.length - 1].weight;

        for (let separator of separators) {
            let normalizedValue: number = (separator.weight - minWeight) / (maxWeight - minWeight) * (11 - 1) + 1;
            separator.normalizedWeight = this.getDoCValue(Math.ceil(normalizedValue));
        }

        this.updateDoC(this._visualStructure);

        this._visualStructure.setDoC(1);
    }

    /**
     * Updates DoC of all visual structures nodes
     * @param visualStructure Visual Structure
     */
    private updateDoC(visualStructure: VisualStructure): void {
        for (let child of visualStructure.getChildrenVisualStructures()) {
            this.updateDoC(child);
        }

        visualStructure.updateToNormalizedDoC();
    }

}