interface Choice {
  title: string
  body: string
}

const CHOICES: Choice[] = [
  {
    title: 'GraphQL over REST',
    body: 'Commit history is fetched in a single GitHub GraphQL call instead of 51+ REST requests, keeping analysis fast and rate-limit friendly.',
  },
  {
    title: 'Validated inputs',
    body: 'Every API input is checked with Zod schemas, so malformed requests fail early with clear messages instead of corrupting results.',
  },
  {
    title: 'Privacy first',
    body: 'No credentials or repository data are ever stored. Authentication happens directly with GitHub and stats are computed on demand.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-4">How it works</h2>
      <p className="text-github-muted leading-relaxed max-w-3xl mb-8">
        RepoLens reads a repository through the GitHub API and computes its stats
        on the fly. Line totals come from commit additions and deletions across
        the fetched history; for very large repositories this covers recent
        history, so totals are a close estimate rather than a full file-by-file
        count.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {CHOICES.map((c) => (
          <div key={c.title} className="glass-card rounded-xl border border-github-border/50 p-5">
            <h3 className="font-semibold text-white mb-2">{c.title}</h3>
            <p className="text-sm text-github-muted">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
