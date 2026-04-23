# Skrivla

<a href="https://luvabase.com/?url=https://github.com/simonbengtsson/skrivla"><img src="https://luvabase.com/deploy.svg" alt="Deploy to Luvabase"/></a>
<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/simonbengtsson/skrivla"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

🌎 Just share a link and instantly write together. No login needed.<br>
🎨 Rich text editing and Markdown shortcuts.<br>
❤️ Free forever, open source, self-hostable on Luvabase and Cloudflare.<br>

![Screenshot of Skrivla](/public/screenshot.png)

## What is Skrivla?

Skrivla is your self-hostable collaborative editor. Think Google Docs, but specically built for quick brainstorming sessions, meeting notes etc. Just share a link to a page and anyone can collaborate on it.

## Getting started

The easiest way to use Skrivla is to [install it on Luvabase](https://luvabase.com/?url=https://github.com/simonbengtsson/skrivla). On Luvabase authentication is managed for you.

You can also [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/simonbengtsson/skrivla) and protect your Skrivla instance with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/security/secure-with-access).

## Stack

Skrivla is built as a SPA with light server api and persistance layer on Cloudflare Durable Objects.

- Server: Cloudflare Durable Objects and Worker
- Client: Shadcn, tanstack router, vite, tailwind
- Rich text editing with [Tiptap](http://tiptap.dev)

## Contributions

Very much welcome! The goal is to keep editor minimal, but below are some examples of what would be in scope:

- Attachments
- Agent integration in editor (with Workers AI)
- MCP server for finding and reading documents
- A small desktop sync application to sync pages to a local folder for easier access by local agents
- Page pinning or otherways to improve sidebar for many pages
