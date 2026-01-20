# Architecture Overview

## System Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        URL[URL Parameters]
    end

    subgraph Frontend["Frontend - Next.js 15 App Router"]
        Page[page.tsx<br/>Main Application]
        Components[React Components]
        SessionCtx[SessionProvider<br/>Auth Context]

        subgraph UI["UI Components"]
            Header[Header]
            RepoInput[RepoInput]
            StatsOverview[StatsOverview]
            LanguageBreakdown[LanguageBreakdown]
            CodeFrequency[CodeFrequencyChart]
            CommitHistory[CommitHistory]
            Contributors[ContributorsList]
            UserRepos[UserReposList]
            EmbedShare[EmbedShare Modal]
            Particles[ParticleBackground]
        end
    end

    subgraph API["API Layer - Next.js Route Handlers"]
        AuthRoute["/api/auth/[...nextauth]"<br/>NextAuth Handlers]
        RepoRoute["/api/repo"<br/>Repository Analysis]
        StatsRoute["/api/repo/stats"<br/>Stats Polling]
        UserReposRoute["/api/user/repos"<br/>User Repositories]

        subgraph Embed["Embed Image Generation"]
            EmbedStats["/api/embed/stats"]
            EmbedCodeStats["/api/embed/code-stats"]
            EmbedLangs["/api/embed/languages"]
        end
    end

    subgraph Services["Service Layer"]
        GitHubLib[lib/github.ts<br/>GitHub API Wrapper]
        AuthConfig[auth.ts<br/>NextAuth Configuration]
        Cache[In-Memory Cache<br/>10-min TTL]
    end

    subgraph External["External Services"]
        GitHubAPI[GitHub REST API<br/>via Octokit]
        GitHubOAuth[GitHub OAuth<br/>Authentication]
        Vercel[Vercel Edge Network<br/>CDN + Hosting]
    end

    Browser --> Page
    URL --> Page
    Page --> Components
    Components --> UI
    SessionCtx --> Page

    Page --> RepoRoute
    Page --> UserReposRoute
    CodeFrequency --> StatsRoute
    Page --> AuthRoute

    RepoRoute --> GitHubLib
    StatsRoute --> GitHubLib
    UserReposRoute --> GitHubLib

    AuthRoute --> AuthConfig
    AuthConfig --> GitHubOAuth

    GitHubLib --> GitHubAPI
    GitHubLib --> Cache

    Embed --> GitHubAPI
    Embed --> Vercel

    RepoRoute --> Cache
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS as Next.js App
    participant API as API Routes
    participant Cache
    participant GitHub as GitHub API

    User->>Browser: Enter repository URL
    Browser->>NextJS: Navigate / Submit form
    NextJS->>API: POST /api/repo

    alt Unauthenticated Request
        API->>Cache: Check cache
        alt Cache Hit
            Cache-->>API: Return cached data
        else Cache Miss
            API->>GitHub: Fetch repo data (60 req/hr limit)
            GitHub-->>API: Repository stats
            API->>Cache: Store result (10 min TTL)
        end
    else Authenticated Request
        API->>GitHub: Fetch repo data (5000 req/hr limit)
        GitHub-->>API: Repository stats + private repos
    end

    API-->>NextJS: Analysis results
    NextJS-->>Browser: Render visualizations

    Note over Browser,NextJS: Code frequency may need polling

    opt Stats Computing (202 response)
        Browser->>API: Poll /api/repo/stats
        API->>GitHub: Retry stats request
        GitHub-->>API: Stats ready or 202
        API-->>Browser: Data or retry signal
    end
```

## Key Architectural Decisions

### 1. Next.js 15 App Router with Server Components

I chose Next.js 15's App Router because it provides the best developer experience for a React application that needs both client-side interactivity and server-side data fetching. The App Router allows me to:

- Use React Server Components for the layout and initial data loading
- Leverage route handlers for API endpoints without a separate backend
- Take advantage of built-in optimizations like automatic code splitting
- Use the new Turbopack for faster development builds

### 2. Edge Runtime for Embed Image Generation

The embed routes (`/api/embed/*`) use the Edge runtime with `next/og` (Satori) for SVG-to-image generation. I made this choice because:

- Edge functions have lower cold start times than serverless functions
- Image generation needs to be fast for README embeds
- CDN caching at the edge reduces API calls significantly
- The 1-hour cache (`s-maxage=3600`) balances freshness with performance

### 3. In-Memory Server-Side Caching

For unauthenticated requests, I implemented a simple in-memory cache with a 10-minute TTL. This decision was made because:

- GitHub's unauthenticated rate limit is only 60 requests per hour
- Popular repositories would quickly exhaust the limit without caching
- Memory cache is simpler than Redis for a single-instance deployment
- The cache has a max size limit (100 entries) to prevent memory issues

### 4. Client-Side Authentication State with NextAuth v5

I use NextAuth v5 (Auth.js) with the GitHub provider for authentication. The access token is stored in the JWT and passed to the client session. Key reasons:

- No database required - tokens exist only in signed JWTs
- Privacy-first approach - no credentials stored server-side
- The `repo` scope allows access to private repositories
- Session data is available on both client and server

### 5. Parallel Data Fetching

In `lib/github.ts`, I fetch repository data, languages, commits, code frequency, and contributors in parallel using `Promise.all()`. This significantly reduces total request time compared to sequential fetching, though it increases API usage per request.

### 6. Progressive Enhancement for Statistics

GitHub's statistics API returns 202 when stats are still being computed. Rather than blocking the UI, I:

- Return empty data immediately and render placeholders
- Poll with exponential backoff (3s, 6s, 12s, 24s, 48s) on the client
- Use a fallback endpoint for contributors if stats aren't ready
- Show clear loading states with helpful messaging

### 7. URL-Based State Management

Repository selection is reflected in the URL (`?repo=owner/repo`). This enables:

- Shareable links to specific repository analyses
- Browser history navigation
- Bookmarkable results
- SEO benefits for public repository pages

### 8. Component-Based Visualization Architecture

Each visualization (stats, languages, commits, frequency, contributors) is a self-contained component that receives the full analysis data and extracts what it needs. This makes components reusable and testable, though it does mean passing more data than strictly necessary.
