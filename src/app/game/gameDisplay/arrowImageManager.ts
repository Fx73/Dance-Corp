import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum";
import { CONFIG } from "../constants/game-config";

export enum ArrowColor {
    Orange = 0,
    Blue = 1,
    Yellow = 2,
    Violet = 3
}

export class ArrowImageManager {
    private static _ARROW_SIZE = 80 //px
    public static get ARROW_SIZE(): number {
        return this._ARROW_SIZE;
    }
    private static _HOLD_PRELOAD_PRECISION = 4 // part of beat


    private static arrowImages: HTMLCanvasElement[][] = [];
    private static holdImages: HTMLCanvasElement[] = [];

    public static getArrowImage(color: ArrowColor, direction: ArrowDirection): HTMLCanvasElement {
        return ArrowImageManager.arrowImages[color][direction];
    }
    public static getHoldForDistance(distance: number): HTMLCanvasElement {
        const interval = CONFIG.DISPLAY.BEAT_INTERVAL / this._HOLD_PRELOAD_PRECISION;
        const closestIndex = Math.min(Math.round(distance / interval), ArrowImageManager.holdImages.length);
        return ArrowImageManager.holdImages[closestIndex]
    }


    public static Set_ARROW_SIZE(size: number) {
        this._ARROW_SIZE = size;
        CONFIG.DISPLAY.BEAT_INTERVAL = size * 1.2
        this.LoadImages()
    }
    static { }
    public static LoadImages() {
        const baseArrowImage = new Image();
        baseArrowImage.src = "assets/Arrow/Arrow.png";
        baseArrowImage.onload = () => {
            ArrowImageManager.PreloadArrowImages(baseArrowImage);
        };

        const holdCenterImage = new Image();
        holdCenterImage.src = "assets/Arrow/HoldCenter.png";

        const holdCapImage = new Image();
        holdCapImage.src = "assets/Arrow/HoldBottomCap.png";

        Promise.all([
            new Promise<void>((resolve) => { holdCenterImage.onload = () => resolve(); }),
            new Promise<void>((resolve) => { holdCapImage.onload = () => resolve(); })
        ]).then(() => {
            this.PreloadHoldImages(holdCenterImage, holdCapImage);
        });

    }

    public static PreloadHoldImages(centerImage: HTMLImageElement, capImage: HTMLImageElement) {
        const interval = CONFIG.DISPLAY.BEAT_INTERVAL / ArrowImageManager._HOLD_PRELOAD_PRECISION;
        const maxMultiplier = ArrowImageManager._HOLD_PRELOAD_PRECISION * 10;
        for (let multiplier = 0; multiplier <= maxMultiplier; multiplier++) {
            const img = ArrowImageManager.PreloadHoldImage(centerImage, capImage, multiplier * interval)
            this.holdImages.push(img)
        }
    }



    private static PreloadHoldImage(centerImage: HTMLImageElement, capImage: HTMLImageElement, height: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = this.ARROW_SIZE;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        let y = 0;

        // Draw the center images
        while (y + centerImage.height <= height - capImage.height) {
            ctx.drawImage(centerImage, 0, y, canvas.width, centerImage.height);
            y += centerImage.height;
        }

        // Adjust last center image to fit the remaining space
        const remainingHeight = height - capImage.height - y;
        if (remainingHeight > 0) {
            ctx.drawImage(centerImage, 0, y, canvas.width, remainingHeight);
            y += remainingHeight;
        }
        // Draw the bottom cap image
        ctx.drawImage(capImage, 0, y, canvas.width, capImage.height);
        return canvas
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
        canvas.width = this.ARROW_SIZE;
        canvas.height = this.ARROW_SIZE;

        const diagonal = Math.sqrt(this.ARROW_SIZE * this.ARROW_SIZE * 2);
        const scaleFactor = this.ARROW_SIZE / Math.sqrt(2);

        const ctx = canvas.getContext('2d')!;

        // Apply rotation to the image
        ctx.save();
        ctx.translate(this.ARROW_SIZE / 2, this.ARROW_SIZE / 2);
        ctx.rotate(angle);
        ctx.drawImage(image, -scaleFactor / 2, -scaleFactor / 2, scaleFactor, scaleFactor);
        ctx.restore();

        return canvas;
    }
}