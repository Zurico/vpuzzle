"use strict";
/**
 * Config file (temporary)
 *
 * Config should be better written (really?) in JSON files, which are parsed and joined.
 *   While we are experimenting, we will use this JS config file which is easier
 *   to load and modify.
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */

///////////////////////////////////////////////////////////////////////////////
// Clients' config
///////////////////////////////////////////////////////////////////////////////
const valoClientConfigs = {
    valo1 : {
        host : 'localhost',
        port : 8888
    }
};

const sensorsClientConfigs = {
  readingInterval: 1000, // in miliseconds
  ioPinsMode: 'BOARD', // BOARD OR BMC
  dht: {
    enabled: true,
    type: 11,
    ioPins: [4]
  },
  light: {
    enabled: false,
    ioPins: []
  },
  sound: {
    enabled: false,
    ioPins: []
  }
};

///////////////////////////////////////////////////////////////////////////////
// VALO schemas
// (We write the schemas as in JSON for convenience
///////////////////////////////////////////////////////////////////////////////
const valoSchemas = {
  sensors :
  {
    "version":"1.0",
    "topDef": {
      "type": "record",
      "properties": {
        //"contributor" : {
          //"type" : "contributor",
          //"definition" : "sensor_app"
        //},
        "sensor" :{
          "type":"record",
          "properties":{
            "id":{
              "type":"string"
            },
            "value":{
              "type":"boolean"
            },
            "timestamp":{
              "type":"datetime",
              "annotations":["urn:itrs:default-timestamp"]
            }
          }
        }
      }
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
// Map sources to valo streams
///////////////////////////////////////////////////////////////////////////////
const config = [
  {
    "valoClient"          : valoClientConfigs.valo1,
    "valoTenant"          : "demo",
    "valoCollection"      : "smart_city",
    "valoStream"          : "sensors",
    "valoSchema"          : valoSchemas.sensors,
    "valoRepo"            : "ssr", // "tsr"|"ssr"|null
    "valoContributorId"   : "raspberry-pi-001",
    "sensorClient"        : sensorsClientConfigs
  }
];

export default config;
