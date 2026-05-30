'use client'

import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionNav, { ABOUT_SECTIONS } from './SectionNav'
import AboutIntro from './AboutIntro'
import HowItWorks from './HowItWorks'
import WidgetGuide from './WidgetGuide'
import FaqAccordion from './FaqAccordion'

const ParticleBackground = dynamic(
  () => import('@/components/effects/ParticleBackground'),
  { ssr: false }
)

export default function AboutContent() {
  return (
    <main className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Header />

      <div className="pt-16 relative z-10">
        <SectionNav sections={ABOUT_SECTIONS} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AboutIntro />
          <HowItWorks />
          <WidgetGuide />
          <FaqAccordion />
        </div>
      </div>

      <Footer />
    </main>
  )
}
