# Quantization in S.I.R.I.U.S.

## What is Quantization?
- Quantization is a technique used to make AI models smaller and faster by reducing the precision of their numbers (e.g., using 8-bit instead of 32-bit values).
- This allows large language models and other AI systems to run efficiently on local devices, even with limited resources.

## How Does S.I.R.I.U.S. Use Quantization?
- S.I.R.I.U.S. uses quantization to optimize AI models for local, offline use.
- The main logic is in `src/utils/matryoshkaQuantization.js`.
- Ollama (the local AI engine) also supports quantized models for better performance.
- Quantization is applied when loading or running models, and can be adjusted for different use cases.

## Benefits
- **Performance**: Faster inference and lower latency, especially on CPUs.
- **Memory**: Reduced RAM and storage requirements, making it possible to run advanced AI on laptops, desktops, and even some mobile devices.
- **Local Operation**: Enables all AI features to work offline, without needing powerful cloud servers.

## Trade-Offs
- **Accuracy**: Quantized models may be slightly less accurate than full-precision models, but the difference is often small for most tasks.
- **Speed vs. Quality**: You can choose more aggressive quantization for speed, or less for higher accuracy.

## Technical Details: How Quantization Works in S.I.R.I.U.S.

### 1. Device Capability Detection
- S.I.R.I.U.S. detects your device's total memory and CPU cores using Node's `os` module and config overrides.
- Based on these, it selects a quantization level:
  - 16-bit (HIGH): High-end desktops/laptops
  - 8-bit (MEDIUM): Mid-range devices
  - 4-bit (MOBILE): Phones/tablets
  - 2-bit (TINY): Very limited devices
- See `getOptimalQuantizationLevel()` in `matryoshkaQuantization.js`:

```js
const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024));
const cpuCores = os.cpus().length;
if (totalMemoryMB >= 8192 && cpuCores >= 8) return QUANTIZATION_LEVELS.HIGH;
// ...
```

### 2. Generating a Quantized Model (Matryoshka)
- S.I.R.I.U.S. creates a custom Modelfile for Ollama, specifying the base model, system prompt, quantization parameters, and device-specific optimizations.
- The Modelfile is written to a temp directory, then used with the Ollama CLI:

```js
const modelfileContent = `FROM ${baseModel}\nSYSTEM """${systemPrompt}"""\nPARAMETER temperature ${temperature}\nPARAMETER num_ctx ${contextWindow}\n...`;
await fs.writeFile(modelfilePath, modelfileContent);
execSync(`ollama create ${safeTargetModel} -f ${modelfilePath}`);
```

### 3. Checking and Listing Quantization Levels
- You can check if a model is quantized (and which levels are available) using:

```js
const result = execSync(`ollama show ${modelName}`, { encoding: 'utf8' });
// Look for QUANTIZE or QUANTIZE_NEST in the output
```

- The function `listQuantizationLevels(modelName)` parses the output to list all available quantization types and thresholds.

### 4. Optimizing an Existing Model
- To optimize a model, S.I.R.I.U.S. checks if it already has Matryoshka quantization. If not, it creates a new quantized version:

```js
if (!await hasMatryoshkaQuantization(modelName)) {
  await createMatryoshkaModel(modelName, `${modelName}-matryoshka`);
}
```

### 5. CLI Commands and Config
- You can manually create or inspect models using the Ollama CLI:
  - `ollama create <model> -f <Modelfile>`
  - `ollama show <model>`
  - `ollama list`
- Quantization settings can be adjusted in `src/utils/matryoshkaQuantization.js` or via config/environment variables.

## Example: Creating a Quantized Model
```js
import { createMatryoshkaModel } from '../src/utils/matryoshkaQuantization.js';
await createMatryoshkaModel('llama3.1:8b', 'sirius-quant', { quantizationLevel: QUANTIZATION_LEVELS.MEDIUM });
```

---

For more details, see the quantization utility and Ollama documentation, or ask in project discussions! 