import React, { useState } from 'react'
import { initialSiteConfig, anshikaPlaylistInfo } from './data/content'
import { SiteConfig, PlaylistInfo } from './types'
import { LivingCherryBlossomWorld } from './components/LivingCherryBlossomWorld'
import { BirthdayHeroOverlay } from './components/BirthdayHeroOverlay'
import { FloatingPillPlayer } from './components/FloatingPillPlayer'

export const App: React.FC = () => {
  const [config] = useState<SiteConfig>(initialSiteConfig)
  const [playlist] = useState<PlaylistInfo>(anshikaPlaylistInfo)

  return (
    <div className="cherry-blossom-shrine-app" id="shrine-wallpaper-root">
      {/* 1. Living Multi-Layered Shrine, Moonlight, Flickering Lanterns & Sakura Petals */}
      <LivingCherryBlossomWorld />

      {/* 2. Central Editorial Birthday Typography (Upper-Middle Sky) */}
      <BirthdayHeroOverlay config={config} />

      {/* 4. Sleek Floating Music Player (Bottom-Center, connected to Anshika's Spotify Playlist) */}
      <FloatingPillPlayer playlist={playlist} />
    </div>
  )
}

export default App
