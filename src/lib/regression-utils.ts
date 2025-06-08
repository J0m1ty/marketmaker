import type { Result } from 'regression';
import type { CurveFitType } from './types';

export const createEquationFunction = (regressionResult: Result, fitType: CurveFitType) => {
    const coefficients = regressionResult.equation;

    switch (fitType) {
        case 'linear':
            // y = ax + b -> coefficients = [a, b]
            return (x: number) => coefficients[0] * x + coefficients[1];

        case 'exponential':
            // y = ae^(bx) -> coefficients = [a, b]
            return (x: number) => coefficients[0] * Math.exp(coefficients[1] * x);

        case 'logarithmic':
            // y = a + b*ln(x) -> coefficients = [a, b]
            return (x: number) => coefficients[0] + coefficients[1] * Math.log(x);

        case 'power':
            // y = ax^b -> coefficients = [a, b]
            return (x: number) => coefficients[0] * Math.pow(x, coefficients[1]);

        case 'polynomial':
            // y = a0*x^N + a1*x^(N-1) + ... + aN -> coefficients = [a0, a1, ..., aN]
            return (x: number) => {
                let result = 0;
                for (let i = 0; i < coefficients.length; i++) {
                    const power = coefficients.length - 1 - i;
                    result += coefficients[i] * Math.pow(x, power);
                }
                return result;
            };

        default:
            return () => 0;
    }
};

export const createDerivativeFunction = (regressionResult: Result, fitType: CurveFitType) => {
    const coefficients = regressionResult.equation;

    switch (fitType) {
        case 'linear':
            // dy/dx = a
            return () => coefficients[0];

        case 'exponential':
            // dy/dx = a*b*e^(bx)
            return (x: number) => coefficients[0] * coefficients[1] * Math.exp(coefficients[1] * x);

        case 'logarithmic':
            // dy/dx = b/x
            return (x: number) => coefficients[1] / x;

        case 'power':
            // dy/dx = a*b*x^(b-1)
            return (x: number) => coefficients[0] * coefficients[1] * Math.pow(x, coefficients[1] - 1);

        case 'polynomial':
            // dy/dx = N*a0*x^(N-1) + (N-1)*a1*x^(N-2) + ... + a(N-1)
            return (x: number) => {
                let result = 0;
                for (let i = 0; i < coefficients.length - 1; i++) {
                    const power = coefficients.length - 1 - i;
                    result += coefficients[i] * power * Math.pow(x, power - 1);
                }
                return result;
            };

        default:
            return () => 0;
    }
};

export const createIntegrationFunction = (regressionResult: Result, fitType: CurveFitType) => {
    const coefficients = regressionResult.equation;

    switch (fitType) {
        case 'linear':
            // ∫(ax + b)dx = (a/2)x² + bx + C
            return (x1: number, x2: number) => {
                const antiderivative = (x: number) => (coefficients[0] / 2) * x * x + coefficients[1] * x;
                return antiderivative(x2) - antiderivative(x1);
            };

        case 'exponential':
            // ∫ae^(bx)dx = (a/b)e^(bx) + C
            return (x1: number, x2: number) => {
                if (coefficients[1] === 0) return 0; // Handle b = 0 case
                const antiderivative = (x: number) =>
                    (coefficients[0] / coefficients[1]) * Math.exp(coefficients[1] * x);
                return antiderivative(x2) - antiderivative(x1);
            };

        case 'logarithmic':
            // ∫(a + b*ln(x))dx = ax + b(x*ln(x) - x) + C
            return (x1: number, x2: number) => {
                const antiderivative = (x: number) => coefficients[0] * x + coefficients[1] * (x * Math.log(x) - x);
                return antiderivative(x2) - antiderivative(x1);
            };

        case 'power':
            // ∫ax^b dx = a * x^(b+1) / (b+1) + C (for b ≠ -1)
            return (x1: number, x2: number) => {
                if (coefficients[1] === -1) {
                    // Special case: ∫a/x dx = a*ln(x) + C
                    const antiderivative = (x: number) => coefficients[0] * Math.log(Math.abs(x));
                    return antiderivative(x2) - antiderivative(x1);
                } else {
                    const antiderivative = (x: number) =>
                        (coefficients[0] * Math.pow(x, coefficients[1] + 1)) / (coefficients[1] + 1);
                    return antiderivative(x2) - antiderivative(x1);
                }
            };

        case 'polynomial':
            // ∫(a0*x^N + a1*x^(N-1) + ... + aN)dx = a0*x^(N+1)/(N+1) + a1*x^N/N + ... + aN*x + C
            return (x1: number, x2: number) => {
                const antiderivative = (x: number) => {
                    let result = 0;
                    for (let i = 0; i < coefficients.length; i++) {
                        const power = coefficients.length - 1 - i;
                        if (power === 0) {
                            result += coefficients[i] * x;
                        } else {
                            result += (coefficients[i] * Math.pow(x, power + 1)) / (power + 1);
                        }
                    }
                    return result;
                };
                return antiderivative(x2) - antiderivative(x1);
            };

        default:
            return () => 0;
    }
};
