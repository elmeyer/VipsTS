/**
 * Common interface for separators detectors.
 * @author Tomas Popela
 * @author Lars Meyer
 */
interface VipsSeparatorDetector {
    fillPool():                                             void;
    setVipsBlock(vipsBlock: VipsBlock):                     void;
    getVipsBlock():                                         VipsBlock;
    setVisualBlocks(visualBlocks: Array<VipsBlock>):        void;
    getVisualBlocks():                                      Array<VipsBlock>;
    detectHorizontalSeparators():                           void;
    detectVerticalSeparators():                             void;
    getHorizontalSeparators():                              Array<Separator>;
    setHorizontalSeparators(separators: Array<Separator>):  void;
    setVerticalSeparators(separators: Array<Separator>):    void;
    getVerticalSeparators():                                Array<Separator>;
    setCleanUpSeparators(threshold: Number):                void;
}