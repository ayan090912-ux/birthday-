import React, { useEffect, useState } from 'react'
import { SiteConfig } from '../types'

interface BirthdayHeroOverlayProps {
  config: SiteConfig
}

export const BirthdayHeroOverlay: React.FC<BirthdayHeroOverlayProps> = ({ config }) => {
  const [animReady, setAnimReady] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimReady(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <header className={`birthday-hero-overlay ${animReady ? 'is-revealed' : ''}`}>
      <div className="birthday-typography-cluster">
        {/* Main Editorial Birthday Heading with Intentional Line Breaks */}
        <h1 className="hero-editorial-title" id="main-birthday-headline">
          <span className="hero-title-prefix">HAPPY BIRTHDAY,</span>
          <span className="hero-title-name">
            ANSHIKA <span className="hero-heart-accent" aria-label="love">♡</span>
          </span>
        </h1>

        {/* Delicate Sakura Crest Divider */}
        <div className="hero-sakura-crest" aria-hidden="true">
          <span className="crest-line crest-line-left" />
          <span className="crest-blossom-petal">🌸</span>
          <span className="crest-line crest-line-right" />
        </div>

        {/* Balanced Subtitle Message */}
        <p className="hero-editorial-subtitle">
          <span className="subtitle-line">Some people make the world feel a little more</span>
          <span className="subtitle-line">beautiful just by being in it.</span>
        </p>
      </div>
    </header>
  )
}
