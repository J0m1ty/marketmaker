import { Container, Graphics } from 'pixi.js';

interface BorderMaskParams {
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    canvasWidth: number;
    canvasHeight: number;
    theme: 'dark' | 'light';
}

export const createBorderMask = ({
    view: { left, right, top, bottom },
    canvasWidth,
    canvasHeight,
    theme,
}: BorderMaskParams): Container => {
    const borderContainer = new Container();
    const backgroundColor = theme === 'dark' ? 0x0a0a0a : 0xffffff;

    const topBorder = new Graphics();
    topBorder.rect(0, 0, canvasWidth, top).fill({ color: backgroundColor });
    borderContainer.addChild(topBorder);

    const bottomBorder = new Graphics();
    bottomBorder.rect(0, bottom, canvasWidth, canvasHeight - bottom).fill({ color: backgroundColor });
    borderContainer.addChild(bottomBorder);

    const leftBorder = new Graphics();
    leftBorder.rect(0, top, left, bottom - top).fill({ color: backgroundColor });
    borderContainer.addChild(leftBorder);

    const rightBorder = new Graphics();
    rightBorder.rect(right, top, canvasWidth - right, bottom - top).fill({ color: backgroundColor });
    borderContainer.addChild(rightBorder);

    return borderContainer;
};
