const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://repolens.io'

export function getWebApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RepoLens',
    url: siteUrl,
    description:
      'Analyze any GitHub repository with detailed insights into lines of code, language breakdown, commit history, and contributor statistics.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'RepoLens',
    },
  }
}

export function getRepoPageJsonLd(owner: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${owner}/${name} - Repository Stats`,
    url: `${siteUrl}/repo/${owner}/${name}`,
    description: `Detailed statistics and analytics for the ${owner}/${name} GitHub repository.`,
    isPartOf: {
      '@type': 'WebApplication',
      name: 'RepoLens',
      url: siteUrl,
    },
  }
}
