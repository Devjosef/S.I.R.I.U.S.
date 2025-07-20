# AI and Ollama in S.I.R.I.U.S.

## What is Ollama?
- [Ollama](https://ollama.ai/) is a local AI engine that runs on your own computer.
- It allows S.I.R.I.U.S. to use advanced AI features without sending any data to the cloud.
- All AI processing (language models, predictions, summaries) happens locally for maximum privacy.

## What Does Ollama Power?
- Summarizing emails, events, and daily digests
- Extracting intent from user input
- Generating personalized recommendations
- Powering advanced ML predictions (next action, optimal timing, etc.)
- Any natural language understanding in S.I.R.I.U.S.

## How to Install and Use Ollama
1. Download and install Ollama from [ollama.ai](https://ollama.ai/).
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. Download a model (e.g., Llama 3):
   ```bash
   ollama pull llama3.1:8b
   ```
4. S.I.R.I.U.S. will automatically connect to your local Ollama instance.

## Updating or Changing Models
- You can pull new models with `ollama pull <model-name>`.
- To use a different model, update the config in `src/services/ollamaService.js` or your `.env` file if supported.
- Restart S.I.R.I.U.S. after changing models.

## Privacy and Offline Operation
- All AI features work offline after the initial model download.
- No data is sent to Ollama servers or any third party.
- You have full control over which models are installed and used.

---

For more details, see `src/services/ollamaService.js` and the main README. 