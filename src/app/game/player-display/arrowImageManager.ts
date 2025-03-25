import { ArrowDirection } from "src/app/shared/enumeration/arrow-direction.enum";

export enum ArrowColor {
    Orange = 0,
    Blue = 1,
    Yellow = 2,
    Violet = 3
}

export class ArrowImageManager {
    public static readonly ARROW_SIZE = 80 //px
    private static arrowImages: HTMLCanvasElement[][] = [];

    static {
        const baseArrowImage = new Image();
        baseArrowImage.src = "assets/Arrow/Arrow.png";
        baseArrowImage.onload = () => {
            ArrowImageManager.PreloadArrowImages(baseArrowImage);
        };
    }

    public static getArrowImage(color: ArrowColor, direction: ArrowDirection): HTMLCanvasElement {
        return ArrowImageManager.arrowImages[color][direction];
    }

    private static PreloadArrowImages(arrowImage: HTMLImageElement): void {
        // Loop through each color
        const colors = ['#FFA500', '#0000FF', '#FFFF00', '#8A2BE2']; // Orange, Blue, Yellow, Violet
        for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
            const color = colors[colorIndex];
            const arrowImgRow: HTMLCanvasElement[] = []

            // Create the grayscale base arrow for rotations
            const baseUp = ArrowImageManager.CreateColorizedImage(arrowImage, color);

            // Generate rotated images for each direction
            arrowImgRow[ArrowDirection.Left] = this.CreateRotatedImage(baseUp, Math.PI / 4); // Rotate 45° (Left)
            arrowImgRow[ArrowDirection.Down] = this.CreateRotatedImage(baseUp, -Math.PI / 4); // Rotate -45° (Down)
            arrowImgRow[ArrowDirection.Up] = this.CreateRotatedImage(baseUp, (3 * Math.PI) / 4); // Rotate 135° (Up)
            arrowImgRow[ArrowDirection.Right] = this.CreateRotatedImage(baseUp, (-3 * Math.PI) / 4); // Rotate -135° (Right)      

            this.arrowImages.push(arrowImgRow)
        }

    }

    private static CreateColorizedImage(
        baseImage: HTMLImageElement,
        color: string,
        luminanceBoost: number = 3
    ): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        const ctx = canvas.getContext('2d')!;

        // Draw the original grayscale image onto the canvas
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

        // Retrieve image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Extract the target color's RGB components
        const targetRed = parseInt(color.slice(1, 3), 16);
        const targetGreen = parseInt(color.slice(3, 5), 16);
        const targetBlue = parseInt(color.slice(5, 7), 16);

        // Loop through each pixel and apply brightened color tint based on grayscale intensity
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i]; // Grayscale value

            // Boost luminance to brighten the colors
            const adjustedGray = Math.min(255, gray * luminanceBoost);

            // Scale the target color by the boosted grayscale intensity
            data[i] = (adjustedGray / 255) * targetRed; // Red channel
            data[i + 1] = (adjustedGray / 255) * targetGreen; // Green channel
            data[i + 2] = (adjustedGray / 255) * targetBlue; // Blue channel
            // Alpha channel remains unchanged
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    private static CreateRotatedImage(image: HTMLCanvasElement, angle: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        const width = this.ARROW_SIZE;
        const height = this.ARROW_SIZE;
        const diagonal = Math.sqrt(width * width + height * height);
        canvas.width = diagonal;
        canvas.height = diagonal;
        const ctx = canvas.getContext('2d')!;

        // Apply rotation to the image
        ctx.save();
        ctx.translate(diagonal / 2, diagonal / 2);
        ctx.rotate(angle);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();

        return canvas;
    }
}