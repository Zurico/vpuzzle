"use strict";
/**
 * Binding to Sensor's APIs
 * @license MIT
 * @author Álvaro Santamaría Herrero <asantamaria@itrsgroup.com>
 * @author (Each contributor append a line here)
 */
import WrapError from '../lib/util_js/error';
import rx from 'rx-lite';
import dht from 'node-dht-sensor';

function readDht(type, pin, mode){
  return new Promise((resolve, reject) => {
    dht.read(type || 11, pin, function(error, temperature, humidity) {
      if(error) return reject(error);
      resolve({id: `${mode}-${pin}`, value: mode === 'temperature' ? temperature : humidity, timestamp: Date()});
    });
  });
}

/**
 * Get Sensor stream client
 *
 * @returns {RxObservable}
 * @throws {SensorStreamingError, SensorClientError}
 */
function getClient({readingInterval, dht, light, sound}) {

    try {

        if(dht.enabled){
          const dhtTemperatureObservables = dht.ioPins.map(ioPin => rx.Observable.create( observer => {

              (async function readAtIntervals(){
                try{
                  const sensorData = await readDht(dht.type, ioPin, 'temperature');
                  observer.onNext(sensorData);
                  setTimeout(()=>readAtIntervals(), readingInterval);
                }
                catch(error){
                  observer.onError(error);
                }
              })();
              return function dispose() {
                  // Cleanup, if needed. Called when a subscription (observer) is disposed
                  console.log('disposed');
              }
            })
          );
          const dhtHumidityObservables = dht.ioPins.map(ioPin => rx.Observable.create( observer => {

              (async function readAtIntervals(){
                try{
                  const sensorData = await readDht(dht.type, ioPin, 'humidity');
                  observer.onNext(sensorData);
                  setTimeout(()=>readAtIntervals(), readingInterval);
                }
                catch(error){
                  observer.onError(error);
                }
              })();
              return function dispose() {
                  // Cleanup, if needed. Called when a subscription (observer) is disposed
                  console.log('disposed');
              }
            })
          );
          return rx.Observable.merge(...dhtTemperatureObservables, ...dhtHumidityObservables);
        }

    } catch(e) {
        const error = WrapError(new Error(), {
            type: "SensorStreamingError",
            cause: e,
            msg: "Could not read sensor data"
        });
        throw error;
    }
}

export default {
    getClient
};
