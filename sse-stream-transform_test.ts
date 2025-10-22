import test from "node:test";
import assert from "node:assert/strict";
import {SseStreamTransform} from "./sse-stream-transform.js";

const input = `
data: message 1 part 1
data: message 1 part 2

data: message 2

event: custom
data: message 3

`;

test("Sample test for SSE transform", (_, done) => {
  const encoder = new TextEncoder();
  const transformer = new SseStreamTransform();
  const reader = transformer.readable.getReader();
  const writer = transformer.writable.getWriter();

  (async () => {
    // convert the console log to assertions
    const msg1 = await reader.read();
    assert.equal(msg1.value?.data, "message 1 part 1message 1 part 2");

    const msg2 = await reader.read();
    assert.equal(msg2.value?.data, "message 2");

    const msg3 = await reader.read();
    assert.equal(msg3.value?.data, "message 3");
    assert.equal(msg3.value?.event, "custom");

    const msg4 = await reader.read();
    assert.equal(msg4.done, true);
    done();
  })().catch(console.error);

  (async () => {
    // write input data chunk by chunk (in this case, letter by letter)
    for (const c of input) {
      await writer.write(encoder.encode(c));
    }
    await writer.close();
  })().catch(console.error);
});
