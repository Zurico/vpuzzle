#!/usr/bin/env node
// If using nvm: $ sudo /home/pi/.nvm/versions/node/v8.1.2/bin/node bin/dht.js
var sensor = require('node-dht-sensor');
sensor.read(11, 4, function(err, temperature, humidity) {
    if (!err) {
        console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
            'humidity: ' + humidity.toFixed(1) + '%'
        );
    }
});
