# I²C MessagePort based Bus

Provides tooling that allows for `I2CBus` to be hosted natively, over `MessagePort`, within `Worker` and over `WebSockets`.

[![npm Version](https://img.shields.io/npm/v/@johntalton/i2c-port.svg)](https://www.npmjs.com/package/@johntalton/i2c-port)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/i2c-port/i2c-port)
![CI](https://github.com/johntalton/i2c-port/workflows/CI/badge.svg)
![CodeQL](https://github.com/johntalton/i2c-port/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/i2c-port)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/i2c-port.svg)](https://www.npmjs.com/package/@johntalton/i2c-port)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/i2c-port)

This allows the `I2CBus` api to be used in a wide range of deployment cases.

It can also be using with bus Multiplexing such as [@johntalton/i2c-bus-tca9548a](https://github.com/johntalton/i2c-bus-tca9548a) that adheres to the `I2CBus` interface.  As well as using [i2c-bus](https://github.com/fivdi/i2c-bus) as the default concrete/base implementation.

# Provided Abstraction

Key is providing multiple abstraction layers.

- A `Message` type definition (including `Read`, `ReadResult`, `Error`, etc)
- An `I2CPort` function that maps `Message` into `I2CBus` commands on provided `bus`
- And `I2CPortBus` which implements `I2CBus` over a `MessagePort` interface

The corresponding `WebSocket` to `MessagePort` example can be run to provide this service.

## `Message`

The **Message** definition layer provides a naming convention and contract without implementation details. It is ideal for abstracting the service at each layer.

## `I2CPort`

The port utility provides a `handleMessage` function.
By which, given a provided `I2CBus` and `Message`, will execute that bus command.

```javascript
const busX = ... // a I2CBus impl from somewhere
const result = await I2CPort.handleMessage(busX, {
  namespace: 'NS',
  type: 'readI2cBlock',
  address: 0x00,
  cmd: 0x00,
  length: 3
})

console.log(result)
/*
{
    namespace: 'NS',
    address: 0,
    type: 'readResult',
    bytesRead: 3,
    buffer: Uint8Array(3) [ 1, 3, 4 ]
    ...
}
*/
```

This message to bus method and back is particularly useful when abstracting the `I2CBus` class methods accros a `MessagePort` implementation such as `I2CPortBbus`.

## `I2CPortBus`

The implementation of `I2CBus` allows for creating a instance classes which use the generic `I2CBus` interface and alow them to run atop of a `MessagePort`.

Useful application (as seen in the examples) of this are:
    - Workers: allow for running `I2CBus` implementation and Sensor across worker (shared i2c service for multiple workers)
    - WebSockets: allow for transmistion of `Message` accross a WebSocket to allow for remote i2c Sensor implementations.


## ArrayBuffer and friends

The current implementation attempts to preserve a common `ArrayBuffer` interface across the implementation in order to provide flexibility
