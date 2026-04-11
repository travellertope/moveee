# Moveee Platform 

The Moveee is a curated editorial platform and culture hub, built with a modern headless architecture. It combines the power of WordPress as a content engine with a high-performance, aesthetically-rich Next.js frontend.

## 🚀 Architecture

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
- **Backend**: Headless WordPress ([themoveee.com](https://themoveee.com))
- **Data Fetching**: WPGraphQL + Apollo (or native fetch with revalidation)
- **Infrastructure**: Vercel (Edge-ready)

## ✨ Design Philosophy

The platform utilizes a **"Paper & Ink"** aesthetic:
- **Paper**: Soft, textured backgrounds (`#f3ece0`)
- **Ink**: Deep, high-contrast typography (`#14110d`)
- **Accent**: Ochre (`#c5491f`) for cultural highlights
- **Typography**: Editorial-grade serif paired with clean sans-serif for a premium magazine feel.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/travellertope/moveee.git
   cd moveee
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file based on `.env.example`:
   ```env
   NEXT_PUBLIC_WORDPRESS_API_URL=https://themoveee.com/graphql
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

Build the production bundle:
```bash
npm run build
```

## 📦 Project Structure

- `/app`: Next.js App Router (Layouts, Pages, Styles)
- `/components`: Reusable UI components (Hero, Footer, Ticker, etc.)
- `/lib`: Utility functions and API integration (WPGraphQL handlers)
- `/public`: Static assets (Logos, textures)

## 📡 Deployment

This project is optimized for **Vercel**. 

### Vercel Configuration (Mandatory)
If you encounter a `getaddrinfo ENOTFOUND cms.themoveee.com` error during build, it is because Vercel has an incorrect environment variable. 
1. Go to **Settings > Environment Variables** in Vercel.
2. Ensure `NEXT_PUBLIC_WORDPRESS_API_URL` is set to exactly: `https://themoveee.com/graphql`.
3. Do **NOT** use `cms.themoveee.com`.

- **Middleware**: Uses `proxy.ts` (Next.js 16 edge convention) for request handling.
- **ISR**: Pages are revalidated every hour to ensure editorial content is fresh without sacrifice to performance.

## 📄 License

© 2026 The Moveee. All rights reserved..
