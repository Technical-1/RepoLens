# RepoLens - GitHub Repository Stats Analyzer

A modern, Vercel-ready web application that analyzes any GitHub repository and provides detailed statistics including lines of code, language breakdown, commit history, and contributor information.

![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![React 19](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **📊 Repository Statistics**: Total lines of code, additions, deletions, stars, forks, and more
- **🌈 Language Breakdown**: Visual breakdown of all programming languages used with percentages
- **📝 Commit History**: Detailed commit log with author info, changes, and timestamps
- **📈 Code Frequency Chart**: Interactive visualization of code changes over time
- **👥 Contributors List**: Top contributors with their contribution stats
- **🔐 GitHub OAuth**: Sign in to access private repositories and higher API limits
- **🛡️ Privacy First**: No credentials stored - all auth happens directly with GitHub

## Privacy & Security

**Your data is never stored.** This application:

- Uses GitHub OAuth for secure authentication
- Never saves login credentials or access tokens to any database
- Tokens exist only in your browser session
- All API calls go directly to GitHub
- Sign out anytime to revoke access

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A GitHub account
- A GitHub OAuth App (instructions below)

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the details:
   - **Application name**: RepoLens (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd github-stats-app
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

## Deploying to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo-url)

### Manual Deploy

1. Push your code to GitHub
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in Vercel:
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `AUTH_SECRET`
4. **Update your GitHub OAuth App** callback URL to:
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback/github
   ```

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Authentication**: [Auth.js v5](https://authjs.dev/) (NextAuth)
- **GitHub API**: [@octokit/rest](https://github.com/octokit/rest.js)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/)

## API Rate Limits

| Authentication | Rate Limit |
|---------------|------------|
| Unauthenticated | 60 requests/hour |
| Authenticated (OAuth) | 5,000 requests/hour |
| GitHub Enterprise | 15,000 requests/hour |

Sign in with GitHub to get higher rate limits for analyzing large repositories.

## Project Structure

```
github-stats-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Auth handlers
│   │   │   ├── repo/route.ts                # Repo analysis endpoint
│   │   │   └── user/repos/route.ts          # User repos endpoint
│   │   ├── globals.css                      # Global styles
│   │   ├── layout.tsx                       # Root layout
│   │   └── page.tsx                         # Main page
│   ├── components/
│   │   ├── Header.tsx                       # Navigation header
│   │   ├── RepoInput.tsx                    # URL input form
│   │   ├── StatsOverview.tsx                # Stats cards
│   │   ├── LanguageBreakdown.tsx            # Language chart
│   │   ├── CommitHistory.tsx                # Commit list
│   │   ├── CodeFrequencyChart.tsx           # Line chart
│   │   ├── ContributorsList.tsx             # Contributors
│   │   ├── UserReposList.tsx                # User's repos
│   │   └── PrivacyNotice.tsx                # Privacy info
│   ├── lib/
│   │   └── github.ts                        # GitHub API utilities
│   ├── types/
│   │   └── index.ts                         # TypeScript types
│   └── auth.ts                              # Auth configuration
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── vercel.json
```

## Limitations

- **10,000 commit limit**: GitHub's statistics API doesn't work for repos with 10,000+ commits
- **Rate limiting**: Heavy use may hit GitHub API limits (sign in for higher limits)
- **Stats computation**: Some statistics may take time to compute for new/updated repos

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with ❤️ using Next.js 15 and the GitHub API
