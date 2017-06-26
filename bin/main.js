"use strict";
/**
 * Sensors data Valo injector
 *
 * DHT11 (Temperatura & Humidity) & LM393 (Photoresistor & Sound)
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author Zuri Pabon <zpabon@itrsgroup.com>
 * @author (Each contributor appends a line here)
 */
import readConfig from '../src/read_config';
import startCollector from '../src/start_collector';

(async function main() {

  console.log(`*******************************************************************************`);
  console.log(`*  Sensors Data Injector starting at ${Date()} ...`);
  console.log(`*  (help) You can pass your file config name as a parameter.`);
  console.log(`*  (help) Otherwise, the default one in conf/config.json will be used`);
  console.log(`*******************************************************************************`);
  console.log();
  ////////////////////////////////////////////////////////////////////////////
  // Context
  ////////////////////////////////////////////////////////////////////////////
  let config;
  ////////////////////////////////////////////////////////////////////////////
  // Read config
  ////////////////////////////////////////////////////////////////////////////
  try {
    // Config File optionally given in 1st command line parameter
    const configFilePath = process.argv[2];
    // Read config
    config = readConfig(configFilePath);
  } catch(e) {
    console.error("Error reading configuration", e);
    throw e;
  }
  ////////////////////////////////////////////////////////////////////////////
  // Start collector
  ////////////////////////////////////////////////////////////////////////////
  try {
    await startCollector(config);
  } catch(e) {
    console.error("Error starting sensor data collector\n", e);
    throw e;
  }
})();
