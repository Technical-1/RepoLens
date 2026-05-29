import type { Metadata } from 'next'
import RepoPageClient from './RepoPageClient'
import { getRepoPageJsonLd, safeJsonLd } from '@/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://repolens.io'

interface RepoPageProps {
  params: Promise<{
    owner: string
    name: string
  }>
}

export async function generateMetadata({ params }: RepoPageProps): Promise<Metadata> {
  const { owner, name } = await params

  return {
    title: `${owner}/${name} - Repository Stats`,
    description: `Detailed statistics and analytics for the ${owner}/${name} GitHub repository — lines of code, language breakdown, commit history, and contributors.`,
    alternates: {
      canonical: `/repo/${owner}/${name}`,
    },
    openGraph: {
      title: `${owner}/${name} - Repository Stats | RepoLens`,
      description: `Analyze ${owner}/${name} on GitHub — lines of code, languages, commits, and contributors.`,
      url: `${siteUrl}/repo/${owner}/${name}`,
    },
  }
}

export default async function RepoPage({ params }: RepoPageProps) {
  const { owner, name } = await params
  const jsonLd = getRepoPageJsonLd(owner, name)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <RepoPageClient owner={owner} name={name} />
    </>
  )
}
