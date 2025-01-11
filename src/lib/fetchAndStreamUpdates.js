import * as jsonpatch from 'fast-json-patch';

export async function fetchAndStreamUpdates(url, options, initialData = {}) {
  const targetDocument = { ...initialData };

  // Handle streaming response and apply patches
  (async () => {
    try {
      const response = await fetch(url, options);

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const stream = response.body.pipeThrough(new TextDecoderStream());

      for await (const chunk of stream) {
        try {
          const patch = JSON.parse(chunk); // Assuming the patch is valid

          // Ensure patch does not replace the entire document with a non-object
          if (patch.path === '' && (patch.op === 'replace' || patch.op === 'add')) {
            if (typeof patch.value !== 'object' || patch.value === null || Array.isArray(patch.value)) {
              console.warn('Ignoring invalid root-level replacement patch:', patch);
              continue;
            }
          }

          // Apply the patch
          jsonpatch.applyOperation(targetDocument, patch);
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

/*
const updatesArray = [];

const streamingObject = fetchAndStreamUpdates('/your-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' }),
}, { initialKey: 'initialValue' });

updatesArray.push(streamingObject);

console.log('Initial object:', updatesArray[0]);

*/
