# SSE Stream Transform

Transform Server-Sent Events (SSE) raw response streams into SSE objects stream.

Battle-tested in production environments.

## Background

Server-Sent Events (SSE) is a standard for streaming text-based event data from a server to a client over HTTP. While
the SSE protocol is widely supported in browsers via the
`EventSource` [API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), handling SSE streams in other
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
