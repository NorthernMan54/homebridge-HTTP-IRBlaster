"use strict";

var debug = require('debug')('IrBlaster');
var request = require("request");
var Service, Characteristic, cmdQueue;
var personality = {};
var os = require("os");
var hostname = os.hostname();

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-http-irblaster", "http-irblaster", IrBlaster);
}

function IrBlaster(log, config) {
  this.log = log;
  this.name = config.name;
  personality.stateful = config.stateful || false;
  personality.irBlaster = config.irBlaster;
  personality.command = config.command || "/json?simple=1";
  personality.on_busy = config.on_busy || 5;
  personality.off_busy = config.off_busy || 1;
  personality.down_busy = config.down_busy || 1;
  personality.up_busy = config.up_busy || 1;
  personality.rdelay = config.rdelay || 200;
  personality.on_data = config.on_data;
  personality.off_data = config.off_data;
  personality.up_data = config.up_data;
  personality.down_data = config.down_data;
  personality.start = config.start || undefined;
  personality.steps = config.steps;
  personality.count = config.count || 0;

  this.working = Date.now();

  if (personality.on_data) {

    if (personality.up_data) {
      // On/Off and up/down type device
      //   this.addOptionalCharacteristic(Characteristic.RotationSpeed);
      debug("Adding Fan", this.name);
      this._service = new Service.Fan(this.name);
      this._service.getCharacteristic(Characteristic.On)
        .on('set', this._setState.bind(this));

      // Using RotationSpeed as a placeholder for up/down control

      this._service
        .addCharacteristic(new Characteristic.RotationSpeed())
        .on('set', this._setSpeed.bind(this));

      if (personality.start) {
        this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(personality.start);
      }

    } else {
      // Statefull on/off
      debug("Adding Stateful switch", this.name);
      this._service = new Service.Switch(this.name);
      this._service.getCharacteristic(Characteristic.On)
        .on('set', this._setState.bind(this));
    }
  } else {
    // Toggle switch
    debug("Adding toggle switch", this.name);
    this._service = new Service.Switch(this.name);
    this._service.getCharacteristic(Characteristic.On)
      .on('set', this._setOn.bind(this));
  }

  const dns = require('dns')
  dns.lookup(personality.irBlaster, function(err, result) {
    personality.url = "http://" + result + personality.command;
    debug("RESETDEVIVE", this.name, personality.start, personality.on_data, personality.up_data);
    if (personality.start == undefined && personality.on_data && personality.up_data)
      this.resetDevice();
  }.bind(this));

}

IrBlaster.prototype.getServices = function() {
  var informationService = new Service.AccessoryInformation();

  informationService
    .setCharacteristic(Characteristic.Manufacturer, "HTTP-IRBlaster")
    .setCharacteristic(Characteristic.Model, this.service)
    .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
    .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);
  return [this._service, informationService];
}

IrBlaster.prototype._setSpeed = function(value, callback) {

  //debug("Device", this._service);

  this.log("Setting " + this.name + " to " + value);

  var current = this._service.getCharacteristic(Characteristic.RotationSpeed)
    .value;

  if (current == undefined)
    current = personality.start;

  if (value == 100 && current == 0) {
    callback(null, current);
    return;
  }

  var _value = Math.floor(value / (100 / personality.steps));
  var _current = Math.floor(current / (100 / personality.steps));
  var delta = Math.round(_value - _current);

  debug("Values", this.name, value, current, delta);

  if (delta < 0) {
    // Turn down device
    this.log("Turning down " + this.name + " by " + Math.abs(delta));
    execQueue("down", personality.url, personality.down_data, Math.abs(delta) + personality.count, personality.down_busy, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', personality.url);
        callback();
      }
    }.bind(this));
  } else if (delta > 0) {

    // Turn up device
    this.log("Turning up " + this.name + " by " + Math.abs(delta));
    execQueue("up", personality.url, personality.up_data, Math.abs(delta) + personality.count, personality.up_busy, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', personality.url);
        callback();
      }
    }.bind(this));

  } else {
    this.log("Not controlling " + this.name, value, current, delta);
    callback();
  }
}


IrBlaster.prototype._setOn = function(on, callback) {

  this.log("Setting " + this.name + " to " + on);

  if (on && !personality.stateful) {
    setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, 0);
    }.bind(this), personality.on_busy * 1000);
  }

  //  if (on) {
  execQueue("toggle", personality.url, personality.data, 1, personality.on_busy, function(error, response, responseBody) {
    if (error) {
      this.log('IR Blast failed: %s', error.message);
      callback(error);
    } else {
      debug('IR Blast succeeded!', personality.url);
      callback();
    }
  }.bind(this));
  //  } else {
  //    callback();
  //  }
}

// An actual on/off switch

IrBlaster.prototype._setState = function(on, callback) {

  this.log("Turning " + this.name + " to " + on);

  debug("_setState", this.name, on, this._service.getCharacteristic(Characteristic.On).value);

  if (on && (personality.on_data[0].data != personality.off_data[0].data || !this._service.getCharacteristic(Characteristic.On).value)) {
    execQueue("on", personality.url, personality.on_data, 1, personality.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', personality.url);
        if (personality.up_data) {
          // Only set Rotation speed if device supports volume
          var current = this._service.getCharacteristic(Characteristic.RotationSpeed)
            .value;
          if (current != personality.start && personality.start != undefined) {
            debug("Setting level after turning on ", personality.start);
            this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(personality.start);
          }
        }
        callback();
      }
    }.bind(this));
  } else if (!on && (personality.on_data[0].data != personality.off_data[0].data || this._service.getCharacteristic(Characteristic.On).value)) {
    execQueue("off", personality.url, personality.off_data, 1, personality.off_busy, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', personality.url);
        callback();
      }
    }.bind(this));
  } else {
    debug("Do nothing");
    callback();
  }
}

IrBlaster.prototype.resetDevice = function() {
  debug("Reseting volume on device", this.name);
  execQueue("on", personality.url, personality.on_data, 1, personality.on_busy, function(error, response, responseBody) {

    setTimeout(function() {
      execQueue("down", personality.url, personality.down_data, personality.steps, personality.down_busy, function(error, response, responseBody) {

        setTimeout(function() {
          execQueue("up", personality.url, personality.up_data, 2, personality.up_busy, function(error, response, responseBody) {

            setTimeout(function() {
              execQueue("off", personality.url, personality.off_data, 1, personality.off_busy, function(error, response, responseBody) {
                this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(2);
              }.bind(this));
            }.bind(this), personality.off_busy);

          }.bind(this));

        }.bind(this), personality.steps * personality.down_busy);
      }.bind(this));

    }.bind(this), personality.on_busy);
  }.bind(this));


}

function httpRequest(name, url, data, count, sleep, callback) {
  //debug("url",url,"Data",data);
  // Content-Length is a workaround for a bug in both request and ESP8266WebServer - request uses lower case, and ESP8266WebServer only uses upper case
  var cmdTime = Date.now() + sleep * count;
  debug("HttpRequest", name, url, count, sleep);

  //debug("time",Date.now()," ",this.working);

  //  if (Date.now() > this.working) {
  //    this.working = Date.now() + sleep * count;

  if (data) {

    for (var i = 0; i < data.length; i++) {
      data[i].repeat = count;
      data[i].rdelay = personality.rdelay; // Stubbed
    }

    var body = JSON.stringify(data);
    debug("Body", body);
    request({
        url: url,
        method: "POST",
        timeout: 5000,
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
          debug("Error", name, url, count, sleep, callback, error);
        }

        setTimeout(function() {
          if (callback) callback(error, response, body);
        }, cmdTime - Date.now());
      }.bind(this));
  } else {
    // Simple URL Format
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

        setTimeout(function() {
          if (callback) callback(error, response, body);
        }, cmdTime - Date.now());
      })
  }
  //  } else {
  //    debug("NODEMCU is busy", name);
  //    if (callback) callback(new Error("Device Busy"));
  //  }
}

cmdQueue = {
  items: [],
  isRunning: false
};

function execQueue() {

  // push these args to the end of the queue
  cmdQueue.items.push(arguments);

  // run the queue
  runQueue();

}

function runQueue() {

  if (!cmdQueue.isRunning && cmdQueue.items.length > 0) {

    cmdQueue.isRunning = true;
    var args = cmdQueue.items.shift();

    if (args.length > 1) {

      // wrap callback with another function to toggle isRunning
      var callback = args[args.length - 1];
      args[args.length - 1] = function() {

        callback.apply(null, arguments);
        cmdQueue.isRunning = false;
        runQueue();

      };

    } else {

      // add callback to toggle isRunning
      args.push(function() {
        cmdQueue.isRunning = false;
        runQueue();
      });

    }
    httpRequest.apply(null, args);

  }

}
