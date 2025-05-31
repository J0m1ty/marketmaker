import { type Config } from 'prettier';

const config: Config = {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    quoteProps: 'as-needed',
    jsxSingleQuote: true,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    embeddedLanguageFormatting: 'auto',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    experimentalTernaries: false,
};

export default config;
