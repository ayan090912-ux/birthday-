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
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <header className={`birthday-hero-overlay ${animReady ? 'is-revealed' : ''}`}>
      <div className="birthday-typography-cluster">
        {/* Single Main Heading */}
        <h1 className="hero-editorial-title" id="main-birthday-headline">
          HAPPY BIRTHDAY, ANSHIKA ♡
        </h1>

        {/* Delicate Sakura Divider Accent */}
        <div className="hero-sakura-crest" aria-hidden="true">
          <span className="crest-line" />
          <svg
            className="sakura-crest-svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M12 2C12.5 5 14 6 16.5 6C14.5 7.5 14 9.5 15 12C12.5 11 11 11 9 12C10 9.5 9.5 7.5 7.5 6C10 6 11.5 5 12 2Z" />
            <circle cx="12" cy="7.5" r="1.5" fill="#FFE4EF" />
          </svg>
          <span className="crest-line" />
        </div>

        {/* Single Supporting Message */}
        <p className="hero-editorial-subtitle">
          {config.supportingMessage}
        </p>
      </div>
    </header>
  )
}
