/**
 * SSE (Server-Sent Events) stream transformer.
 *
 * SSE Message format:
 * ```
 * event: <event-name>
 * data: <data-payload>
 * data: <data-payload-line-2>
 * ...
 * ```
 *
 * Each message is separated by a double newline (`\n\n`).
 *
 * The only mandatory field is `data`. Multiple `data` lines are concatenated. The transformer supports concatenation
 * using new lines if specified in options.
 */

/**
 * Added properties to TransformStream for SSE processing.
 */
export type SearchResultsTransformer =
    & { decoder: TextDecoder; buffer: string }
    & Transformer;

export type SSEMessage = { data: string } & Record<string, string>;

/**
 * Options for the SSE stream transformer.
 */
export type SearchResultsTransformOptions = {
    /**
     * Whether to add new lines between data chunks collected.
     * @default false
     */
    addNewLines?: boolean;
};

/**
 * SSE Stream Transform
 *
 * @example
 * ```ts
 * const sseTransformer = new SseStreamTransform();
 * const response = await fetch("your-sse-endpoint");
 * const readableStream = response.body
 *   ?.pipeThrough(sseTransformer)
 *   .pipeThrough(new YourNextTransformStream());
 * ```
 */
export class SseStreamTransform extends TransformStream<unknown, SSEMessage> {
    constructor(options: Partial<SearchResultsTransformOptions> = {}) {
        super({
            async transform(chunk, controller) {
                chunk = await chunk;
                this.buffer += this.decoder.decode(chunk);

                while (this.buffer.includes("\n\n")) {
                    // take the part of the message out of the buffer
                    const index = this.buffer.indexOf("\n\n") + 2;
                    const part = this.buffer.slice(0, index).trim();
                    this.buffer = this.buffer.slice(index);

                    // process message (line by line)
                    const message = part.split("\n").reduce(
                        (acc: Record<string, string>, cur: string) => {
                            const i = cur.indexOf(":");
                            if (i === -1) {
                                return acc;
                            }
                            const key = cur.slice(0, i).trim();
                            const value = cur.slice(i + 1).trim();
                            if (key === "data" && key in acc) {
                                acc[key] += (options.addNewLines ? "\n" : "") + value;
                            } else {
                                acc[key] = value;
                            }
                            return acc;
                        },
                        {},
                    ) as SSEMessage;

                    if (Object.keys(message).length === 0) {
                        // do not yield empty messages
                        continue;
                    }

                    controller.enqueue(message);
                }
            },

            buffer: "",
            decoder: new TextDecoder(),
        } as SearchResultsTransformer);
    }
}
