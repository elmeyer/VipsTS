/**
 * Based on CSSBox' "Box" class with minimal set of features to support VIPS.
 */
abstract class Box {
    protected node:         Node;
    protected rootelem:     boolean;
    protected isblock:      boolean;
    protected displayed:    boolean;
    protected visible:      boolean;
    protected splitted:     boolean;

    protected constructor(node: Node) {
        this.node       = node;
        this.rootelem   = false;
        if (this.node.nodeType === Node.ELEMENT_NODE) {
            this.isblock = window.getComputedStyle(<Element> this.node).getPropertyValue("display") === "block";
        } else {
            this.isblock = false;
        }
        this.displayed  = true;
        this.visible    = true;
        this.splitted   = false;
    }

    public getNode(): Node {
        return this.node;
    }

    public isRootElement(): boolean {
        return this.rootelem;
    }

    public isBlock(): boolean {
        return this.isblock;
    }

    public isDisplayed(): boolean {
        return this.displayed;
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public makeRoot(): void {
        this.rootelem = true;
    }

    abstract getText(): string;
}