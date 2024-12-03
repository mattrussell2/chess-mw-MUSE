/** @param {import("webpack").Configuration} config */
import wpack from "webpack"

export function webpack(config) {
    
    config.target = 'web';
    config.externals = [];
    config.resolve.extensions.push('.mjs');
    config.resolve.fallback = {
        'os':false, 
        "zlib": false,
        "crypto": false,
        "http": false,
        "https": false,
        'fs': false, 
        'vm': false,
    };

    config.plugins.push(new wpack.ProvidePlugin({
            process: 'process/browser',
        })
    );
    
    return config;
};