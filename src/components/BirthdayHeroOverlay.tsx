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

        {/* Emotional Birthday Dedication Message */}
        <p className="hero-editorial-subtitle" id="birthday-personal-message">
          Thank you for being there when I was struggling to find myself. Thank you for everything, Anshika. I just want you to be happy, even if I'm not a part of your life anymore. Just keep smiling, always.&nbsp;<span className="message-heart-accent" aria-label="love">❤️</span>
        </p>
      </div>
    </header>
  )
}
