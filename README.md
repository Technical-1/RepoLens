# RepoLens - GitHub Repository Stats Analyzer

---

Analyze GitHub repositories with beautiful visualizations. View language breakdowns, commit history, code frequency, contributors, and generate embeddable stats widgets for your README.

![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![React 19](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **Repository Statistics**: Total lines of code, additions, deletions, stars, forks, and more
- **Language Breakdown**: Visual breakdown of all programming languages used with percentages
- **Commit History**: Detailed commit log with author info, changes, and timestamps
- **Code Frequency Chart**: Interactive visualization of code changes over time
- **Contributors List**: Top contributors with their contribution stats
- **Embeddable Widgets**: Generate SVG images for your README to showcase repo stats
- **GitHub OAuth**: Sign in to access private repositories and higher API limits
- **Privacy First**: No credentials stored - all auth happens directly with GitHub

## Embeddable Widgets

RepoLens generates beautiful SVG widgets you can embed directly in your GitHub README. Available widgets:

### Stats Overview
Shows stars, forks, watchers, and open issues.
```markdown
![Stats](https://repolens.io/api/embed/stats?owner=OWNER&repo=REPO)
```

### Language Breakdown
Displays the top programming languages used in the repository.
```markdown
![Languages](https://repolens.io/api/embed/languages?owner=OWNER&repo=REPO)
```

### Code Statistics
Shows total lines, lines added, lines removed, and commit count.
```markdown
![Code Stats](https://repolens.io/api/embed/code-stats?owner=OWNER&repo=REPO)
```

### Customization
All widgets support a `theme` parameter:
- `?theme=dark` (default) - Dark background
- `?theme=light` - Light background

Example with light theme:
```markdown
![Stats](https://repolens.io/api/embed/stats?owner=facebook&repo=react&theme=light)
```

Widgets are cached for 1 hour on CDN to ensure fast loading and reduce API usage.

## Privacy & Security

**Your data is never stored.** This application:

- Uses GitHub OAuth for secure authentication
- Never saves login credentials or access tokens to any database
- Tokens exist only in your browser session
- All API calls go directly to GitHub
- Sign out anytime to revoke access

## Host It Yourself

### Prerequisites

- Node.js 18.17 or later
- A GitHub account
- A GitHub OAuth App (instructions below)

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" then "New OAuth App"
3. Fill in the details:
   - **Application name**: RepoLens (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

### 2. Clone and Install

```bash
git clone https://github.com/Technical-1/RepoLens.git
cd repolens
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
AUTH_SECRET=your_random_secret_here
```

Generate `AUTH_SECRET` with:
```bash
openssl rand -base64 32
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying

You can deploy RepoLens to any hosting service that supports Next.js, including Vercel, Netlify, Railway, Render, or your own server.

**Example: Deploying to Vercel**

1. Push your code to GitHub
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables:
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `AUTH_SECRET`
4. Update your GitHub OAuth App callback URL to:
   ```
   https://your-domain.com/api/auth/callback/github
   ```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Next.js 15](https://nextjs.org/) with App Router |
| UI Library | [React 19](https://react.dev/) |
| Authentication | [Auth.js v5](https://authjs.dev/) (NextAuth) |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| Styling | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Language | [TypeScript 5.7](https://www.typescriptlang.org/) |
| Image Generation | [next/og](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) (Satori) |

## API Rate Limits

| Authentication | Rate Limit | Caching |
|----------------|------------|---------|
| Unauthenticated | 60 requests/hour | 10-minute server cache |
| Authenticated (OAuth) | 5,000 requests/hour | No server cache |
| Embed Widgets | Uses unauthenticated | 1-hour CDN cache |

Sign in with GitHub to get higher rate limits for analyzing large repositories.

**Caching Strategy:**
- Unauthenticated requests are cached server-side for 10 minutes to reduce API pressure
- Embed widgets are cached at the CDN edge for 1 hour
- User repository lists are cached client-side for 5 minutes
- Code frequency polling uses exponential backoff (3s, 6s, 12s, 24s, 48s) to avoid rate limits

## Project Structure

```
repolens/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Auth handlers
│   │   │   ├── embed/
│   │   │   │   ├── stats/route.tsx          # Stats widget image
│   │   │   │   ├── languages/route.tsx      # Languages widget image
│   │   │   │   └── code-stats/route.tsx     # Code stats widget image
│   │   │   ├── repo/
│   │   │   │   ├── route.ts                 # Main repo analysis
│   │   │   │   └── stats/route.ts           # Stats polling endpoint
│   │   │   └── user/repos/route.ts          # User repos endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── RepoInput.tsx
│   │   ├── StatsOverview.tsx
│   │   ├── LanguageBreakdown.tsx
│   │   ├── CommitHistory.tsx
│   │   ├── CodeFrequencyChart.tsx
│   │   ├── ContributorsList.tsx
│   │   ├── UserReposList.tsx
│   │   ├── EmbedShare.tsx
│   │   ├── ParticleBackground.tsx
│   │   └── PrivacyNotice.tsx
│   ├── lib/
│   │   └── github.ts
│   ├── types/
│   │   └── index.ts
│   └── auth.ts
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── vercel.json
```

## Limitations

- **10,000 commit limit**: GitHub's statistics API doesn't work for repos with 10,000+ commits
- **Rate limiting**: Heavy use may hit GitHub API limits (sign in for higher limits)
- **Stats computation**: Some statistics may take time to compute for new/updated repos
- **Embed widgets**: Only works for public repositories

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is available for personal use only. Commercial use is not permitted without explicit permission.

---

Built with Next.js 15 and the GitHub API
