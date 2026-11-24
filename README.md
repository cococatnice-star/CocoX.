# Project Build Assistant

i have a zip of a project can u build it it has a proxy i want to change it tho firsdt build it

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e66234ce-8a85-48c2-aed5-f478075acd17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## CocoX AI — OpenRouter API key

CocoX AI reads its OpenRouter credential on the server from the project-root file named `idk.env`.

1. Open `idk.env` in the project root.
2. Replace `PASTE_YOUR_OPENROUTER_KEY_HERE` with your OpenRouter key, keeping the line in this format:
   `OPENROUTER_API_KEY=sk-or-v1-your-key`
3. Save the file and restart the development server / Replit app.
4. Open CocoX AI and send a message. There is no API-key field on the website.

Keep `idk.env` private. It is excluded from Git by `.gitignore`; do not publish it or paste the key into frontend code. For deployment platforms that do not include local files, set the server environment variable `OPENROUTER_API_KEY` in the platform's Secrets instead. A configured environment variable takes precedence over `idk.env`.
