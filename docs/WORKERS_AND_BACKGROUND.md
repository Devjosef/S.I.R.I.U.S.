# Worker Threads and Background Processing

## What Are Worker Threads?
- Worker threads allow S.I.R.I.U.S. to run heavy or time-consuming tasks in the background, without freezing the main app.
- This keeps the user interface fast and responsive, even when doing complex AI or data processing.

## What Tasks Use Workers?
- AI inference (using Ollama)
- Large data processing (e.g., analyzing user memory)
- Embedding generation for vector search
- Any CPU-intensive or blocking operation

## Where is the Worker Code?
- Worker thread code lives in the `workers/` directory (e.g., `actionWorker.js`, `contextWorker.js`, `embeddingWorker.js`, `ollamaWorker.js`).
- The worker manager and pool logic is in `src/utils/workerManager.js`.
- Tasks are dispatched to workers automatically when needed.

## How to Add a New Worker
1. Create a new worker file in `workers/` (e.g., `myWorker.js`).
2. Register your worker in `workerManager.js`.
3. Use the worker from your service or controller by calling `runInWorker()`.

## Performance and Troubleshooting
- Worker threads are limited by your device's CPU and memory.
- If you see slowdowns, check your system resources or reduce the number of concurrent workers in config.
- All worker activity is logged for debugging (see `logger.js`).

---

For more details, see `src/utils/workerManager.js` and the main README. 