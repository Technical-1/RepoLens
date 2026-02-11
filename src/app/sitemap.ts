import type { MetadataRoute } from 'next'
import { clientEnv } from '@/lib/env'

const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
