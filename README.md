# homebridge-HTTP-IRBlaster Plugin

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-dht.svg?style=flat)](https://npmjs.org/package/homebridge-http-irblaster)

I wrote this plugin as a wrapper around mdhiggins ESP8266-HTTP-IR-Blaster to allow remote control of InfraRed controlled devices by HomeKit. To use this plugin, you need to build the ESP8266 based IR Blaster device documented by mdhiggins on the github for the blaster. Once you have it built, you can control it via HomeKit.

# configuration

The configuration is very straight forward, you need just a Button name and the URL to control the blaster.  

Example config.json:

```
{
      "accessory": "http-irblaster",
      "name": "Power",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=538BC81:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Preset 1",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=5380835:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Preset 2",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=53888B5:PANASONIC:48"
        },
{
      "accessory": "http-irblaster",
      "name": "Tuner",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=5202500:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Muting",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=5004C49:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Vol +",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=5000401:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Vol -",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=5008481:PANASONIC:48"
        } ,
{
      "accessory": "http-irblaster",
      "name": "Music Port",
      "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=500595C:PANASONIC:48"
        }
```

Please note, this URL is an example from my configuration controlling my Panasonic SA-PM53 mini system.  These will not work for you, unless you have the same stereo.

# options

* stateful - The default behavior this is to turn itself off one second after being turned on. However you may want to create a dummy switch that remains on and must be manually turned off.  ie "stateful": true

# Roadmap

1. Support for stateful Switches
2. Convert to a platform plugin, to simplify the configuration.

# Credits

* mdhiggins - Creating the ESP8266 based IR Blaster, sharing your plans and source.
* nfarina - For creating the dummy plugin which I used as base for this plugin.
