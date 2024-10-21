import { defineConfig } from '@farmfe/core';
import electron from '@farmfe/js-plugin-electron';

export default defineConfig({
    compilation: {
        input: {
            index: './src/index.html',
        },
        output: {
            path: './dist'
        }
    },
    plugins: [
        electron({
            main: {
                input: './electron/main.ts'
            },
            preload: {
                input: './electron/preload.ts'
            }
        }),
        '@farmfe/plugin-react'
    ]
});