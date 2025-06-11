import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function map(value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
    return outputMin + ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin);
}

export function constrain(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}
