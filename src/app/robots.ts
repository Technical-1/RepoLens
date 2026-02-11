import type { MetadataRoute } from 'next'
import { clientEnv } from '@/lib/env'

const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
