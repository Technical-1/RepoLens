# Technology Stack

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.0 | React framework with App Router, server components, and API routes |
| **React** | 19.0.0 | UI component library with latest concurrent features |
| **TypeScript** | 5.7.2 | Type safety and improved developer experience |
| **Tailwind CSS** | 3.4.16 | Utility-first styling with custom GitHub-inspired theme |
| **Recharts** | 2.15.0 | Interactive data visualizations for code frequency charts |
| **Lucide React** | 0.468.0 | Modern icon library with consistent design |

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.1.0 | Serverless API endpoints for repo analysis |
| **NextAuth.js (Auth.js)** | 5.0.0-beta.25 | GitHub OAuth authentication |
| **Octokit** | 21.0.2 | Official GitHub REST API client |
| **next/og (Satori)** | Built-in | SVG-to-image generation for embed widgets |

## Infrastructure & Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting with edge functions, automatic deployments |
| **Vercel Edge Network** | CDN for static assets and cached embed images |
| **GitHub OAuth** | Authentication provider |
| **GitHub API** | Data source for repository statistics |

### Vercel Configuration

- **Region**: `iad1` (US East) for optimal GitHub API latency
- **Function Duration**: 30 seconds max for API routes
- **Edge Runtime**: Used for embed image generation routes

## Key Dependencies Explained

### @octokit/rest (v21.0.2)

I chose Octokit as the GitHub API client because:

- It's the official SDK maintained by GitHub
- Provides TypeScript definitions out of the box
- Handles authentication, rate limiting headers, and pagination
- Abstracts away the complexity of the REST API

### next-auth (v5.0.0-beta.25)

I'm using the v5 beta of NextAuth (now Auth.js) because:

- Native App Router support with server-side auth checks
- Simplified configuration compared to v4
- JWT-based sessions without database dependency
- Easy access token extraction for API calls

### recharts (v2.15.0)

I selected Recharts for data visualization because:

- React-native components that integrate well with the stack
- Responsive by default with `ResponsiveContainer`
- Good documentation and TypeScript support
- Customizable tooltips and legends

### lucide-react (v0.468.0)

Lucide provides the iconography because:

- Consistent, clean design language
- Tree-shakeable - only imports icons used
- Drop-in replacement for Feather icons
- Active maintenance and regular updates

## Development Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.16.0 | Code linting with Next.js config |
| **PostCSS** | 8.4.49 | CSS processing for Tailwind |
| **Autoprefixer** | 10.4.20 | Automatic vendor prefixes |

## Runtime Requirements

- **Node.js**: >= 18.17.0 (required for Next.js 15)
- **npm**: Package management (lock file included)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App Client Secret |
| `AUTH_SECRET` | Yes | Random string for JWT signing |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for OpenGraph metadata |

## Build & Runtime

### Development

```bash
npm run dev          # Start with Turbopack
```

### Production

```bash
npm run build        # Next.js production build
npm run start        # Start production server
```

### Linting

```bash
npm run lint         # ESLint check
```

## Design System

I implemented a custom GitHub-inspired dark theme using Tailwind CSS:

```typescript
colors: {
  github: {
    dark: '#0d1117',      // Main background
    darker: '#010409',    // Darker accents
    border: '#30363d',    // Border color
    accent: '#238636',    // Primary green
    'accent-hover': '#2ea043',
    muted: '#8b949e',     // Secondary text
    link: '#58a6ff',      // Links
    text: '#c9d1d9',      // Primary text
    card: '#161b22',      // Card backgrounds
  }
}
```

### Typography

- **Sans-serif**: Inter for UI text
- **Monospace**: JetBrains Mono for code/data

### Custom CSS Features

- Glass morphism card effects with backdrop blur
- Animated gradient backgrounds
- Staggered fade-in animations for stats
- Custom scrollbar styling
- Hover lift effects on stat cards
