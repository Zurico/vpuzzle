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
const TENANT_1 = "myTenant";
const COLLECTION_1 = "myCollection";
const STREAM_NAME_1 = "myStream";

//
// Run a single query, Async/Await style
//
async function runQuery_A() {

    try {
        const response = await runSingleQuery(
            LOCAL_VALO,
            TENANT_1,
            `from /streams/${TENANT_1}/${COLLECTION_1}/${STREAM_NAME_1}`
        );

        const observable = response.observable;
        observable.subscribe(
            event => {
                console.log(JSON.stringify(event, null, 4));
                // HERE we write the main event processing code,
                //  including the call to a visualization draw()
                //  method.
            },
            error => {
                console.error("ERROR: ", error);
            },
            () => {
                console.log("Observable closed.");
            }
        );
        return response;
    } catch(e) {
        console.error(">>> runQuery_A ", e);
        throw e;
    }
}
//
// Run a single query, Async/Await style
//  and get query's metadata (needed for visualization)
//
async function runQueryAndGetInfo_A() {

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
            TENANT_1,
            `from /streams/${TENANT_1}/${COLLECTION_1}/${STREAM_NAME_1}`
            /*
            {
                //"id": MY_QUERY_ID,
                "body": "from /streams/demo/infrastructure/cpu",
                //"query_type": "valo-query-lang",
                //"variables": []
            }
            */
        );

        console.log("Listening to output channel: ", output);
        console.log(`Query is ${isHistorical?"HISTORICAL":"REAL-TIME"} and ${outputType}`);

        observable.subscribe(
            evt => {
                console.log("Valo event: ", JSON.stringify(evt, null, 4));
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
//runQuery_A();
runQueryAndGetInfo_A();
