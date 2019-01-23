# homebridge-HTTP-IRBlaster Plugin

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-http-irblaster.svg?style=flat)](https://npmjs.org/package/homebridge-http-irblaster)

![img_1640](https://user-images.githubusercontent.com/19808920/33053270-aef3dbf2-ce40-11e7-8716-0caaa8c47051.PNG)

I wrote this plugin as a wrapper around <https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster> to allow remote control of InfraRed controlled devices by HomeKit. To use this plugin, you need to build the ESP8266 based IR Blaster device documented by mdhiggins on the github for the blaster. Once you have it built, you can control it via HomeKit.

![IRBlasterCircuit](https://user-images.githubusercontent.com/19808920/35492079-9aa49e48-0478-11e8-927c-4df2aab6fc9b.png)

The plugin will create different types of accessories in HomeKit, depending on the configuration and features of the device.  For simple accessories, a switch is configured, allowing on and off control.  While for more advanced accessories a FAN is configured allowing on, off and a level to be set.  For the fireplace I connected, I use the level to control the flame height, and for the Panasonic stereo the volume.

# Circuit Diagrams

## RF and LED Transmitter

![RF-LED](files/ESP%208266%20-%20RF%20and%20LED_bb.jpg)

![DHT-YL](files/ESP%208266%20-%20RF%20and%20LED_schem.jpg)

# Installation

More detailed instructions are available here <https://www.instructables.com/id/Control-Your-Fireplace-With-HomeKit-and-Alexa/>

1. sudo npm install -g homebridge-http-irblaster

# configuration

The configuration is very straight forward, you need just a Button name and the command to control the blaster.

Example config.json containing the configuration for several of my devices, including my Panasonic SA-PM53 stereo, Fireplace and LG TV/Yamaha receiver.

```
{
  "accessory": "http-irblaster",
  "name": "Power",
  "irBlaster": "ESP_869815",
  "command": "/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=538BC81:PANASONIC:48"
}, {
  "accessory": "http-irblaster",
  "name": "Panasonic",
  "irBlaster": "ESP_869815",
  "on_busy": 5000,
  "off_busy": 5000,
  "up_busy": 400,
  "down_busy": 400,
  "steps": 50,
  "rdelay": 100,
  "count": 1,
  "off_data": [{
    "type": "PANASONIC",
    "out": 1,
    "data": "538BC81",
    "length": 48,
    "address": 16388
  }],
  "on_data": [{
    "type": "PANASONIC",
    "out": 1,
    "data": "538BC81",
    "length": 48,
    "address": 16388
  }],
  "up_data": [{
    "type": "PANASONIC",
    "out": 1,
    "data": "5000401",
    "length": 48,
    "address": 16388
  }],
  "down_data": [{
    "type": "PANASONIC",
    "out": 1,
    "data": "5008481",
    "length": 48,
    "address": 16388
  }]
}, {
  "accessory": "http-irblaster",
  "name": "Fireplace",
  "irBlaster": "ESP_869815",
  "on_busy": 32000,
  "off_busy": 5000,
  "up_busy": 600,
  "down_busy": 600,
  "start": 100,
  "steps": 10,
  "rdelay": 600,
  "off_data": [{
    "type": "raw",
    "out": 1,
    "khz": 500,
    "data": [200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200],
    "pulse": 10,
    "pdelay": 30
  }],
  "on_data": [{
    "type": "raw",
    "out": 1,
    "data": [200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 700, 200, 200, 700, 200, 700, 700, 200, 700, 200],
    "khz": 500,
    "pulse": 10,
    "pdelay": 30
  }],
  "up_data": [{
    "type": "raw",
    "out": 1,
    "data": [200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 700, 200],
    "khz": 500,
    "pulse": 10,
    "pdelay": 30
  }],
  "down_data": [{
    "type": "raw",
    "out": 1,
    "data": [200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 200, 700, 200, 700, 200, 700, 200, 700, 200, 700, 200, 700, 200, 700, 200, 700],
    "khz": 500,
    "pulse": 10,
    "pdelay": 30
  }]
}, {
  "accessory": "http-irblaster",
  "name": "TV",
  "irBlaster": "ESP_869815",
  "on_busy": 1000,
  "off_busy": 1000,
  "off_data": [{
    "out": 1,
    "data": "20DFA35C",
    "type": "NEC",
    "length": 32
  }, {
    "out": 1,
    "data": "5EA17887",
    "type": "NEC",
    "length": 32
  }],
  "on_data": [{
    "out": 1,
    "data": "20DF23DC",
    "type": "NEC",
    "length": 32
  }, {
    "out": 1,
    "data": "5EA1B847",
    "type": "NEC",
    "length": 32
  }]
}
```

Please note, this command is an example from my configuration controlling my Panasonic SA-PM53 mini system. These will not work for you, unless you have the same stereo. And the fireplace is one with a radio remote [<https://valorfireplaces.com/features/remote-controls.php>] with this FCC ID Rtd-g6rh. To control the fireplace, I just wired in a 315MHZ Transmitter module in place of the LED/Transistor.

# Options - Simple devices that toggle

- accessory - Must be "http-irblaster"
- name - Name of the accessory in HomeKit
- irBlaster - Name or ip address of your IRBlaster Device
- command - Command to control the device ie "/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=538BC81:PANASONIC:48"
- stateful - The default behavior of the plugin is to turn itself off one second after being turned on. However you may want to create a dummy switch that remains on and must be manually turned off. ie "stateful": true
- busy - How long should the switch stay on in HomeKit ( in seconds ), defaults to 1 second.

# Options - Complex devices with levels

- "accessory" - Must be "http-irblaster"
- "name" - Name of the device
- "irBlaster" - Name or ip address of your IRBlaster Device
- "on_busy" - How long the device should be busy for when turning on, in milliseconds ie 30000
- "off_busy" - How long the device should be busy for when turning off, in milliseconds ie 1000
- "up_busy" - How long the device should be busy for when turning up, in milliseconds ie 600
- "down_busy" - How long the device should be busy for when turning down, in milliseconds ie 600
- "start" - When turned on, where does the volume start at - If missing unit turns on during homebridge restart, and sets level to 0, and turns off agin.
- "steps" - How many steps for the level control
- "rdelay" - delay between repeated operations - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details

- off_data, on_data, up_data, down_data - Commands to turn device on, off, up and down.
- "type" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "out" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "data" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "khz" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "pulse" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "pdelay" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details
- "length" - See https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster for details

# Credits

- mdhiggins - Creating the ESP8266 based IR Blaster, sharing your plans and source.
- nfarina - For creating the dummy plugin which I used as base for this plugin.
