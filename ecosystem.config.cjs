module.exports = {
    apps: [
        {
            name: 'market-maker',
            script: 'npm',
            args: 'start',
            watch: false,
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
