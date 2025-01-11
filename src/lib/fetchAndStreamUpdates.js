import EventSourceStream from "@server-sent-stream/web";
import * as jsonpatch from 'fast-json-patch';

export async function fetchAndStreamUpdates(url, options, initialData = {}, onChange) {
  const targetDocument = { ...initialData };

  // Handle streaming response and apply patches
  (async () => {
    try {
      const response = await fetch(url, options);

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      // Pipe the response body into an EventSourceStream
      const decoder = new EventSourceStream();
      response.body.pipeThrough(decoder);

      console.log('decoder', decoder)
      // const reader = decoder.readable.getReader();

      // const stream = decoder.pipeThrough(new TextDecoderStream());
      for await (const chunk of decoder.readable) {
        try {
          if (!chunk) {
            continue;
          }

          console.log('chunk', chunk);
          const patch = JSON.parse(chunk.data); // Assuming the patch is valid

          // Ensure patch does not replace the entire document with a non-object
          if (patch.path === '' && (patch.op === 'replace' || patch.op === 'add')) {
            if (typeof patch.value !== 'object' || patch.value === null || Array.isArray(patch.value)) {
              console.warn('Ignoring invalid root-level replacement patch:', patch);
              continue;
            }
          }

          // Apply the patch
          jsonpatch.applyOperation(targetDocument, patch);
          onChange(patch);
        } catch (error) {
          console.error('Error applying patch:', error);
        }
      }

      console.log('Stream complete');
    } catch (error) {
      console.error('Fetch error:', error);
    }
  })();

  return targetDocument;
}
