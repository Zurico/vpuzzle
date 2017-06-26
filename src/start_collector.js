"use strict";
/**
 * Start the configured mappings ( Twitter stream <--> Valo streams )
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author Zuri Pabon <zpabon@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */
import WrapError from '../lib/util_js/error';
import {
    retryOnConflict,
    createStream,
    setStreamRepository,
    publishEventToStream
} from '../lib/valo_sdk_js';
import {
    datetimeStringToJSON
} from '../lib/util_js/datetime';
import sensors from './sensors';

////////////////////////////////////////////////////////////////////////////////
// DEFINITIONS
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Validate mappings
 *
 * @returns {Boolean}
 * @param {Mappings}
 */
function validateMappings(mappings) {

    const res = mappings.constructor === Array
    // TODO: extend this validation
    return res;
}

/**
 * Start a single mapping
 *
 * @returns null
 * @param {Mapping} (Assume a validated mapping, so it won't cause errors)
 * @throws { ErrorCreatingStream |
             ErrorSettingStreamRepository |
             NonSupportedDestinationType
            }
 */
async function startMapping(config) {

    ////////////////////////////////////////////////////////////////////////////
    // Get config data
    ////////////////////////////////////////////////////////////////////////////
    const {
        valoClient : {host: valoHost, port: valoPort},
        valoTenant,
        valoCollection,
        valoStream,
        valoSchema,
        valoRepo,
        valoContributorId,
        sensorClient
    } = config;

    ////////////////////////////////////////////////////////////////////////////
    // Create valo stream if needed
    ////////////////////////////////////////////////////////////////////////////
    try {
        const res = await (retryOnConflict(createStream))(
            {valoHost, valoPort},
            [valoTenant, valoCollection, valoStream], {schema: valoSchema}
        );
    } catch(e) {
        //console.log(e);
        if (e.type === "VALO.Conflict") {
            console.log("> Stream already exists. Skipping stream creation... ");
        } else {
            throw WrapError(new Error(), {
                type: "ErrorCreatingStream",
                cause: e
            });
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Persist stream in repository
    ////////////////////////////////////////////////////////////////////////////
    try {
        const res = await (retryOnConflict(setStreamRepository))(
            {valoHost, valoPort},
            [valoTenant, valoCollection, valoStream],
            {
                "name" : valoRepo,
                "config" : {
                    "defaultStringAnalyzer" : "StandardAnalyzer"
                }
            }
        );
    } catch(e) {
        //console.log(e);
        if (e.type === "VALO.Conflict") {
            console.log("> Stream already exists. Skipping stream creation... ");
        } else {
            throw WrapError(new Error(), {
                type: "ErrorSettingStreamRepository",
                cause: e
            });
        }
    }

    // TODO: here should be some dispatching to transports in the future

    try {
        //
        // Get Sensor Client
        //
        const sensorsClient = sensors.getClient(sensorClient);

        //
        // Subscribe to Twitter Streaming API - Returned as RX observable
        //
        sensorsClient.subscribe(
            async sensorData => {
                try {
                    // Update (mutate) created_at fields in tweet
                    if (sensorData.timestamp)
                        sensorData.timestamp = datetimeStringToJSON(sensorData.timestamp);
                    //
                    // Process and relay tweet to destination
                    //
                    const processedEvent = {
                        contributor: valoContributorId,
                        sensor: sensorData
                    };

                    await publishEventToStream(
                        {valoHost, valoPort},
                        [valoTenant, valoCollection, valoStream],
                        processedEvent
                    );
                } catch(e) {
                    console.error("> ERROR processing sensor Data", e);
                }
            },
            err => {
                console.error(">>>> Sensor Streaming Error", err);
            },
            () => {
                console.log(">>>> Sensor Stream Closed");
            }
        );

    } catch (e) {
        throw e;
    }
}


/**
 * Start mappings ( Transport origins <--> Valo streams )
 *
 * @throws {InvalidMappings|}
 * @param {Mappings}
 *
 */
export default async function startCollector(config) {

    console.log("> Validating mappings...");
    if ( ! validateMappings(config) ) throw WrapError(new Error(), {
        type : "InvalidMappings"
    });

    console.log("> Starting mappings...");
    // Start each single mapping
    return await Promise.all(config.map(startMapping));
}
