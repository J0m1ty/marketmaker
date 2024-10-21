import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
    initialColorMode: "dark"
};

const theme = extendTheme({
    config,
    fonts: {
        heading: `'Roboto', sans-serif`,
        body: `'Roboto', sans-serif`,
    },
    colors: {
        purple: {
            50: '#f3e5f7',
            100: '#e1c1e9',
            200: '#cc97da',
            300: '#b46bcb',
            400: '#9c27af', 
            500: '#862199',
            600: '#721b83',
            700: '#5e156c',
            800: '#4a1056',
            900: '#370b41',
        },
    },
});

export default theme;