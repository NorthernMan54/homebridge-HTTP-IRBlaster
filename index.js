"use strict";

var debug = require('debug')('IrBlaster');
var request = require("request");
var Service, Characteristic, cmdQueue;
var os = require("os");
var hostname = os.hostname();
const dns = require('dns');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-http-irblaster", "http-irblaster", IrBlaster);
};

function IrBlaster(log, config) {
  this.log = log;
  this.name = config.name;
  this.stateful = config.stateful || false;
  this.irBlaster = config.irBlaster;
  this.command = config.command || "/json?simple=1";
  this.on_busy = config.on_busy || 5;
  this.off_busy = config.off_busy || 5;
  this.down_busy = config.down_busy || 2;
  this.up_busy = config.up_busy || 2;
  this.rdelay = config.rdelay || 200;
  this.on_data = config.on_data;
  this.off_data = config.off_data;
  this.up_data = config.up_data;
  this.down_data = config.down_data;
  this.start = config.start || undefined;
  this.steps = config.steps;
  this.count = config.count || 0;

  this.working = Date.now();

  if (!config.irBlaster) {
    this.log.error("ERROR: Missing required option irBlaster");
  }

  if (this.on_data) {
    if (this.up_data) {
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

      if (this.start) {
        this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(this.start);
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

  findDevice.call(this);
}

IrBlaster.prototype.getServices = function() {
  var informationService = new Service.AccessoryInformation();

  informationService
    .setCharacteristic(Characteristic.Manufacturer, "HTTP-IRBlaster")
    .setCharacteristic(Characteristic.Model, this.service)
    .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
    .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);
  return [this._service, informationService];
};

IrBlaster.prototype._setSpeed = function(value, callback) {
  // debug("Device", this._service);

  this.log("Setting " + this.name + " to " + value);

  var current = this._service.getCharacteristic(Characteristic.RotationSpeed)
    .value;

  if (current === undefined) {
    current = this.start;
  }

  if (value === 100 && current === 0) {
    callback(null, current);
    return;
  }

  var _value = Math.floor(value / (100 / this.steps));
  var _current = Math.floor(current / (100 / this.steps));
  var delta = Math.round(_value - _current);

  debug("Values", this.name, value, current, delta);

  if (delta < 0) {
    // Turn down device
    this.log("Turning down " + this.name + " by " + Math.abs(delta));
    execQueue.call(this, "down", this.url, this.down_data, Math.abs(delta) + this.count, this.down_busy, this.rdelay, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else if (delta > 0) {
    // Turn up device
    this.log("Turning up " + this.name + " by " + Math.abs(delta));
    execQueue.call(this, "up", this.url, this.up_data, Math.abs(delta) + this.count, this.up_busy, this.rdelay, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    this.log("Not controlling " + this.name, value, current, delta);
    callback();
  }
};

IrBlaster.prototype._setOn = function(on, callback) {
  this.log("Setting " + this.name + " to " + on);

  if (on && !this.stateful) {
    setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, 0);
    }.bind(this), this.on_busy * 1000);
  }

  if ((on) || (!on && this.stateful)) {
    execQueue.call(this, "toggle", this.url, this.data, 1, this.on_busy, this.rdelay, function(error, response, responseBody) {
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
};

// An actual on/off switch

IrBlaster.prototype._setState = function(on, callback) {
  this.log("Turning " + this.name + " to " + on);

  debug("_setState", this.name, on, this._service.getCharacteristic(Characteristic.On).value);

  if (on && (this.on_data[0].data !== this.off_data[0].data || !this._service.getCharacteristic(Characteristic.On).value)) {
    if (this.up_data) {
      // Only set Rotation speed if device supports volume
      var current = this._service.getCharacteristic(Characteristic.RotationSpeed)
        .value;
      if (current !== this.start && this.start !== undefined) {
        debug("Setting level after turning on ", this.start);
        this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(this.start);
      }
    }
    execQueue.call(this, "on", this.url, this.on_data, 1, this.on_busy, this.rdelay, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else if (!on && (this.on_data[0].data !== this.off_data[0].data || this._service.getCharacteristic(Characteristic.On).value)) {
    execQueue.call(this, "off", this.url, this.off_data, 1, this.off_busy, this.rdelay, function(error, response, responseBody) {
      if (error) {
        this.log('IR Blast failed: %s', error.message);
        callback(error);
      } else {
        debug('IR Blast succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    debug("Do nothing");
    callback();
  }
};

IrBlaster.prototype.resetDevice = function() {
  debug("Reseting volume on device", this.name);
  execQueue.call(this, "on", this.url, this.on_data, 1, this.on_busy, this.rdelay);
  execQueue.call(this, "down", this.url, this.down_data, this.steps, this.down_busy, this.rdelay);
  execQueue.call(this, "up", this.url, this.up_data, 2, this.up_busy, this.rdelay);
  execQueue.call(this, "off", this.url, this.off_data, 1, this.off_busy, this.rdelay, function(error, response, responseBody) {
    this._service.getCharacteristic(Characteristic.RotationSpeed).updateValue(2);
  }.bind(this));
};

function httpRequest(name, url, data, count, sleep, rdelay, callback) {
  // debug("url",url,"Data",data);
  // Content-Length is a workaround for a bug in both request and ESP8266WebServer - request uses lower case, and ESP8266WebServer only uses upper case
  var cmdTime = Date.now() + sleep * count;
  debug("HttpRequest", name, url, count, sleep, rdelay);

  // debug("time",Date.now()," ",this.working);

  //  if (Date.now() > this.working) {
  //    this.working = Date.now() + sleep * count;
  if (this.url) {
    if (data) {
      for (var i = 0; i < data.length; i++) {
        data[i].repeat = count;
        data[i].rdelay = rdelay; // Stubbed
      }

      var body = JSON.stringify(data);
      debug("Body", body);
      request({
          url: url,
          method: "POST",
          timeout: 10000,
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
            this.url = null;
            findDevice.call(this);
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
          timeout: 10000
        },
        function(error, response, body) {
          if (response) {
            debug("Response", response.statusCode, response.statusMessage);
          } else {
            debug("Error", error);
            this.url = null;
            findDevice.call(this);
          }

          setTimeout(function() {
            if (callback) callback(error, response, body);
          }, cmdTime - Date.now());
        })
    }
  } else {
    callback(new Error("Unknown host " + this.name), "", "");
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
  cmdQueue.items.push([this, arguments]);

  // run the queue
  runQueue();
}

function findDevice() {
  dns.lookup(this.irBlaster, function(err, result) {
    if (err || result === undefined) {
      // if failed, retry device discovery every minute
      debug("WARNING: Dns lookup failed", err, result);
      this.log("WARNING: DNS name resolution of %s failed, retrying in 1 minute", this.irBlaster);
      setTimeout(function() {
        findDevice.call(this);
      }.bind(this), 60 * 1000);
    } else {
      this.url = "http://" + result + this.command;
      debug("URL", this.name, this.url);
      if (this.start === undefined && this.on_data && this.up_data) {
        this.resetDevice();
      }
    }
  }.bind(this));
}

function runQueue() {
  if (!cmdQueue.isRunning && cmdQueue.items.length > 0) {
    cmdQueue.isRunning = true;
    var cmds = cmdQueue.items.shift();
    var that = cmds[0];
    var args = cmds[1];

    if (args.length > 6) {
      // wrap callback with another function to toggle isRunning
      var callback = args[args.length - 1];
      args[args.length - 1] = function() {
        callback.apply(null, arguments);
        cmdQueue.isRunning = false;
        runQueue();
      };
    } else {
      // add callback to toggle isRunning
      args[args.length] = function() {
        cmdQueue.isRunning = false;
        runQueue();
      };
      args.length = args.length + 1;
    }
    httpRequest.apply(that, args);
  }
}
