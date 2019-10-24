///<reference path="Box.ts"/>
/**
 * Based on CSSBox' "ElementBox" class with minimal set of features to support VIPS.
 */
class ElementBox extends Box {
    protected el:           Element;
    protected startChild:   number;
    protected endChild:     number;
    protected nested:       Array<Box>;
    protected boundingBox:  ClientRect | DOMRect;

    constructor(n: Element) {
        super(n);
        if (n != null) {
            this.el         = n;
            this.nested     = this.getVisibleElementBoxNested(n);

            // the body contains all text nodes as children, but we want to keep the hierarchy, so only parse text boxes for non-body elements
            if (n.nodeName.toLowerCase() != "body") {
                this.getTextBoxNested(n);
            }

            let elem: HTMLElement   = <HTMLElement> this.el;
            // https://stackoverflow.com/a/33456469
            this.visible            = !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
            this.startChild         = 0;
            this.endChild           = this.nested.length;
        }
    }

    private getVisibleElementBoxNested(n: Node): Array<Box> {
        let ret: Array<Box> = new Array<Box>();
        let rec: Array<Box>;

        for (let i: number = 0; i < n.childNodes.length; i++) {
            let child: ChildNode = n.childNodes.item(i);

            if (child.nodeType === Node.ELEMENT_NODE) {
                let el: HTMLElement = <HTMLElement> child;
                // https://stackoverflow.com/a/33456469
                if (!!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) {
                    ret.push(new ElementBox(<Element> child));
                }
            }
        }

        if (ret.length === 0) { // only go deeper if we didn't find a visible box yet
            for (let j: number = 0; j < n.childNodes.length; j++) {
                let child: ChildNode = n.childNodes.item(j);

                rec = this.getVisibleElementBoxNested(child);

                while (rec.length > 0) {
                    ret.push(rec.pop());
                }
            }
        }

        return ret;
    }

    private getTextBoxNested(n: Node): void {
        for (let i = 0; i < n.childNodes.length; i++) {
            let element: Node = n.childNodes.item(i);

            if (element.nodeType === Node.TEXT_NODE) {
                this.nested.push(new TextBox(<Text>element));
            }
        }
    }

    public getText(): string {
        let ret: string = "";

        for (let i: number = this.startChild; i < this.endChild; ++i) {
            ret = ret.concat(this.getSubBox(i).getText());
        }

        return ret;
    }

    public getElement(): Element {
        return this.el;
    }

    public getSubBox(index: number): Box {
        return this.nested[index];
    }

    public getSubBoxList(): Array<Box> {
        return this.nested;
    }
}