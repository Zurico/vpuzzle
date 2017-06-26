"use strict";
/**
 * Random generation functions
 *
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */

/**
 * Generates uniform random distribution between min and max
 *
 * @returns {x, y}
 * @param Number
 * @param Number
 */
export function uniformGenerator(min, max) {
    return () => {
        return {
            x: Math.random() * (max-min) + min,
            y: Math.random() * (max-min) + min
        };
    };
}

export function constantGenerator(x, y) {
    return () => {
        return {x, y};
    };
}
