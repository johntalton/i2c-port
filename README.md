# I²C MessagePort based Bus

This library and example intends to provide a `I2CBus` implementation (using async/await) over a `MessagePort`.

Primary target use cases:
 - serving multiple `Worker` threads with single bus worker
 - proxy `MessagePort` over HTTP (WebSockets)
