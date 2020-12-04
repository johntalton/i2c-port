# I²C MessagePort based Bus

Provides tooling that allows for `I2CBus` hosting natively, over `MessagePort`, within `Worker` and over `WebSockets`.

This allows the `I2CBus` api to be used in a wide range of deployment cases.

It can also be using with bus Multiplexing such as [@johntalton/i2c-bus-tca9548a](https://github.com/johntalton/i2c-bus-tca9548a) that adheres to the `I2CBus` interface.  As well as using [i2c-bus](https://github.com/fivdi/i2c-bus) as the default concrete/base implementation.

### Provided Abstraction
Key is providing multiple abstraction layers.

- A `Message` type definition (including `Read`, `ReadResult`, `Error`, etc)
- An `I2CPort` function that maps `Message` into `I2CBus` commands on provided `bus`
- And `I2CPortBus` which implements `I2CBus` over a `MessagePort` interface

The corresponding `WebSocket` to `MessagePort` example can be run to provide this service.

The **Message** definition layer provides a naming convention and contract without implementation details. It is ideal for abstracting the service at each layer.

The **Port** utility layer allows for mapping of the generalized message into `I2CBus` interface commands. This layer provides the mirror binding the `I2CPortBus` implementation.
This utility operates over an `I2CBus` interface, allowing for further abstraction and requires the caller to manager its allocation and state.

The **Bus** interface layer (along with example server) creates a `WebSocket` service which allows for the above `Message` interactions to a concrete - and remote - implementation.
The `I2CPortBus` uses a simple one-call-one-response per `MessagePort` in order to bridge the `WebSocket` `on`/`send` api into the `I2CBus` more friendly `Promise`based async/await code.

### Direction

Having a full `I2CWebBus` that implements `I2CBus` enables moving other Sensor implementations that currently use the `I2CBus` over to a web-safe version. This will increase code portability and quality as wall as validate many of the timing and latency issues that are otherwise not seen locally in most cases.

Further mocking and virtualizing can be provided once a common `WebSocket` message api is established. Providing virtual sensor and other services in a web-centric fashion.

Single 1:1 calls allow for basic interactions, however, extending the message with 'scripting' style operation could provide performant solution when latency of the transit layer becomes and issue.
This could be extended to enable service-side interactions such as keep alive or default access polling. Other common data-fetch or read-comp-trigger features could be added.