"use strict";
/**
 * Binding to Valo's streams API
 * https://valo.io/docs/api_reference/streams_api.html
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor append a line here)
 */
import http from 'axios';
import {
    buildUri,
    throwValoApiError
} from '../../util';

//
// DEFINITIONS
//
const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 8888;
const DEFAULT_HEADERS = {"Content-Type" : "application/json"};

/**
 * Gets stream in Valo - GET /streams/:tenant/:collection/:name
 * https://valo.io/docs/api_reference/streams_api.html#get-a-stream
 *
 * @async
 * @returns {Object} - Streams's schema
 * @throws {VALO.NoResponseFromValo | VALO.Unauthorized | VALO.NotFound }
 */
export async function getStream(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, collection, name],
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(valoHost, valoPort, "streams", tenant, collection, name);
        console.log("> Getting stream: ", uri);
        const {data: body} = await http.get(uri, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e,
            {
                401 : "Unauthorized",
                404 : "NotFound"
            }
        );
    }
}

/**
 * Creates stream in Valo - PUT /streams/:tenant/:collection/:name
 * https://valo.io/docs/api_reference/streams_api.html#put-a-stream
 *
 * @async
 * @returns {Object} - Streams's schema
 * @throws {VALO.NoResponseFromValo | VALO.Unauthorized | VALO.Forbidden | VALO.Conflict | VALO.BadGateway }
 */
export async function createStream(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, collection, name],
    schema,
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(valoHost, valoPort, "streams", tenant, collection, name);
        console.log("> Creating stream: ", uri);
        const {data: body} = await http.put(uri, schema, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e,
            {
                401 : "Unauthorized",
                403 : "Forbidden",
                409 : "Conflict",
                502 : "BadGateway"
            }
        );
    }
}

/**
 * Sets stream's repository in Valo - PUT /streams/:tenant/:collection/:name/repository
 * https://valo.io/docs/api_reference/streams_api.html#put-the-repository-mapping
 *
 * @async
 * @returns {Object} - Streams's repo config
 * @throws {VALO.NoResponseFromValo | VALO.Unauthorized | VALO.NotFound| VALO.Conflict}
 */
export async function setStreamRepository(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, collection, name],
    data,
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(valoHost, valoPort, "streams", tenant, collection, name, "repository");
        console.log("> Setting repository: ", uri);
        const {data: body} = await http.put(uri, data, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e,
            {
                401 : "Unauthorized",
                404 : "NotFound",
                409 : "Conflict",
            }
        );
    }
}

/**
 * Sets stream's repository in Valo - POST /streams/:tenant/:collection/:name
 * https://valo.io/docs/api_reference/streams_api.html#post-data-to-a-stream
 *
 * @async
 * @returns null
 * @throws {VALO.NoResponseFromVal | VALO.NotFound | VALO.InternalServerError | VALO.BadGateway }
 */
export async function publishEventToStream(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, collection, name],
    evt,
    {headers = DEFAULT_HEADERS} = {}
) {

    try {
        const uri = buildUri(valoHost, valoPort, "streams", tenant, collection, name);
        console.log("> Sending event to: ", uri);
        // TODO: what happens if Valo is not reachable!!! There should be an error!
        await http.post(uri, evt, {headers});
    } catch(e) {
        throwValoApiError(e,
            {
                404 : "NotFound",
                500 : "InternalServerError",
                502 : "BadGateway"
            }
        );
    }
}
