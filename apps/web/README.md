This frontend lives inside a monorepo. On Vercel, the project root directory
must be `apps/web`.

## Getting Started

First, create `.env.local` from `.env.example` and run the development server:

```bash
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

When importing this repository on Vercel:

- set `Root Directory` to `apps/web`
- keep `Framework Preset` as `Next.js`
- set `NEXT_PUBLIC_API_URL`
- set `NEXT_PUBLIC_WS_URL`
- optionally set `NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD`

Use `.env.vercel.example` as the base for production frontend variables.
