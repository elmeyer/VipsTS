/**
 * Separators detector (no graphics output).
 * @author Tomas Popela
 * @author Lars Meyer
 */
class VipsSeparatorNonGraphicsDetector implements VipsSeparatorDetector {
            _vipsBlocks:                VipsBlock           = null;
            _visualBlocks:              Array<VipsBlock>    = null;
    private _horizontalSeparators:      Array<Separator>    = null;
    private _verticalSeparators:        Array<Separator>    = null;

    private _width:                     number              = 0;
    private _height:                    number              = 0;

    private _cleanSeparatorsThreshold:  number              = 0;

    /**
     * Defaults constructor.
     * @param width Pools width
     * @param height Pools height
     */
    constructor(width: number, height: number) {
        this._width                 = width;
        this._height                = height;
        this._horizontalSeparators  = new Array<Separator>();
        this._verticalSeparators    = new Array<Separator>();
        this._visualBlocks          = new Array<VipsBlock>();
    }

    private fillPoolWithBlocks(vipsBlock: VipsBlock): void {
        if (vipsBlock.isVisualBlock()) {
            this._visualBlocks.push(vipsBlock);
        }

        for (let vipsBlockChild of vipsBlock.getChildren()) {
            this.fillPoolWithBlocks(vipsBlockChild);
        }
    }

    /**
     * Fills pool with all visual blocks from VIPS blocks.
     *
     */
    public fillPool(): void {
        if (this._vipsBlocks != null) {
            this.fillPoolWithBlocks(this._vipsBlocks);
        }
    }

    /**
     * Sets VIPS block that will be used for separator computation.
     * @param vipsBlock Visual structure
     */
    public setVipsBlock(vipsBlock: VipsBlock): void {
        this._vipsBlocks = vipsBlock;

        while (this._visualBlocks.length > 0) {
            this._visualBlocks.pop();
        }

        this.fillPoolWithBlocks(vipsBlock);
    }

    /**
     * Gets VIPS block that is used for separator computation.
     */
    public getVipsBlock(): VipsBlock {
        return this._vipsBlocks;
    }

    /**
     * Sets VIPS blocks that will be used for separator computation.
     * @param visualBlocks List of visual blocks
     */
    public setVisualBlocks(visualBlocks: Array<VipsBlock>): void {
        while (this._visualBlocks.length > 0) {
            this._visualBlocks.pop();
        }

        for (let visualBlock of visualBlocks) {
            this._visualBlocks.push(visualBlock);
        }
    }

    /**
     * Gets VIPS blocks that are used for separator computation.
     * @return Visual structure
     */
    public getVisualBlocks(): Array<VipsBlock> {
        return this._visualBlocks;
    }

    /**
     * Computes vertical visual separators
     */
    private findVerticalSeparators(): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                let blockStart: number = vipsBlock.getElementBox().getElement().getBoundingClientRect().left;
                let blockEnd:   number = blockStart + vipsBlock.getElementBox().getElement().getBoundingClientRect().width;

                for (let separator of this._verticalSeparators) {
                    if (blockStart < separator.endPoint) {
                        if (blockStart < separator.startPoint && blockEnd >= separator.endPoint) {
                            let tempSeparators: Array<Separator> = new Array<Separator>();
                            for (let sep of this._verticalSeparators) {
                                tempSeparators.push(sep);
                            }

                            for (let other of tempSeparators) {
                                if (blockStart < other.startPoint && blockEnd > other.endPoint) {
                                    this._verticalSeparators.splice(this._verticalSeparators.indexOf(other) ,1);
                                }
                            }

                            for (let other of this._verticalSeparators) {
                                if (blockEnd > other.startPoint && blockEnd < other.endPoint) {
                                    other.startPoint = blockEnd + 1;
                                    break;
                                }
                            }
                            break;
                        }

                        if (blockEnd < separator.startPoint) {
                            break;
                        }

                        if (blockStart < separator.startPoint && blockEnd >= separator.startPoint) {
                            separator.startPoint = blockEnd + 1;
                            break;
                        }

                        if (blockStart >= separator.startPoint && blockEnd <= separator.endPoint) {
                            if (blockStart === separator.startPoint) {
                                separator.startPoint = blockEnd + 1;
                                break;
                            }

                            if (blockEnd === separator.endPoint) {
                                separator.endPoint = blockStart - 1;
                                break;
                            }

                            this._verticalSeparators.splice(this._verticalSeparators.indexOf(separator) + 1, 0, new Separator(blockEnd + 1, separator.endPoint));
                            separator.endPoint = blockStart - 1;
                            break;
                        }

                        if (blockStart > separator.startPoint && blockStart < separator.endPoint) {
                            let nextSeparatorIndex: number = this._verticalSeparators.indexOf(separator);

                            if (nextSeparatorIndex + 1 < this._verticalSeparators.length) {
                                let nextSeparator: Separator = this._verticalSeparators[this._verticalSeparators.indexOf(separator) + 1];

                                if (blockEnd > nextSeparator.startPoint && blockEnd < nextSeparator.endPoint) {
                                    separator.endPoint = blockStart - 1;
                                    nextSeparator.startPoint = blockEnd + 1;
                                    break;
                                } else {
                                    let tempSeparators: Array<Separator> = new Array<Separator>();
                                    for (let sep of this._verticalSeparators) {
                                        tempSeparators.push(sep);
                                    }

                                    for (let other of tempSeparators) {
                                        if (blockStart < other.startPoint && other.endPoint < blockEnd) {
                                            this._verticalSeparators.splice(this._verticalSeparators.indexOf(other), 1);
                                            continue;
                                        }

                                        if (blockEnd > other.startPoint && blockEnd < other.endPoint) {
                                            other.startPoint = blockEnd + 1;
                                            break;
                                        }

                                        if (blockStart > other.startPoint && blockStart < other.endPoint) {
                                            other.endPoint = blockStart - 1;
                                            continue;
                                        }
                                    }

                                    break;
                                }
                            }
                        }

                        separator.endPoint = blockStart - 1;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Computes horizontal visual separators
     */
    private findHorizontalSeparators(): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                // block vertical coordinates
                let blockStart: number = vipsBlock.getElementBox().getElement().getBoundingClientRect().top;
                let blockEnd: number = blockStart + vipsBlock.getElementBox().getElement().getBoundingClientRect().height;

                // for each separator that we have in pool
                for (let separator of this._horizontalSeparators) {
                    // find separator, that intersects with our visual block
                    if (blockStart < separator.endPoint) {
                        // next there are six relations that the separator and visual block can have

                        // if separator is inside visual block
                        if (blockStart < separator.startPoint && blockEnd >= separator.endPoint) {
                            let tempSeparators: Array<Separator> = new Array<Separator>();
                            for (let sep of this._horizontalSeparators) {
                                tempSeparators.push(sep);
                            }

                            //remove all separators, that are included in block
                            for (let other of tempSeparators) {
                                if (blockStart < other.startPoint && blockEnd > other.endPoint)
                                    this._horizontalSeparators.splice(this._horizontalSeparators.indexOf(other), 1);
                            }

                            //find separator, that is on end of this block (if exists)
                            for (let other of this._horizontalSeparators) {
                                // and if it's necessary change it's start point
                                if (blockEnd > other.startPoint && blockEnd < other.endPoint) {
                                    other.startPoint = blockEnd + 1;
                                    break;
                                }
                            }
                            break;
                        }
                        // if block is inside another block -> skip it
                        if (blockEnd < separator.startPoint)
                            break;
                        // if separator starts in the middle of block
                        if (blockStart <= separator.startPoint && blockEnd >= separator.startPoint) {
                            // change separator start's point coordinate
                            separator.startPoint = blockEnd + 1;
                            break;
                        }
                        // if block is inside the separator
                        if (blockStart >= separator.startPoint && blockEnd < separator.endPoint) {
                            if (blockStart == separator.startPoint) {
                                separator.startPoint = blockEnd + 1;
                                break;
                            }
                            if (blockEnd == separator.endPoint) {
                                separator.endPoint = blockStart - 1;
                                break;
                            }
                            // add new separator that starts behind the block
                            this._horizontalSeparators.splice(this._horizontalSeparators.indexOf(separator) + 1, 0, new Separator(blockEnd + 1, separator.endPoint));
                            // change end point coordinates of separator, that's before block
                            separator.endPoint = blockStart - 1;
                            break;
                        }
                        // if in one block is one separator ending and another one starting
                        if (blockStart > separator.startPoint && blockStart < separator.endPoint) {
                            // find the next one
                            let nextSeparatorIndex: number = this._horizontalSeparators.indexOf(separator);

                            // if it's not the last separator
                            if (nextSeparatorIndex + 1 < this._horizontalSeparators.length) {
                                let nextSeparator: Separator = this._horizontalSeparators[this._horizontalSeparators.indexOf(separator) + 1];

                                // next separator is really starting before the block ends
                                if (blockEnd > nextSeparator.startPoint && blockEnd < nextSeparator.endPoint) {
                                    // change separator start point coordinate
                                    separator.endPoint = blockStart - 1;
                                    nextSeparator.startPoint = blockEnd + 1;
                                    break;
                                } else {
                                    let tempSeparators: Array<Separator> = new Array<Separator>();
                                    for (let sep of this._horizontalSeparators) {
                                        tempSeparators.push(sep);
                                    }

                                    //remove all separators, that are included in block
                                    for (let other of tempSeparators)
                                    {
                                        if (blockStart < other.startPoint && other.endPoint < blockEnd) {
                                            this._horizontalSeparators.splice(this._horizontalSeparators.indexOf(other), 1);
                                            continue;
                                        }
                                        if (blockEnd > other.startPoint && blockEnd < other.endPoint) {
                                            // change separator start's point coordinate
                                            other.startPoint = blockEnd + 1;
                                            break;
                                        }
                                        if (blockStart > other.startPoint && blockStart < other.endPoint) {
                                            other.endPoint = blockStart - 1;
                                            continue;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        // if separator ends in the middle of block
                        // change it's end point coordinate
                        separator.endPoint = blockStart - 1;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Detects horizontal visual separators from Vips blocks.
     */
    public detectHorizontalSeparators(): void {
        if (this._visualBlocks.length === 0) {
            console.error("I don't have any visual blocks!");
            return;
        }

        while (this._horizontalSeparators.length > 0) {
            this._horizontalSeparators.pop();
        }

        this._horizontalSeparators.push(new Separator(0, this._height));

        this.findHorizontalSeparators();

        // remove pool borders
        let tempSeparators: Array<Separator> = new Array<Separator>();
        for (let sep of this._horizontalSeparators) {
            tempSeparators.push(sep);
        }

        for (let separator of tempSeparators) {
            if (separator.startPoint === 0) {
                this._horizontalSeparators.splice(this._horizontalSeparators.indexOf(separator), 1);
            }

            if (separator.endPoint === this._height) {
                this._horizontalSeparators.splice(this._horizontalSeparators.indexOf(separator), 1);
            }
        }

        if (this._cleanSeparatorsThreshold != 0) {
            this.cleanUpSeparators(this._horizontalSeparators);
        }

        this.computeHorizontalWeights();
        this.sortSeparatorsByWeight(this._horizontalSeparators);
    }

    /**
     * Detects vertical visual separators from Vips blocks.
     */
    public detectVerticalSeparators(): void {
        if (this._visualBlocks.length === 0) {
            console.error("I don't have any visual blocks!");
            return;
        }

        while (this._verticalSeparators.length > 0) {
            this._verticalSeparators.pop();
        }

        this._verticalSeparators.push(new Separator(0, this._width));

        this.findVerticalSeparators();

        // remove pool borders
        let tempSeparators: Array<Separator> = new Array<Separator>();
        for (let sep of this._verticalSeparators) {
            tempSeparators.push(sep);
        }

        for (let separator of tempSeparators) {
            if (separator.startPoint === 0) {
                this._verticalSeparators.splice(this._verticalSeparators.indexOf(separator), 1);
            }

            if (separator.endPoint === this._width) {
                this._verticalSeparators.splice(this._verticalSeparators.indexOf(separator), 1);
            }
        }

        if (this._cleanSeparatorsThreshold != 0) {
            this.cleanUpSeparators(this._verticalSeparators);
        }

        this.computeVerticalWeights();
        this.sortSeparatorsByWeight(this._verticalSeparators);
    }

    private cleanUpSeparators(separators: Array<Separator>): void {
        let tempList: Array<Separator> = new Array<Separator>();
        for (let sep of separators) {
            tempList.push(sep);
        }

        for (let separator of tempList) {
            let width: number = separator.endPoint - separator.startPoint + 1;

            if (width < this._cleanSeparatorsThreshold) {
                separators.splice(separators.indexOf(separator), 1);
            }
        }
    }

    /**
     * Sorts given separators by their weight.
     * @param separators Separators
     */
    private sortSeparatorsByWeight(separators: Array<Separator>): void {
        separators.sort(function(a, b) {return a.weight - b.weight});
    }

    /**
     * Computes weights for vertical separators.
     */
    private computeVerticalWeights(): void {
        for (let separator of this._verticalSeparators) {
            this.ruleOne(separator);
            this.ruleTwo(separator, false);
            this.ruleThree(separator, false);
        }
    }

    /**
     * Computes weights for horizontal separators.
     */
    private computeHorizontalWeights(): void {
        for (let separator of this._horizontalSeparators) {
            this.ruleOne(separator);
            this.ruleTwo(separator, true);
            this.ruleThree(separator, true);
            this.ruleFour(separator);
            this.ruleFive(separator);
        }
    }

    /**
     * The greater the distance between blocks on different
     * sides of the separator, the higher the weight.
     * For every 10 points of width we increase weight by 1 point.
     * @param separator Separator
     */
    private ruleOne(separator: Separator): void {
        let width: number = separator.endPoint - separator.startPoint + 1;

        if (width > 55) {
            separator.weight += 12;
        }
        if (width > 45 && width <= 55) {
            separator.weight += 10;
        }
        if (width > 35 && width <= 45) {
            separator.weight += 8;
        }
        if (width > 25 && width <= 35) {
            separator.weight += 6;
        } else if (width > 15 && width <= 25) {
            separator.weight += 4;
        } else if (width > 8 && width <= 15) {
            separator.weight += 2;
        } else {
            separator.weight += 1;
        }
    }

    /**
     * If a visual separator is overlapped with some certain HTML
     * tags (e.g., the <HR> HTML tag), its weight is set to be higher.
     * @param separator Separator
     */
    private ruleTwo(separator: Separator, horizontal: boolean): void {
        let overlappedElements: Array<VipsBlock> = new Array<VipsBlock>();

        if (horizontal) {
            this.findHorizontalOverlappedElements(separator, overlappedElements);
        } else {
            this.findVerticalOverlappedElements(separator, overlappedElements);
        }

        if (overlappedElements.length === 0) {
            return;
        }

        for (let vipsBlock of overlappedElements) {
            if (vipsBlock.getBox().getNode().nodeName.toLowerCase() === "hr") {
                separator.weight += 2;
                break;
            }
        }
    }

    /**
     * Finds elements that are overlapped with a horizontal separator.
     * @param separator Separator that we look at
     * @param vipsBlock Visual block corresponding to element
     * @param result Elements that we found
     */
    private findHorizontalOverlappedElements(separator: Separator, result: Array<VipsBlock>): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                let topEdge:    number = vipsBlock.getElementBox().getElement().getBoundingClientRect().top;
                let bottomEdge: number = vipsBlock.getElementBox().getElement().getBoundingClientRect().bottom;

                // two upper edges of element are overlapped with separator
                if (topEdge > separator.startPoint && topEdge < separator.endPoint && bottomEdge > separator.endPoint) {
                    result.push(vipsBlock);
                }

                // two bottom edges of element are overlapped with separator
                if (topEdge < separator.startPoint && bottomEdge > separator.startPoint && bottomEdge < separator.endPoint) {
                    result.push(vipsBlock);
                }

                // all edges of element are overlapped with separator
                if (topEdge >= separator.startPoint && bottomEdge <= separator.endPoint) {
                    result.push(vipsBlock);
                }
            }
        }
    }

    /**
     * Finds elements that are overlapped with a vertical separator.
     * @param separator Separator that we look at
     * @param vipsBlock Visual block corresponding to element
     * @param result Elements that we found
     */
    private findVerticalOverlappedElements(separator: Separator, result: Array<VipsBlock>): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                let leftEdge:   number = vipsBlock.getElementBox().getElement().getBoundingClientRect().left;
                let rightEdge:  number = vipsBlock.getElementBox().getElement().getBoundingClientRect().right;

                // two left edges of element are overlapped with separator
                if (leftEdge > separator.startPoint && leftEdge < separator.endPoint && rightEdge > separator.endPoint) {
                    result.push(vipsBlock);
                }

                // two right edges of element are overlapped with separator
                if (leftEdge < separator.startPoint && rightEdge > separator.startPoint && rightEdge < separator.endPoint) {
                    result.push(vipsBlock);
                }

                // all edges of element are overlapped with separator
                if (leftEdge >= separator.startPoint && rightEdge <= separator.endPoint) {
                    result.push(vipsBlock);
                }
            }
        }
    }

    /**
     * If background colors of the blocks on two sides of the separator
     * are different, the weight will be increased.
     * @param separator Separator
     */
    private ruleThree(separator: Separator, horizontal: boolean): void {
        let topAdjacentElements:    Array<VipsBlock> = new Array<VipsBlock>();
        let bottomAdjacentElements: Array<VipsBlock> = new Array<VipsBlock>();

        if (horizontal) {
            this.findHorizontalAdjacentBlocks(separator, topAdjacentElements, bottomAdjacentElements);
        } else {
            this.findVerticalAdjacentBlocks(separator, topAdjacentElements, bottomAdjacentElements);
        }

        if (topAdjacentElements.length < 1 || bottomAdjacentElements.length < 1) {
            return;
        }

        let weightIncreased: boolean = false;

        for (let top of topAdjacentElements) {
            for (let bottom of bottomAdjacentElements) {
                if (!(top.getBgColor() === bottom.getBgColor())) {
                    separator.weight   += 2;
                    weightIncreased     = true;
                    break;
                }
            }

            if (weightIncreased) {
                break;
            }
        }
    }

    /**
     * Finds elements that are adjacent to a horizontal separator.
     * @param separator Separator that we look at
     * @param vipsBlock Visual block corresponding to element
     * @param resultTop Elements that we found on top side of separator
     * @param resultBottom Elements that we found on bottom side side of separator
     */
    private findHorizontalAdjacentBlocks(separator: Separator, resultTop: Array<VipsBlock>, resultBottom: Array<VipsBlock>): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                let topEdge:    number = vipsBlock.getElementBox().getElement().getBoundingClientRect().top;
                let bottomEdge: number = vipsBlock.getElementBox().getElement().getBoundingClientRect().bottom;

                // if box is adjacent to separator from bottom
                if (topEdge == separator.endPoint + 1 && bottomEdge > separator.endPoint + 1) {
                    resultBottom.push(vipsBlock);
                }

                // if box is adjacent to separator from top
                if (bottomEdge == separator.startPoint - 1 && topEdge < separator.startPoint - 1) {
                    resultTop.splice(0, 0, vipsBlock);
                }
            }
        }
    }

    /**
     * Finds elements that are adjacent to a vertical separator.
     * @param separator Separator that we look at
     * @param vipsBlock Visual block corresponding to element
     * @param resultLeft Elements that we found on left side of separator
     * @param resultRight Elements that we found on right side side of separator
     */
    private findVerticalAdjacentBlocks(separator: Separator, resultLeft: Array<VipsBlock>, resultRight: Array<VipsBlock>): void {
        for (let vipsBlock of this._visualBlocks) {
            if (vipsBlock.getElementBox() != null) {
                let leftEdge:   number = vipsBlock.getElementBox().getElement().getBoundingClientRect().left;
                let rightEdge:  number = vipsBlock.getElementBox().getElement().getBoundingClientRect().right;

                // if box is adjacent to separator from right
                if (leftEdge == separator.endPoint + 1 && rightEdge > separator.endPoint + 1) {
                    resultRight.push(vipsBlock);
                }

                // if box is adjacent to separator from left
                if (rightEdge == separator.startPoint - 1 && leftEdge < separator.startPoint - 1) {
                    resultLeft.splice(0, 0, vipsBlock);
                }
            }
        }
    }

    /**
     * For horizontal separators, if the differences of font properties
     * such as font size and font weight are bigger on two
     * sides of the separator, the weight will be increased.
     * Moreover, the weight will be increased if the font size of the block
     * above the separator is smaller than the font size of the block
     * below the separator.
     * @param separator Separator
     */
    private ruleFour(separator: Separator): void {
        let topAdjacentElements:    Array<VipsBlock> = new Array<VipsBlock>();
        let bottomAdjacentElements: Array<VipsBlock> = new Array<VipsBlock>();

        this.findHorizontalAdjacentBlocks(separator, topAdjacentElements, bottomAdjacentElements);

        if (topAdjacentElements.length < 1 || bottomAdjacentElements.length < 1) {
            return;
        }

        let weightIncreased: boolean = false;

        for (let top of topAdjacentElements) {
            for (let bottom of bottomAdjacentElements) {
                if (top.getElementBox() != null && bottom.getElementBox() != null) {
                    let topFontSizeString:      string = window.getComputedStyle(top.getElementBox().getElement()).getPropertyValue('font-size');
                    let bottomFontSizeString:   string = window.getComputedStyle(bottom.getElementBox().getElement()).getPropertyValue('font-size');
                    let topFontSize:            number = +topFontSizeString.substring(0, topFontSizeString.length - 2);
                    let bottomFontSize:         number = +bottomFontSizeString.substring(0, topFontSizeString.length - 2);
                    let diff:                   number = Math.abs(topFontSize - bottomFontSize);

                    if (diff != 0) {
                        separator.weight   += 2;
                        weightIncreased     = true;
                        break;
                    } else {
                        let topFontWeight:      string = window.getComputedStyle(top.getElementBox().getElement()).getPropertyValue('font-weight');
                        let bottomFontWeight:   string = window.getComputedStyle(bottom.getElementBox().getElement()).getPropertyValue('font-weight');

                        if (!(topFontWeight === bottomFontWeight)) {
                            separator.weight += 2;
                        }
                    }
                }
            }

            if (weightIncreased) {
                break;
            }
        }

        weightIncreased = false;

        for (let top of topAdjacentElements) {
            for (let bottom of bottomAdjacentElements) {
                if (top.getElementBox() != null && bottom.getElementBox() != null) {
                    let topFontSizeString:      string = window.getComputedStyle(top.getElementBox().getElement()).getPropertyValue('font-size');
                    let bottomFontSizeString:   string = window.getComputedStyle(bottom.getElementBox().getElement()).getPropertyValue('font-size');
                    let topFontSize:            number = +topFontSizeString.substring(0, topFontSizeString.length - 2);
                    let bottomFontSize:         number = +bottomFontSizeString.substring(0, topFontSizeString.length - 2);

                    if (topFontSize < bottomFontSize) {
                        separator.weight   += 2;
                        weightIncreased     = true;
                        break;
                    }
                }
            }

            if (weightIncreased) {
                break;
            }
        }
    }

    /**
     * For horizontal separators, when the structures of the blocks on the two
     * sides of the separator are very similar (e.g. both are text),
     * the weight of the separator will be decreased.
     * @param separator Separator
     */
    private ruleFive(separator: Separator) {
        let topAdjacentElements:    Array<VipsBlock> = new Array<VipsBlock>();
        let bottomAdjacentElements: Array<VipsBlock> = new Array<VipsBlock>();

        this.findHorizontalAdjacentBlocks(separator, topAdjacentElements, bottomAdjacentElements);

        if (topAdjacentElements.length < 1 || bottomAdjacentElements.length < 1) {
            return;
        }

        let weightDecreased: boolean = false;

        for (let top of topAdjacentElements) {
            for (let bottom of bottomAdjacentElements) {
                if (top.getBox() instanceof TextBox &&
                    bottom.getBox() instanceof TextBox) {
                    separator.weight   += 2;
                    weightDecreased     = true;
                    break;
                }
            }

            if (weightDecreased) {
                break;
            }
        }
    }

    /**
     * @return the _horizontalSeparators
     */
    public getHorizontalSeparators(): Array<Separator> {
        return this._horizontalSeparators;
    }

    public setHorizontalSeparators(separators: Array<Separator>): void {
        while (this._horizontalSeparators.length > 0) {
            this._horizontalSeparators.pop();
        }

        for (let sep of separators) {
            this._horizontalSeparators.push(sep);
        }
    }

    public setVerticalSeparators(separators: Array<Separator>): void {
        while (this._verticalSeparators.length > 0) {
            this._verticalSeparators.pop();
        }

        for (let sep of separators) {
            this._verticalSeparators.push(sep);
        }
    }

    /**
     * @return the _verticalSeparators
     */
    public getVerticalSeparators(): Array<Separator> {
        return this._verticalSeparators;
    }

    public setCleanUpSeparators(threshold: number): void {
        this._cleanSeparatorsThreshold = threshold;
    }

}