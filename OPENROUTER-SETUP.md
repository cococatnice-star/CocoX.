# CocoX AI — OpenRouter setup

1. Open the project folder that contains `package.json`.
2. Open the file named **`idk.env`** in that same folder.
3. Replace `PASTE_YOUR_OPENROUTER_KEY_HERE` with your OpenRouter API key:

   ```env
   OPENROUTER_API_KEY=sk-or-v1-your_real_key_here
   ```

4. Save the file.
5. Stop the CocoX server completely, then start it again (`npm run dev` for local development, or your normal Replit Run command).
6. Open CocoX AI and send a test message. The default model is `openai/gpt-4o-mini`; you can enter another model ID from https://openrouter.ai/models.

The key is read by the server and is never sent to the browser. Do not put it in a `VITE_` variable, frontend code, screenshots, or a public repository. `idk.env` is excluded by `.gitignore`.

If your hosting provider has a Secrets/Environment Variables page, you can instead add a secret named `OPENROUTER_API_KEY`; that server environment variable takes precedence over the file.

## Troubleshooting

- **Key not found:** make sure `idk.env` is beside `package.json`, the line starts exactly with `OPENROUTER_API_KEY=`, and restart the server.
- **401 / invalid key:** create or copy a valid key from https://openrouter.ai/keys.
- **402 / payment required:** check your OpenRouter credits and account limits.
- **Model not found:** choose a valid model ID from https://openrouter.ai/models.
