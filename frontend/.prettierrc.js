module.exports = {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    arrowParens: 'avoid',
    endOfLine: 'lf',
    bracketSpacing: true,
    bracketSameLine: false,
    jsxSingleQuote: true,
    quoteProps: 'as-needed',
    overrides: [
        {
            files: '*.json',
            options: {
                printWidth: 200,
            },
        },
        {
            files: '*.md',
            options: {
                printWidth: 100,
                proseWrap: 'always',
            },
        },
    ],
};