///<reference path="Point.ts"/>
/**
 * Class that represents visual separator.
 *
 * @author Tomas Popela
 * @author Lars Meyer
 */
class Separator {
    public startPoint:          number = 0;
    public endPoint:            number = 0;
    public weight:              number = 3;
    public normalizedWeight:    number = 0;

    // names apply to horizontal separators
    public leftUp:      Point;
    public rightDown:   Point;

    constructor(start: number, end: number);

    constructor(start: number, end: number, weight: number);

    constructor(leftUpX: number, leftUpY: number, rightDownX: number, rightDownY: number);

    constructor(start?: number, end?: number, weight?: number, leftUpX?: number, leftUpY?: number, rightDownX?: number, rightDownY?: number) {
        if (typeof start === 'undefined' || typeof end === 'undefined') {
            if (!(typeof leftUpX === 'undefined' || typeof leftUpY === 'undefined' || typeof rightDownX === 'undefined' || typeof rightDownY === 'undefined')) {
                this.leftUp     = new Point(leftUpX, leftUpY);
                this.rightDown  = new Point(rightDownX, rightDownY);
                this.startPoint = leftUpX;
                this.endPoint   = rightDownY;
            }
        } else {
            this.startPoint = start;
            this.endPoint   = end;
        }

        if (!(typeof weight === 'undefined')) {
            this.weight = weight;
        }
    }

    public setLeftUp(leftUpX: number, leftUpY: number): void {
        this.leftUp     = new Point(leftUpX, leftUpY);
    }

    public setRightDown(rightDownX: number, rightDownY: number): void {
        this.rightDown  = new Point(rightDownX, rightDownY);
    }

    compareTo(otherSeparator: Separator): number {
        return this.weight - otherSeparator.weight;
    }
}