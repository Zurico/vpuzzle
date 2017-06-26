"use strict";
/**
 * Reads config from config files
 *   Initial version reads from JS file.
 *   (Eventually could be moved to a few JSON files).
 *
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */
import WrapError from '../lib/util_js/error';

/**
 * Read config file
 *
 * @returns {Object} - Configuration
 * @throws {ConfigError}
 * @param {String} - Config file path, optional
 */
function readConfig( configFilePath = '../conf/config' ) {
    try {
        console.log(`>>> Reading Config @ file: ${configFilePath}`);
        const config = require(configFilePath).default;
        // For now this is that simple!
        return config;
    } catch(e) {
        throw WrapError(new Error(), {
            type: "ConfigError",
            cause: e
        });
    }
}

export default readConfig;
