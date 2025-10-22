# SSE Stream Transform

Transform Server-Sent Events (SSE) raw response streams into SSE objects stream.

## Isomorphic

Support any JavaScript runtime in server and client side (Node.js, Deno,
Browser, etc.) that supports the Web Streams API.

## Usage

Installation:

```shell
npm install sse-stream-transform
```

Using the transformer to consume SSE messages:

```ts
import { SseStreamTransform } from "sse-stream-transform";

// end point that returns SSE response
const res = await fetch("https://example.com/sse-endpoint");

for await (const msg of res.body.pipeThrough(new SseStreamTransform())) {
  console.log("Received SSE message:", msg);
}
```
