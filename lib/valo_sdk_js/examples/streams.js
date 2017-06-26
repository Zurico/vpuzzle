"use strict";
/**
 * Examples about how Valo streams API is used
 * https://valo.io/docs/api_reference/streams_api.html
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor append a line here)
 */
import * as streams from '../api/streams';
import {
    retryOnConflict
} from '../index';


//
// DEFINITIONS
//
const LOCAL_VALO = {valoHost: "localhost", valoPort: 8888};
const TENANT_1 = "myTenant";
const COLLECTION_1 = "myCollection";
const STREAM_NAME_1 = "myStream";
const SCHEMA_1 = {
    "schema":
    {
        "version": "",
        "config": {},
        "topDef": {
            "type": "record",
            "properties": {
                "value" : {"type": "double"},
                "timestamp" : {"type": "datetime"},
                "origin" : {"type": "string"}
            }
        }
    }
};
const REPO_CONF_TSR = {
    "name"   : "ssr",
    "config" : {
        "defaultStringAnalyzer" : "StandardAnalyzer"
    }
};


//
// Create a stream with promises
//
function createStream_P() {

    return streams.createStream(
        LOCAL_VALO,
        [TENANT_1, COLLECTION_1, STREAM_NAME_1],
        SCHEMA_1
    )
    .then( res => {
        console.log(">>> createStream_P", JSON.stringify(res, null, 4));
    })
    .catch( err => {
        console.error(">>> createStream_P", err);
    });
};


//
// Create a stream with async/await
//
async function createStream_A() {

    try {
        const response = await streams.createStream(
            LOCAL_VALO,
            [TENANT_1, COLLECTION_1, STREAM_NAME_1],
            SCHEMA_1
        );
        console.log(">>> createStream_A ", JSON.stringify(response, null, 4));
        return response;
    } catch (e) {
        console.error(">>> createStream_A ", e);
        throw e;
    }
}

//
// Create or update a stream with async/await
//  The decorator retryOnConflict will make a retry with
//  the correct "Valo-Config-Version" header.
//
async function createOrUpdateStream_A() {

    try {
        const response = await retryOnConflict(streams.createStream)(
            LOCAL_VALO,
            [TENANT_1, COLLECTION_1, STREAM_NAME_1],
            SCHEMA_1
        );
        return response;
    } catch (e) {
        console.error(">>> createOrUpdateStream_A ", e);
        throw e;
    }
}

//
// Set the repository associated to a stream
//
async function setRepo_A() {

    try {
        const response = await retryOnConflict(streams.setStreamRepository)(
            LOCAL_VALO,
            [TENANT_1, COLLECTION_1, STREAM_NAME_1],
            REPO_CONF_TSR
        );
        return response;
    } catch(e) {
        console.error(">>> setRepo_A ", e);
        throw e;
    }
}

//
// Set the repository associated to a stream
//
async function publishEvent_A() {

    try {
        const response = await streams.publishEventToStream(
            LOCAL_VALO,
            [TENANT_1, COLLECTION_1, STREAM_NAME_1],
            {
                value : 28.2,
                timestamp: new Date(),
                origin: "String examples"
            }
        );
        return response;
    } catch(e) {
        console.error(">>> publishEvent_A ", e);
        throw e;
    }
}

//
// Get stream
//
async function getStream() {

    try {
        const response = await streams.getStream(
            LOCAL_VALO,
            [TENANT_1, COLLECTION_1, STREAM_NAME_1]
        );
        return response;
    } catch(e) {
        if (e.type === "VALO.NotFound") {
            console.log(">>> STREAM DOES NOT EXIST!!!");            
        } else {
            console.error(">>> getStream ", e);
            throw e;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Main
///////////////////////////////////////////////////////////////////////////////

//
// These will run in parallel!!! To force them into a sequential
//      execution, chain the promises the functions return;

createStream_P();
createStream_A();
/*
*/

//
// These will be run sequentially
//
/*
createStream_P()
.then(createStream_A)
.catch( err => {
    console.log("*** Here be errors ***");
})
*/

/*
createOrUpdateStream_A()
.then(setRepo_A)
.then(publishEvent_A)
.catch(e => {
    console.error("*** Here be errors ***");
});
*/

getStream()
.then( res => {
    console.log(JSON.stringify(res, null, 4));
})
.catch(e => {
    console.error("*** Here be errors ***");
});
