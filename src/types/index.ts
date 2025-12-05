export interface RepoStats {
  name: string
  fullName: string
  description: string | null
  url: string
  stars: number
  forks: number
  watchers: number
  openIssues: number
  defaultBranch: string
  createdAt: string
  updatedAt: string
  pushedAt: string
  size: number
  private: boolean
}

export interface LanguageStats {
  [language: string]: number
}

export interface CommitStats {
  sha: string
  message: string
  author: string
  authorAvatar: string
  date: string
  additions: number
  deletions: number
  files: number
}

export interface CodeFrequency {
  week: number
  additions: number
  deletions: number
}

export interface ContributorStats {
  author: string
  avatar: string
  total: number
  weeks: {
    week: number
    additions: number
    deletions: number
    commits: number
  }[]
}

export interface FullRepoAnalysis {
  repo: RepoStats
  languages: LanguageStats
  totalLines: number
  languagePercentages: { name: string; bytes: number; percentage: number; color: string }[]
  commits: CommitStats[]
  codeFrequency: CodeFrequency[]
  contributors: ContributorStats[]
  totalAdditions: number
  totalDeletions: number
  isPrivate: boolean
  requiresAuth: boolean
}

export interface UserRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  stars: number
  private: boolean
  language: string | null
  updatedAt: string
}

// Language colors from GitHub
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00B4AB',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Erlang: '#B83998',
  Julia: '#a270ba',
  MATLAB: '#e16737',
  Assembly: '#6E4C13',
  Vim: '#199f4b',
  Markdown: '#083fa1',
  JSON: '#292929',
  YAML: '#cb171e',
  XML: '#0060ac',
  SQL: '#e38c00',
  GraphQL: '#e10098',
  Jupyter: '#DA5B0B',
  default: '#8b949e',
}
