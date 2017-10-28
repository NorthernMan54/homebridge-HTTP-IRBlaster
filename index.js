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
  this.data = config.data;
  this.busy = config.busy || 1;
  this.on_data = config.on_data;
  this.off_data = config.off_data;

  if (this.on_data) {

    // Statefull on/off
    debug("Adding Stateful switch", this.name);
    this._service = new Service.Switch(this.name);
    this._service.getCharacteristic(Characteristic.On)
      .on('set', this._setState.bind(this));

  } else {
    // Toggle switch
    debug("Adding toggle switch", this.name);
    this._service = new Service.Switch(this.name);
    this._service.getCharacteristic(Characteristic.On)
      .on('set', this._setOn.bind(this));
  }
}

IrBlaster.prototype.getServices = function() {
  return [this._service];
}

IrBlaster.prototype._setOn = function(on, callback) {

  this.log("Setting " + this.name + " to " + on);

  if (on && !this.stateful) {
    setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, 0);
    }.bind(this), this.busy * 1000);
  }

  if (on) {
    this.httpRequest(this.url, this.data, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    callback();
  }
}

// An actual on/off switch

IrBlaster.prototype._setState = function(on, callback) {

  this.log("Turning " + this.name + " to " + on);

  if (on) {
    this.httpRequest(this.url, this.on_data, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    this.httpRequest(this.url, this.off_data, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  }
}

IrBlaster.prototype.httpRequest = function(url, data, callback) {
  //debug("url",url,"Data",data);
  // Content-Length is a workaround for a bug in both request and ESP8266WebServer - request uses lower case, and ESP8266WebServer only uses upper case

  if (data) {

    var body = JSON.stringify(data);
    debug("Length", body.length);
    request({
        url: url,
        method: "POST",
        timeout: 500,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length
        },
        body: body
      },
      function(error, response, body) {
        if (response) {
          debug("Response", response.statusCode, response.statusMessage);
        } else {
          debug("Error", error);
        }
        callback(error, response, body)
      })
  } else {

    request({
        url: url,
        method: "GET",
        timeout: 500
      },
      function(error, response, body) {
        if (response) {
          debug("Response", response.statusCode, response.statusMessage);
        } else {
          debug("Error", error);
        }
        callback(error, response, body)
      })
  }
}
