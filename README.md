# .mapr

A mind mapping app like Miro. But Miro does not support adding videos directly, so I made my own version of it.

Hosted [here](https://mapr-one.vercel.app/).

<img width="1320" height="965" alt="mapr" src="https://github.com/user-attachments/assets/78666be8-88f0-4247-a6b3-a1343a67ddd0" />

## Setup

- Install Vercel CLI: `bun add -d vercel`
- Login: `vercel login`
- Link your project: `vercel link`
- Create `.env` file with: `OPENAI_API_KEY=your_key_here`
- Run `vercel dev` in one terminal (starts API functions on port 3000)
- Run `bun run dev` in another terminal (starts Vite dev server)

The API endpoint is automatically proxied in development via Vite's proxy configuration.
