///<reference path="VipsBlock.ts"/>
/**
 * Class that parses blocks on page and finds visual blocks.
 * @author Tomas Popela
 * @author Lars Meyer
 */
class VipsParser {
    private _vipsBlocks:        VipsBlock = null;
    private _currentVipsBlock:  VipsBlock = null;
    private _tempVipsBlock:     VipsBlock = null;

    private _sizeThresholdWidth:    number = 0;
    private _sizeThresholdHeight:   number = 0;

    private _visualBlocksCount: number = 0;
    private _pageWidth:         number = 0;
    private _pageHeight:        number = 0;

            _cnt:               number = 0;

    /**
     * Default constructor
     */
    constructor() {
        this._vipsBlocks            = new VipsBlock();
        this._sizeThresholdHeight   = 80;
        this._sizeThresholdWidth    = 80;
        this._pageWidth             = window.innerWidth;
        this._pageHeight            = window.innerHeight;
    }

    /**
     * Starts visual page segmentation on given page
     */
    public parse(): void {
        this._vipsBlocks        = new VipsBlock();
        this._visualBlocksCount = 0;

        this.constructVipsBlockTree(new ElementBox(document.getElementsByTagName("body").item(0)), this._vipsBlocks);
        this.divideVipsBlockTree(this._vipsBlocks);

        this.getVisualBlocksCount(this._vipsBlocks);
    }

    /**
     * Counts number of visual blocks in visual structure
     * @param vipsBlock Visual structure
     */
    private getVisualBlocksCount(vipsBlock: VipsBlock) {
        if (vipsBlock.isVisualBlock()) {
            this._visualBlocksCount++;
        }

        for (let vipsBlockChild of vipsBlock.getChildren()) {
            if (!(vipsBlockChild.getBox() instanceof TextBox)) {
                this.getVisualBlocksCount(vipsBlockChild);
            }
        }
    }

    /**
     * Construct VIPS block tree from viewport.
     *
     * Starts from <body> element.
     * @param element Box that represents element
     * @param node Visual structure tree node
     */
    private constructVipsBlockTree(element: Box, node: VipsBlock) {
        node.setBox(element);

        if (!(element instanceof TextBox)) {
            for (let box of (<ElementBox> element).getSubBoxList()) {
                node.addChild(new VipsBlock());
                this.constructVipsBlockTree(box, node.getChildren()[node.getChildren().length - 1]);
            }
        }
    }

    /**
     * Tries to divide DOM elements and finds visual blocks.
     * @param vipsBlock Visual structure
     */
    private divideVipsBlockTree(vipsBlock: VipsBlock): void {
        this._currentVipsBlock = vipsBlock;
        let elementBox: ElementBox = <ElementBox> vipsBlock.getBox();

        // With VIPS rules it tries to determine if element is dividable
        if (this.applyVipsRules(elementBox) && vipsBlock.isDividable() && !vipsBlock.isVisualBlock()) {
            // if element is dividable, let's divide it
            this._currentVipsBlock.setAlreadyDivided(true);
            for (let vipsBlockChild of vipsBlock.getChildren()) {
                if (!(vipsBlockChild.getBox() instanceof TextBox)) {
                    this.divideVipsBlockTree(vipsBlockChild);
                }
            }
        } else {
            if (vipsBlock.isDividable()) {
                vipsBlock.setIsVisualBlock(true);
                vipsBlock.setDoC(11);
            }

            if (!this.verifyValidity(elementBox)) {
                this._currentVipsBlock.setIsVisualBlock(false);
            }
        }
    }

    private getAllTextLength(node: ElementBox): number {
        let childrenTextNodes: Array<Box> = new Array<Box>();

        this.findTextChildrenNodes(node, childrenTextNodes);

        let textLength: number = 0;

        for (let child of childrenTextNodes) {
            let childText: string = child.getText();

            if (!(childText === "") && !(childText === " ") && !(childText === "\n")) {
                textLength += childText.length;
            }
        }

        return textLength;
    }

    private getAllChildren(node: Box, children: Array<Box>): void {
        children.push(node);

        if (node instanceof TextBox) {
            return;
        }

        for (let child of (<ElementBox> node).getSubBoxList()) {
            this.getAllChildren(child, children);
        }
    }

    private verifyValidity(node: ElementBox): boolean {
        if (node.getElement().getBoundingClientRect().left < 0 || node.getElement().getBoundingClientRect().top < 0) {
            return false;
        }

        if (node.getElement().getBoundingClientRect().left + node.getElement().getBoundingClientRect().width > this._pageWidth) {
            return false;
        }

        if (node.getElement().getBoundingClientRect().top + node.getElement().getBoundingClientRect().height > this._pageHeight) {
            return false;
        }

        if (node.getElement().getBoundingClientRect().width <= 0 || node.getElement().getBoundingClientRect().height <= 0) {
            return false;
        }

        if (!node.isDisplayed()) {
            return false;
        }

        if (!node.isVisible()) {
            return false;
        }

        if (this.getAllTextLength(node) === 0) {
            let children: Array<Box> = new Array<Box>();

            this.getAllChildren(node, children);

            for (let child of children) {
                let childNodeName: string = child.getNode().nodeName;

                if (!child.isVisible()) {
                    continue;
                }

                if (childNodeName.toLowerCase() === "img") {
                    return true;
                }

                if (childNodeName.toLowerCase() === "input") {
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    /**
     * Checks if node is a valid node.
     *
     * Node is valid if it's visible in the browser. This means that the node's
     * width and height are not zero.
     *
     * @param node
     *            Input node
     *
     * @return True if node is valid, otherwise false.
     */
    private isValidNode(node: ElementBox): boolean {
        if (node.getElement().clientHeight > 0 && node.getElement().clientWidth > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Checks if node is a text node.
     *
     * @param box
     *            Input node
     *
     * @return True if node is a text node, otherwise false.
     */
    private isTextNode(box: ElementBox): boolean {
        return box.getNode().nodeName.toLowerCase() === "text";
    }

    /**
     * Checks if node is a virtual text node.
     *
     * Inline nodes with only text node children are virtual text nodes.
     *
     * @param node
     *            Input node
     *
     * @return True if node is virtual text node, otherwise false.
     */
    private isVirtualTextNode1(node: ElementBox): boolean {
        if (node.isBlock()) {
            return false;
        }

        for (let childNode of node.getSubBoxList()) {
            if (!(childNode instanceof TextBox)) {
                if (!this.isTextNode(<ElementBox> childNode)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Checks if node is a virtual text node.
     *
     * Inline nodes with only text node and virtual text node children are
     * virtual text nodes.
     *
     * @param node
     *            Input node
     *
     * @return True if node is virtual text node, otherwise false.
     */
    private isVirtualTextNode2(node: ElementBox): boolean {
        if (node.isBlock()) {
            return false;
        }

        for (let childNode of node.getSubBoxList()) {
            if (!this.isTextNode(<ElementBox> childNode) ||
                this.isVirtualTextNode1(<ElementBox> childNode)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if node is virtual text node.
     *
     * @param node
     *            Input node
     *
     * @return True if node is virtual text node, otherwise false.
     */
    private isVirtualTextNode(node: ElementBox): boolean {
        if (this.isVirtualTextNode1(node)) {
            return true;
        }

        if (this.isVirtualTextNode2(node)) {
            return true;
        }

        return false;
    }

    private checkValidChildrenNodes(node: Box): void {
        if (node instanceof TextBox) {
            if (!(node.getText() === " ")) {
                this._cnt++;
            }
            return;
        } else {
            if (this.isValidNode(<ElementBox> node)) {
                this._cnt++;
            }
        }

        for (let childNode of (<ElementBox> node).getSubBoxList()) {
            this.checkValidChildrenNodes(childNode);
        }
    }

    /*
     * Checks if node has valid children nodes
     */
    private hasValidChildrenNodes(node: ElementBox): boolean {
        if (node.getNode().nodeName.toLowerCase() === "img" || node.getNode().nodeName.toLowerCase() === "input") {
            if (node.getElement().clientWidth > 0 && node.getElement().clientHeight > 0) {
                this._currentVipsBlock.setIsVisualBlock(true);
                this._currentVipsBlock.setDoC(8);
                return true;
            } else {
                return false;
            }
        }

        if (node.getSubBoxList().length === 0) {
            return false;
        }

        this._cnt = 0;

        for (let child of node.getSubBoxList()) {
            this.checkValidChildrenNodes(child);
        }

        return (this._cnt > 0) ? true : false;
    }

    /*
     * Returns the number of node's valid children
     */
    private numberOfValidChildNodes(node: ElementBox): number {
        this._cnt = 0;

        if (node.getSubBoxList().length === 0) {
            return this._cnt;
        }

        for (let child of node.getSubBoxList()) {
            this.checkValidChildrenNodes(child);
        }

        return this._cnt;
    }

    /**
     * On different DOM nodes it applies different sets of VIPS rules.
     * @param node DOM node
     * @return Returns true if element is dividable, otherwise false.
     */
    private applyVipsRules(node: ElementBox): boolean {
        let retVal: boolean = false;

        if (!node.isBlock()) {
            retVal = this.applyInlineTextNodeVipsRules(node);
        } else if (node.getNode().nodeName.toLowerCase() === "table") {
            retVal = this.applyTableNodeVipsRules(node);
        } else if (node.getNode().nodeName.toLowerCase() === "tr") {
            retVal = this.applyTrNodeVipsRules(node);
        } else if (node.getNode().nodeName.toLowerCase() === "td") {
            retVal = this.applyTdNodeVipsRules(node);
        } else if (node.getNode().nodeName.toLowerCase() === "p") {
            retVal = this.applyPNodeVipsRules(node);
        } else {
            retVal = this.applyOtherNodeVipsRules(node);
        }

        return retVal;
    }

    /**
     * Applies VIPS rules on block nodes other than <P>, <TD>, <TR>, <TABLE>.
     *
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyOtherNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 4 6 8 9 11

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleFour(node))
            return true;

        if (this.ruleSix(node))
            return true;

        if (this.ruleEight(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleEleven(node))
            return true;

        return false;
    }

    /**
     * Applies VIPS rules on <P> nodes.
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyPNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 4 5 6 8 9 11

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleFour(node))
            return true;

        if (this.ruleFive(node))
            return true;

        if (this.ruleSix(node))
            return true;

        if (this.ruleSeven(node))
            return true;

        if (this.ruleEight(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleTen(node))
            return true;

        if (this.ruleEleven(node))
            return true;

        if (this.ruleTwelve(node))
            return true;

        return false;
    }

    /**
     * Applies VIPS rules on <TD> nodes.
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyTdNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 4 8 9 10 12

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleFour(node))
            return true;

        if (this.ruleEight(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleTen(node))
            return true;

        if (this.ruleTwelve(node))
            return true;

        return false;
    }

    /**
     * Applies VIPS rules on <TR> nodes.
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyTrNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 7 9 12

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleSeven(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleTwelve(node))
            return true;

        return false;
    }

    /**
     * Applies VIPS rules on <TABLE> nodes.
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyTableNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 7 9 12

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleSeven(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleTwelve(node))
            return true;

        return false;
    }

    /**
     * Applies VIPS rules on inline nodes.
     * @param node Node
     * @return Returns true if one of the rules succeeds and node is dividable.
     */
    private applyInlineTextNodeVipsRules(node: ElementBox): boolean {
        // 1 2 3 4 5 6 8 9 11

        if (this.ruleOne(node))
            return true;

        if (this.ruleTwo(node))
            return true;

        if (this.ruleThree(node))
            return true;

        if (this.ruleFour(node))
            return true;

        if (this.ruleFive(node))
            return true;

        if (this.ruleSix(node))
            return true;

        if (this.ruleEight(node))
            return true;

        if (this.ruleNine(node))
            return true;

        if (this.ruleTwelve(node))
            return true;

        return false;
    }

    /**
     * VIPS Rule One
     *
     * If the DOM node is not a text node and it has no valid children, then
     * this node cannot be divided and will be cut.
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleOne(node: ElementBox): boolean {
        if (!this.isTextNode(node)) {
            if (!this.hasValidChildrenNodes(node)) {
                this._currentVipsBlock.setIsDividable(false);
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * VIPS Rule Two
     *
     * If the DOM node has only one valid child and the child is not a text
     * node, then divide this node
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleTwo(node: ElementBox): boolean {
        if (this.numberOfValidChildNodes(node) === 1) {
            if (node.getSubBox(0) instanceof TextBox) {
                return false;
            }

            if (!this.isTextNode(<ElementBox> node.getSubBox(0))) {
                return true;
            }
        }

        return false;
    }

    /**
     * VIPS Rule Three
     *
     * If the DOM node is the root node of the sub-DOM tree (corresponding to
     * the block), and there is only one sub DOM tree corresponding to this
     * block, divide this node.
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleThree(node: ElementBox): boolean {
        if (!node.isRootElement()) {
            return false;
        }

        let result: boolean = true;
        let cnt:    number  = 0;

        for (let vipsBlock of this._vipsBlocks.getChildren()) {
            if (vipsBlock.getBox().getNode().nodeName === node.getNode().nodeName) {
                result = true;
                this.isOnlyOneDomSubTree(node.getNode(), vipsBlock.getBox().getNode(), result);

                if (result) {
                    cnt++;
                }
            }
        }

        return (cnt === 1) ? true : false;
    }

    /**
     * Checks if node's subtree is unique in DOM tree.
     * @param pattern Node for comparing
     * @param node Node from DOM tree
     * @param result True if element is unique, otherwise false
     */
    private isOnlyOneDomSubTree(pattern: Node, node: Node, result: boolean): void {
        if (!(pattern.nodeName === node.nodeName)) {
            result = false;
        }

        if (pattern.childNodes.length != node.childNodes.length) {
            result = false;
        }

        if (!result) {
            return;
        }

        for (let i: number = 0; i < pattern.childNodes.length; i++) {
            this.isOnlyOneDomSubTree(pattern.childNodes[i], node.childNodes[i], result);
        }
    }

    /**
     * VIPS Rule Four
     *
     * If all of the child nodes of the DOM node are text nodes or virtual text
     * nodes, do not divide the node.
     * If the font size and font weight of all these child nodes are the same, set
     * the DoC of the extracted block to 10.
     * Otherwise, set the DoC of this extracted block to 9.
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleFour(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        for (let box of node.getSubBoxList()) {
            if (box instanceof TextBox) {
                continue;
            }

            if (!this.isTextNode(<ElementBox> box) ||
                    !this.isVirtualTextNode(<ElementBox> box)) {
                return false;
            }
        }

        this._currentVipsBlock.setIsVisualBlock(true);
        this._currentVipsBlock.setIsDividable(false);

        if (node.getSubBoxList().length === 1) {
            if (node.getSubBox(0).getNode().nodeName.toLowerCase() === "em") {
                this._currentVipsBlock.setDoC(11);
            } else {
                this._currentVipsBlock.setDoC(10);
            }
            return true;
        }

        let fontWeight: string = "";
        let fontSize:   number = 0;

        for (let childNode of node.getSubBoxList()) {
            let childFontSize: number;

            if (childNode.getNode().nodeType === Node.TEXT_NODE) {
                childFontSize = Number(window.getComputedStyle((<Text> childNode.getNode()).parentElement, null).getPropertyValue('font-size'));
            } else if (childNode.getNode().nodeType === Node.ELEMENT_NODE) {
                childFontSize = Number(window.getComputedStyle(<Element> childNode.getNode(), null).getPropertyValue('font-size'));
            }

            if (childNode instanceof TextBox) {
                if (fontSize > 0) {
                    if (fontSize != childFontSize) {
                        this._currentVipsBlock.setDoC(9);
                        break;
                    } else {
                        this._currentVipsBlock.setDoC(10);
                    }
                } else {
                    fontSize = childFontSize;
                }
                continue;
            }

            let child: ElementBox = <ElementBox> childNode;

            if (window.getComputedStyle(child.getElement()).getPropertyValue("font-weight") === null) {
                return false;
            }

            if (fontSize > 0) {
                if (window.getComputedStyle(child.getElement()).getPropertyValue("font-weight").toString() === fontWeight
                    && childFontSize === fontSize) {
                    this._currentVipsBlock.setDoC(10);
                } else {
                    this._currentVipsBlock.setDoC(9);
                    break;
                }
            } else {
                fontWeight  = window.getComputedStyle(child.getElement()).getPropertyValue("font-weight").toString();
                fontSize    = childFontSize;
            }
        }

        return true;
    }

    /**
     * VIPS Rule Five
     *
     * If one of the child nodes of the DOM node is a line-break node, then
     * divide this DOM node.
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleFive(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        for (let childNode of node.getSubBoxList()) {
            if (childNode.isBlock()) {
                return true;
            }
        }

        return false;
    }

    /**
     * VIPS Rule Six
     *
     * If one of the child nodes of the DOM node has HTML tag <hr>, then
     * divide this DOM node
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleSix(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        let children: Array<Box> = new Array<Box>();
        this.getAllChildren(node, children);

        for (let child of children) {
            if (child.getNode().nodeName.toLowerCase() === "hr") {
                return true;
            }
        }

        return false;
    }

    /**
     * VIPS Rule Seven
     *
     * If the background color of this node is different from one of its
     * children’s, divide this node and at the same time, the child nodes with
     * different background color will not be divided in this round.
     * Set the DoC value (6-8) for the child nodes based on the html
     * tag of the child node and the size of the child node.
     *
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleSeven(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        if (this.isTextNode(node)) {
            return false;
        }

        let nodeBgColor: string = this._currentVipsBlock.getBgColor();

        for (let vipsStructureChild of this._currentVipsBlock.getChildren()) {
            if (!(vipsStructureChild.getBgColor() === nodeBgColor)) {
                vipsStructureChild.setIsDividable(false);
                vipsStructureChild.setIsVisualBlock(true);
                vipsStructureChild.setDoC(7);
                return true;
            }
        }

        return false;
    }

    private findTextChildrenNodes(node: Box, results: Array<Box>): void {
        if (node instanceof TextBox) {
            results.push(node);
            return;
        }

        for (let childNode of (<ElementBox> node).getSubBoxList()) {
            this.findTextChildrenNodes(childNode, results);
        }
    }

    /**
     * VIPS Rule Eight
     *
     * If the node has at least one text node child or at least one virtual
     * text node child, and the node's relative size is smaller than
     * a threshold, then the node cannot be divided.
     * Set the DoC value (from 5-8) based on the html tag of the node.
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleEight(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        let children: Array<Box> = new Array<Box>();

        this.findTextChildrenNodes(node, children);

        let cnt: number = children.length;

        if (cnt === 0) {
            return false;
        }

        if (node.getElement().clientWidth === 0 || node.getElement().clientHeight === 0) {
            while (children.length > 0) {
                children.pop();
            }

            this.getAllChildren(node, children);

            for (let child of children) {
                if (child.getNode().nodeType === Node.ELEMENT_NODE) {
                    let childNode: Element = <Element> child.getNode();

                    if (childNode.clientWidth != 0 && childNode.clientHeight != 0) {
                        return true;
                    }
                }
            }
        }

        if (node.getElement().clientWidth * node.getElement().clientHeight > this._sizeThresholdHeight * this._sizeThresholdWidth) {
            return false;
        }

        if (node.getNode().nodeName.toLowerCase() === "ul") {
            return true;
        }

        this._currentVipsBlock.setIsVisualBlock(true);
        this._currentVipsBlock.setIsDividable(false);

        if (node.getNode().nodeName.toLowerCase() === "Xdiv") {
            this._currentVipsBlock.setDoC(7);
        } else if (node.getNode().nodeName.toLowerCase() === "code") {
            this._currentVipsBlock.setDoC(7);
        } else if (node.getNode().nodeName.toLowerCase() === "div") {
            this._currentVipsBlock.setDoC(5);
        } else {
            this._currentVipsBlock.setDoC(8);
        }

        return true;
    }

    /**
     * VIPS Rule Nine
     *
     * If the children of the node with maximum size are smaller than
     * a threshold (relative size), do not divide this node.
     * Set the DoC based on the html tag and size of this node.
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleNine(node: ElementBox): boolean {
        if (node.getSubBoxList().length === 0) {
            return false;
        }

        let maxSize: number = 0;

        for (let childNode of node.getSubBoxList()) {
            if (childNode.getNode().nodeType === Node.ELEMENT_NODE) {
                let childElement: Element = <Element> childNode.getNode();

                let childSize: number = childElement.clientWidth * childElement.clientHeight;

                if (maxSize < childSize) {
                    maxSize = childSize;
                }
            }
        }

        if (maxSize > this._sizeThresholdWidth * this._sizeThresholdHeight) {
            return true;
        }

        this._currentVipsBlock.setIsVisualBlock(true);
        this._currentVipsBlock.setIsDividable(false);

        if (node.getNode().nodeName.toLowerCase() === "Xdiv") {
            this._currentVipsBlock.setDoC(7);
        }

        if (node.getNode().nodeName.toLowerCase() === "a") {
            this._currentVipsBlock.setDoC(11);
        } else {
            this._currentVipsBlock.setDoC(8);
        }

        return true;
    }

    /**
     * VIPS Rule Ten
     *
     * If previous sibling node has not been divided, do not divide this node
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleTen(node: ElementBox): boolean {
        this._tempVipsBlock = null;
        this.findPreviousSiblingNodeVipsBlock(node.getNode().previousSibling, this._vipsBlocks);

        if (this._tempVipsBlock === null) {
            return false;
        }

        if (this._tempVipsBlock.isAlreadyDivided()) {
            return true;
        }

        return false;
    }

    /**
     * VIPS Rule Eleven
     *
     * Divide this node if it is not a text node.
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleEleven(node: ElementBox): boolean {
        return (this.isTextNode(node)) ? false : true;
    }


    /**
     * VIPS Rule Twelve
     *
     * Do not divide this node.
     * Set the DoC value based on the html tag and size of this node.
     * @param node
     *            Input node
     *
     * @return True if rule is applied, otherwise false.
     */
    private ruleTwelve(node: ElementBox): boolean {
        this._currentVipsBlock.setIsDividable(false);
        this._currentVipsBlock.setIsVisualBlock(true);

        if (node.getNode().nodeName.toLowerCase() === "Xdiv") {
            this._currentVipsBlock.setDoC(7);
        } else if (node.getNode().nodeName.toLowerCase() === "li") {
            this._currentVipsBlock.setDoC(8);
        } else if (node.getNode().nodeName.toLowerCase() === "span") {
            this._currentVipsBlock.setDoC(8);
        } else if (node.getNode().nodeName.toLowerCase() === "sup") {
            this._currentVipsBlock.setDoC(8);
        } else if (node.getNode().nodeName.toLowerCase() === "img") {
            this._currentVipsBlock.setDoC(8);
        } else {
            this._currentVipsBlock.setDoC(333);
        }

        return true;
    }

    /**
     * @param sizeTresholdWidth the _sizeTresholdWidth to set
     */
    public setSizeThresholdWidth(sizeThresholdWidth: number): void {
        this._sizeThresholdWidth    = sizeThresholdWidth;
    }

    /**
     * @param sizeTresholdHeight the _sizeTresholdHeight to set
     */
    public setSizeThresholdHeight(sizeThresholdHeight: number): void {
        this._sizeThresholdHeight   = sizeThresholdHeight;
    }

    public getVipsBlocks(): VipsBlock {
        return this._vipsBlocks;
    }

    /**
     * Finds previous sibling node's VIPS block.
     * @param node Node
     * @param vipsBlock Actual VIPS block
     */
    private findPreviousSiblingNodeVipsBlock(node: Node, vipsBlock: VipsBlock): void {
        if (vipsBlock.getBox().getNode().isEqualNode(node)) {
            this._tempVipsBlock = vipsBlock;
            return;
        } else {
            for (let vipsBlockChild of vipsBlock.getChildren()) {
                this.findPreviousSiblingNodeVipsBlock(node, vipsBlockChild);
            }
        }
    }
}