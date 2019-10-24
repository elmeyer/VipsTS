///<reference path="Vips.ts"/>
/**
 * VIPS example application.
 * @author Lars Meyer
 * @author Tomas Popela
 */
class VipsTester {
    public main(filename: string): string {
        try {
            let vips: Vips = new Vips(filename);

            // set permitted degree of coherence
            vips.setPredefinedDoC(8);

            // start segmentation on page
            return vips.performSegmentation();
        } catch (Error) {
            console.error(Error.message);
            console.error(Error.stack);
        }
    }
}