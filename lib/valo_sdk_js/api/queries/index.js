"use strict";
/**
 * Binding to Valo's execution API
 * https://valo.io/docs/api_reference/execution_api.html
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author Zuri Pabón <zpabon@itrsgroup.com>
 * @author (Each contributor append a line here)
 */

/* External dependencies */
import http from 'axios';
import rx from 'rx-lite';
import NodeEventSource from 'eventsource';

// TODO: this is a workaround to make EventSource work both in browser and in node
let MyEventSource;
try {
    // If in browser, EventSource should exist, so this would work
    MyEventSource = EventSource
} catch(e) {
    // If not in browser, EventSource ref does not exist
    MyEventSource = NodeEventSource
}

/* Internal services dependencies*/
import {
    buildUri,
    throwValoApiError,
    processValoSseObservable
} from '../../util';
import WrapError from '../../../util_js/error';

//
// DEFINITIONS
//
const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 8888;
const DEFAULT_HEADERS = {"Content-Type" : "application/json"};
const EOS_MSG = 'eos';
const SOS_MSG = 'sos';

/**
 * Create session - POST /execution/:tenant/sessions
 * https://valo.io/docs/api_reference/execution_api.html#create-a-new-session
 *
 * @async
 * @returns {"session": "/execution/demo/sessions/4dc03528-59c8-4cb4-8618-71c26681484e"}
 * @throws {VALO.NoResponseFromValo | VALO.NotFound}
 */
export async function createSession(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    tenant
) {
    // Check if 2nd param is delivered as an array with 1 item [tenant] and unwrap it
    tenant = tenant.constructor === Array ? tenant[0] : tenant;
    try {
        const uri = buildUri(valoHost, valoPort, "execution", tenant, "sessions");
        console.log("> Creating session: ", uri);
        const {data: body} = await http.post(uri);
        return body;
    } catch(e) {
        throwValoApiError(e,
            {
                404 : "NotFound"
            }
        );
    }
}

/**
 * Create (or update) execution context - PUT /execution/:tenant/sessions/:id
 * https://valo.io/docs/api_reference/execution_api.html#put-an-execution-environment
 *
 * @async
 * @returns
 * @throws {VALO.NoResponseFromValo}
 */
export async function startExecutionContext(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, id],
    data,
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(valoHost, valoPort, "execution", tenant, "sessions", id);
        console.log("> Starting execution context: ", uri);
        const {data: body} = await http.put(uri, data, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e, {});
    }
}

/**
 * Make query - PUT /execution/:tenant/sessions/:id/queries
 * https://valo.io/docs/api_reference/execution_api.html#put-a-query
 *
 * @async
 * @returns
 * @throws {VALO.NoResponseFromValo}
 */
export async function setQuery(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, id],
    data,
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(valoHost, valoPort, "execution", tenant, "sessions", id, "queries");
        console.log("> Sending query: ", uri);
        const {data: body} = await http.put(uri, data, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e, {});
    }
}

/**
 * Start query - PUT /execution/:tenant/sessions/:id/queries/:queryId/_start
 * https://valo.io/docs/api_reference/execution_api.html#start-a-query
 *
 * @async
 * @returns
 * @throws {VALO.NoResponseFromValo}
 */
export async function startQuery(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    [tenant, sessionId, queryId],
    {headers = DEFAULT_HEADERS} = {}
) {
    try {
        const uri = buildUri(
            valoHost, valoPort,"execution", tenant,
            "sessions", sessionId, "queries", queryId, "_start"
        );
        console.log("> Starting query: ", uri);
        const {data: body} = await http.put(uri, {headers});
        return body;
    } catch(e) {
        throwValoApiError(e, {});
    }
}



////////////////////////////////////////////////////////////////////////////////
// QUERY WRAPPERS - on-top layer
////////////////////////////////////////////////////////////////////////////////
/**
 * Make a query
 * Automatically creates a session, execution context, executes and starts a query
 *  on the main thread. (For a webworker implementation this is not useful).
 *
 * @async
 * @returns {
 *              observable: Rx.Observable,
 *              output: String,
 *              outputUri: String,
 *              schema: {},
 *              outputType: String("BOUNDED"|"UNBOUNDED"),
 *              isHistorical: Boolean
 *          }
 * @throws {CouldNotGetQueryObservable}
 * @param {valoHost:String, valoPort:Integer}
 * @param tenant:String
 * @param query: {
 *                  id: String,
 *                  body: String,
 *                  query_type: String,
 *                  variables: [
 *                      {
 *                          id: String,
 *                          value: String,
 *                          type: String
 *                      }
 *                   ]
 *              }
 */
export async function runSingleQuery(
    {valoHost = DEFAULT_HOST, valoPort = DEFAULT_PORT},
    tenant,
    query
) {
    const DEFAULT_QUERY_ID = "unnamed query";
    const DEFAULT_QUERY_LANG = "valo-query-lang";
    try {
        // Allow query be a plain string or a complete query spec as in
        //  https://valo.io/docs/api_reference/execution_api.html#put-a-query
        const query_ = query.constructor === String ?
            {
                id : DEFAULT_QUERY_ID,
                body : query,
                query_type : DEFAULT_QUERY_LANG,
                variables : []
            }
            :
            query
        ;
        // We allow the query spec to have undefined fields, exept for body
        //  and normalize the identifiers.
        const {
            id: queryId = DEFAULT_QUERY_ID,
            body: queryBody,
            query_type: queryType = DEFAULT_QUERY_LANG,
            variables: queryVariables = []
        } = query_;

        console.log(">>> Running single query:" , JSON.stringify(query_));
        ////////////////////////////////////////////////////////////////////////
        // Create session
        ////////////////////////////////////////////////////////////////////////
        const {session} = await createSession(
            {valoHost, valoPort},
            tenant
        );
        // TODO: write utitily function to convert from sessionUri to sessionId
        const sessionId = session.replace(/.*\//, "");
        console.log("> Session created: ", sessionId);

        ////////////////////////////////////////////////////////////////////////
        // Create/reset execution context
        ////////////////////////////////////////////////////////////////////////
        const executionContextInfo = await startExecutionContext(
            {valoHost, valoPort},
            [tenant, sessionId]
        );

        ////////////////////////////////////////////////////////////////////////
        // Set query
        ////////////////////////////////////////////////////////////////////////
        const queryState1 = await setQuery(
            {valoHost, valoPort},
            [tenant, sessionId],
            {
                id: queryId,
                body: queryBody,
                query_type: queryType,
                variables: queryVariables
            }
        );
        console.log("> Query state: ", JSON.stringify(queryState1, null, 4));

        ////////////////////////////////////////////////////////////////////////
        // Get SSE output channel info
        ////////////////////////////////////////////////////////////////////////
        let output,
            outputUri,
            schema,
            outputType,
            isHistorical
        ;
        try {
            output = queryState1[0].query.outputs[0].output;
            if (!output) throw WrapError(new Error(), {
                msg: "Emtpy output field"
            });
            outputUri = queryState1[0].query.outputs[0].outputUri;
            if (!outputUri) throw WrapError(new Error(), {
                msg: "Emtpy outputUri field"
            });
            schema = queryState1[0].query.outputs[0].schema;
            if (!schema) throw WrapError(new Error(), {
                msg: "Emtpy schema field"
            });
            outputType = queryState1[0].query.outputs[0].outputType;
            if (!outputType) throw WrapError(new Error(), {
                msg: "Emtpy outputType field"
            });
            isHistorical = queryState1[0].query.outputs[0].isHistorical;
            if (isHistorical !== false &&
                 isHistorical !== true) throw WrapError(new Error(), {
                msg: "Wrong isHistorical field"
            });
        } catch(e) {
            const err = WrapError(new Error(), {
                type: "OutputChannelError",
                cause: e,
                msg: "Failed to get output channel info"
            })
            throw err;
        }
        console.log("> Output channel: ", output);

        ////////////////////////////////////////////////////////////////////////
        // Create observable
        // TODO: WAIT for observable to OPEN!!!
        ////////////////////////////////////////////////////////////////////////
        const rawObservable = rx.Observable.create( observer => {

            const sseSource = new MyEventSource(`http://${output}`);

            sseSource.onopen = () => {
                console.log("> SSE opened");
                // TODO: WAIT for observable to OPEN!!!
            };

            sseSource.onmessage = msg => {
              try {
                const data = JSON.parse(msg.data);
                switch(data.type){
                  case SOS_MSG:
                    return;
                  case EOS_MSG:
                    return observer.onCompleted();
                  default:
                    return observer.onNext(msg);
                }
              } catch (err) {
                observer.onError(err);
              }
            };

            sseSource.onerror = err => {
                console.error("> SSE ERROR: ", err);
            };

            return function dispose() {
                // Cleanup, if needed. Called when a subscription (observer) is disposed
                console.log('disposed');
            }
        });

        const processedObservable = processValoSseObservable(rawObservable);

        ////////////////////////////////////////////////////////////////////////
        // Start query
        ////////////////////////////////////////////////////////////////////////
        const queryState2 = await startQuery(
            {valoHost, valoPort},
            [tenant, sessionId, queryId]
        );
        console.log("> Query state: ", JSON.stringify(queryState2, null, 4));

        ////////////////////////////////////////////////////////////////////////
        // Return the observable and all the associated query info
        ////////////////////////////////////////////////////////////////////////
        return {
            observable: processedObservable,
            output,
            outputUri,
            schema,
            outputType,
            isHistorical
        };

    } catch(e) {
        throw WrapError(new Error(), {
            type: "CouldNotGetQueryObservable",
            cause: e
        })
    }
}
