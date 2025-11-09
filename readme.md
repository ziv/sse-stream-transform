# SSE Stream Transform

Transform Server-Sent Events (SSE) raw response streams into SSE objects stream.

_Battle-tested in production environments._

## Background

Server-Sent Events (SSE) is a standard for streaming text-based event data from a server to a client over HTTP. While
the SSE protocol is widely supported in browsers via the
[`EventSource` API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), handling SSE streams in other
JavaScript environments (like Node.js or Deno) often requires custom parsing of the raw stream data.

[More info about SSE at MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

### Isomorphic

Support any JavaScript runtime in server and client side (Node.js, Deno, Bun,
Browser, etc.) that supports the [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API).

Exported as **ESM** and **CommonJS**.

## Usage

Installation:

```shell
npm install sse-stream-transform
```

Using the transformer to consume SSE messages:

```ts
import {SseStreamTransform} from "sse-stream-transform";

// also works in CommonJS:
// const {SseStreamTransform} = require("sse-stream-transform");

// endpoint that returns SSE response stream
const response = await fetch("https://example.com/sse-endpoint");

// iterate over SSE messages using for-await-of 
// and the SseStreamTransform
for await (const msg of response.body.pipeThrough(new SseStreamTransform())) {
    console.log("Received SSE message:", msg);
}
```

### SSE Message Format

The raw SSE stream consists of text lines formatted according to the SSE specification, where each message is
composed of multiple lines starting with field names like `data:`, `event:`, etc, and messages are separated by double
newlines.

The only required field is `data:`. Other fields like `event:`, `id:`, and `retry:` are optional. Multiple `data:` lines
within a single message are concatenated with optional newline characters.

Example raw SSE message:

```
data: First line of data
data: Second line of data
event: customEvent
id: 12345

data: Another message
```

The `SseStreamTransform` outputs SSE messages as objects with the following structure:

```ts
interface SseMessage {
    data: string;           // Event data
    [key: string]: string;  // Additional fields
}
```

---

Made with ♥ to the JavaScript community.