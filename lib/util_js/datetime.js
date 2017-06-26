"use strict";
/**
 * Simple error wrapper
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */

/**
 * Converts datetime formatted string.
 * From a Date() parseable format, 
 *   e.g., Twitter's : Sat Apr 29 16:46:17 +0000 2017
 *   to "2017-04-29T16:46:17.000Z" (JSON recommended)
 *
 * @returns {String} - Returns null if invalid input
 * @param {String}
 */
export function datetimeStringToJSON( stringifyiedDatetime ) {

    try {
        if (!stringifyiedDatetime) return null;
        const datetimeObject = new Date(Date.parse(stringifyiedDatetime));
        return datetimeObject.toJSON();
    } catch(e) {
        return null;
    }
}
