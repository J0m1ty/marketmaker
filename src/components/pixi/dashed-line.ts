import { Graphics } from 'pixi.js';

interface DashedLineParams {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    dashLength?: number;
    gapLength?: number;
    color: number;
    width?: number;
    alpha?: number;
}

export const createDashedLine = ({
    startX,
    startY,
    endX,
    endY,
    dashLength = 8,
    gapLength = 4,
    color,
    width = 2,
    alpha = 0.5
}: DashedLineParams): Graphics => {
    const graphics = new Graphics();

    const totalDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const dashCount = Math.floor(totalDistance / (dashLength + gapLength));

    const deltaX = (endX - startX) / totalDistance;
    const deltaY = (endY - startY) / totalDistance;

    for (let i = 0; i < dashCount; i++) {
        const dashStart = i * (dashLength + gapLength);
        const dashEnd = Math.min(dashStart + dashLength, totalDistance);

        const x1 = startX + deltaX * dashStart;
        const y1 = startY + deltaY * dashStart;
        const x2 = startX + deltaX * dashEnd;
        const y2 = startY + deltaY * dashEnd;

        graphics
            .moveTo(x1, y1)
            .lineTo(x2, y2)
            .stroke({ color, width, alpha });
    }

    return graphics;
};