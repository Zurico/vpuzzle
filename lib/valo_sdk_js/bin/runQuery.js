"use strict";
/**
 * Examples about how Valo query (execution) API is used
 * https://valo.io/docs/api_reference/execution_api.html
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor append a line here)
 */
import {
    runSingleQuery
} from '../index';

//
// DEFINITIONS
//
const LOCAL_VALO = {valoHost: "localhost", valoPort: 8888};
const TENANT = "demo";

const QUERY = `
from /streams/demo/mobile/happiness
`

//
// Run a single query, Async/Await style
//  and get query's metadata (needed for visualization)
//
async function runQuery() {

    try {
        const {
            observable,
            output,
            outputUri,
            schema,
            outputType,
            isHistorical
        } = await runSingleQuery(
            LOCAL_VALO,
            TENANT,
            QUERY
        );

        console.log("Listening to output channel: ", output);
        console.log(`Query is ${isHistorical?"HISTORICAL":"REAL-TIME"} and ${outputType}`);

        observable.subscribe(
            evt => {
                console.log(JSON.stringify(evt, null, 4));
            },
            err => {
                console.error("ERROR in ouput channel's SSE stream", err);
            },
            () => {
                console.log("Valo output channel closed");
            }
        );

    } catch(e) {
        console.log("Error: ", e);
    }

}

///////////////////////////////////////////////////////////////////////////////
// Main
///////////////////////////////////////////////////////////////////////////////
runQuery();
