# Project Advisor Terminal

A retro-futuristic AI project advisor that helps developers brainstorm, validate, and refine their project ideas.

## Features

### 🤖 AI Project Advisor
- Interactive conversations with Dr. Jordan Rivera, an AI project development coach
- Specialized advice based on project phase and energy levels
- Multiple advisor aspects (Validator, Focus Coach) for targeted guidance

### 💾 Message Management
- Save important conversations for future reference
- Expandable/collapsible message view
- Real-time message syncing
- Terminal-themed UI with custom scrollbars

### 🔐 Database Integration
- Supabase backend for persistent storage
- Row Level Security (RLS) for data protection
- Real-time updates using Supabase subscriptions

## Getting Started

1. Clone the repository

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Google's Gemini AI
- Supabase (Database & Real-time subscriptions)

## Database Schema

### saved_messages
- `id`: uuid (primary key)
- `content`: text
- `role`: text (user | assistant)
- `created_at`: timestamptz

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request