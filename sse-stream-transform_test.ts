import test from "node:test";
import assert from "node:assert/strict";
import {SseStreamTransform} from "./sse-stream-transform.js";


// In order to use the "done" in the proper place, we cannot use async functions directly in the test.
// So we wrap the test logic in an async IIFE and call done() when finished.
test("Transform raw SSE stream into a stream of SSE objects", (_, done) => {
    const input = `
data: message 1 part 1
data: message 1 part 2

data: message 2

event: custom
data: message 3

`;

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

        // now it safe to call done()
        done();
    })();

    (async () => {
        // write input data chunk by chunk (in this case, letter by letter)
        for (const c of input) {
            await writer.write(encoder.encode(c));
        }
        await writer.close();
    })();
});

test("addNewLines option concatenates data with newlines", (_, done) => {
    const input = `data: line 1
data: line 2
data: line 3

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform({ addNewLines: true });
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "line 1\nline 2\nline 3");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Empty messages are filtered out", (_, done) => {
    const input = `

data: actual message

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "actual message");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Lines without colons are ignored", (_, done) => {
    const input = `invalid line without colon
data: valid message

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "valid message");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles messages with multiple fields", (_, done) => {
    const input = `event: update
id: 123
retry: 5000
data: test data

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "test data");
        assert.equal(msg.value?.event, "update");
        assert.equal(msg.value?.id, "123");
        assert.equal(msg.value?.retry, "5000");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles whitespace around keys and values", (_, done) => {
    const input = `  event  :  custom
  data  :  message with spaces

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "message with spaces");
        assert.equal(msg.value?.event, "custom");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles values with colons", (_, done) => {
    const input = `data: https://example.com:8080/path

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "https://example.com:8080/path");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles empty input stream", (_, done) => {
    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.close();
    })();
});

test("Handles incomplete message at end of stream", (_, done) => {
    const input = `data: complete message

data: incomplete`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, "complete message");

        // Incomplete message should not be yielded
        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Processes large chunks correctly", (_, done) => {
    const input = `data: message 1

data: message 2

data: message 3

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg1 = await reader.read();
        assert.equal(msg1.value?.data, "message 1");

        const msg2 = await reader.read();
        assert.equal(msg2.value?.data, "message 2");

        const msg3 = await reader.read();
        assert.equal(msg3.value?.data, "message 3");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        // Write entire input as single chunk
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles multiple messages split across chunks", (_, done) => {
    const part1 = `data: message`;
    const part2 = ` 1

data: mes`;
    const part3 = `sage 2

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg1 = await reader.read();
        assert.equal(msg1.value?.data, "message 1");

        const msg2 = await reader.read();
        assert.equal(msg2.value?.data, "message 2");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(part1));
        await writer.write(encoder.encode(part2));
        await writer.write(encoder.encode(part3));
        await writer.close();
    })();
});

test("Handles comment lines (starting with colon)", (_, done) => {
    const input = `: this is a comment
data: actual message
: another comment

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        // Comments create empty-key entries which should still be in the message
        assert.equal(msg.value?.data, "actual message");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles event without data field", (_, done) => {
    const input = `event: ping

data: pong

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        // First message should have only event field (no data)
        const msg1 = await reader.read();
        assert.equal(msg1.value?.event, "ping");
        assert.equal(msg1.value?.data, undefined);

        // Second message has data
        const msg2 = await reader.read();
        assert.equal(msg2.value?.data, "pong");

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});

test("Handles JSON data payload", (_, done) => {
    const input = `data: {"key": "value", "number": 42}

`;

    const encoder = new TextEncoder();
    const transformer = new SseStreamTransform();
    const reader = transformer.readable.getReader();
    const writer = transformer.writable.getWriter();

    (async () => {
        const msg = await reader.read();
        assert.equal(msg.value?.data, '{"key": "value", "number": 42}');

        // Verify it can be parsed as JSON
        const parsed = JSON.parse(msg.value!.data);
        assert.equal(parsed.key, "value");
        assert.equal(parsed.number, 42);

        const end = await reader.read();
        assert.equal(end.done, true);

        done();
    })();

    (async () => {
        await writer.write(encoder.encode(input));
        await writer.close();
    })();
});
