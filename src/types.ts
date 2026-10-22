export interface LocalTrack {
  id: string
  title: string
  artist: string
  url: string // Path to file inside public, e.g. '/music/Always.mp3'
  duration: number // in seconds
  thumbnailUrl?: string
}

// Backwards-compatibility alias
export type SpotifyTrack = LocalTrack

export interface PlaylistInfo {
  id: string
  title: string
  description?: string
  thumbnailUrl: string
  tracks: LocalTrack[]
}

export interface AudioTrack {
  id: string
  title: string
  artist: string
  duration: number // in seconds
  url: string
}

export interface SiteConfig {
  recipientName: string
  headlineLine1: string
  headlineLine2: string
  supportingMessage: string
  playlistTitle?: string
}

