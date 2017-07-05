"use strict";

var debug = require('debug')('IrBlaster');
var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-http-irblaster", "http-irblaster", IrBlaster);
}

function IrBlaster(log, config) {
    this.log = log;
    this.name = config.name;
    this.stateful = config.stateful;
    this.url = config.url;

    this._service = new Service.Switch(this.name);
    this._service.getCharacteristic(Characteristic.On)
        .on('set', this._setOn.bind(this));
}

IrBlaster.prototype.getServices = function() {
    return [this._service];
}

IrBlaster.prototype._setOn = function(on, callback) {

    this.log("Setting "+this.name+" to "+on);


        this.httpRequest(this.url, function(error, response, responseBody) {
            if (error) {
                this.log('IR Blast failed: %s', error.message);
                //            callback(error);
            } else {
                debug('IR Blast succeeded!', this.url);
                //            callback();
            }
        }.bind(this));


    if (on && !this.stateful) {
        setTimeout(function() {
            this._service.setCharacteristic(Characteristic.On, 0);
        }.bind(this), 1000);
    }

    callback();
}

IrBlaster.prototype.httpRequest = function(url, callback) {
    request({
            url: url,
            method: "GET",
            timeout: 5000
        },
        function(error, response, body) {
            callback(error, response, body)
        })
}
