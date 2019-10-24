///<reference path="Box.ts"/>
/**
 * Based on CSSBox' "TextBox" class with minimal set of features to support VIPS.
 */
class TextBox extends Box {
    private textNode:   Text;
    private text:       string;
    private textStart:  number;
    private textEnd:    number;
    private collapsews: boolean;
    private linews:     boolean;
    private splitws:    boolean;
    private transform:  string;
    private isempty:    boolean;

    constructor(n: Text) {
        super(n);

        this.textNode   = n;
        this.transform  = "none";
        this.setWhiteSpace("normal");
        this.collapsews = true;
    }

    getText(): string {
        return this.text != null ? this.text.substring(this.textStart, this.textEnd) : "";
    }

    public setWhiteSpace(value: string): void {
        this.splitws    = value === "normal"    || value === "pre-wrap"    || value === "pre-line";
        this.collapsews = value === "normal"    || value === "nowrap"      || value === "pre-line";
        this.linews     = value === "normal"    || value === "nowrap";

        if (!this.splitted) {
            this.applyWhiteSpace();
        }

        // TODO: implement computeLineLengths() and computeMinimalWidth() as well as computeMaximalWidth()
    }

    private applyWhiteSpace(): void {
        this.text       = this.applyTransformations(this.collapseWhitespaces(this.node.nodeValue));
        this.textStart  = 0;
        this.textEnd    = this.text.length;
        this.isempty    = this.textEnd === 0;
    }

    private collapseWhitespaces(src: string) {
        let ret:    string  = "";
        let inws:   boolean = false;

        for (let i: number = 0; i < src.length; ++i) {
            let ch: string = src.charAt(i);

            if (this.collapsews && /\s/.test(ch)) {
                if (!inws) {
                    ret = ret.concat(' ');
                    inws = true;
                }
            } else if (this.isLineBreak(ch)) {
                ret = ret.concat('\r');
                if (ch === '\r' && i + 1 < src.length && src.charAt(i + 1) === '\n') {
                    ++i;
                }
            } else {
                inws = false;
                ret = ret.concat(ch);
            }
        }

        return ret;
    }

    private applyTransformations(src: string): string {
        switch (this.transform) {
            case "lowercase":
                return src.toLowerCase();
            case "uppercase":
                return src.toUpperCase();
            case "capitalize":
                let ret:    string  = "";
                let ws:     boolean = true;

                for (let i: number = 0; i < src.length; ++i) {
                    let ch: string = src.charAt(i);
                    if (/\s/.test(ch)) {
                        ws = true;
                    } else {
                        if (ws) {
                            ch = ch.toUpperCase();
                        }

                        ws = false;
                    }

                    ret.concat(ch);
                }

                return ret;
            default:
                return src;
        }
    }

    private isWhitespace(ch: string): boolean {
        if (this.linews) {
            return /\s/.test(ch) && (!(ch === '\r' || ch === '\n'));
        } else {
            return /\s/.test(ch);
        }
    }

    private isLineBreak(ch: string): boolean {
        if (this.linews) {
            return false;
        } else {
            return ch === '\r' || ch === '\n'
        }
    }
}