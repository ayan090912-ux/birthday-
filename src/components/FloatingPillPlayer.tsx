import React, { useEffect, useState, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCw,
  Shuffle,
  Volume2,
  VolumeX,
  Music,
  X,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { PlaylistInfo, LocalTrack } from '../types'

interface FloatingPillPlayerProps {
  playlist: PlaylistInfo
}

export const FloatingPillPlayer: React.FC<FloatingPillPlayerProps> = ({ playlist }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [trackDuration, setTrackDuration] = useState<number>(playlist.tracks[0]?.duration || 225)
  const [volume, setVolume] = useState<number>(0.85)
  const [isShuffle, setIsShuffle] = useState<boolean>(false)
  const [isSpinningRefresh, setIsSpinningRefresh] = useState<boolean>(false)
  const [isChangingTrack, setIsChangingTrack] = useState<boolean>(false)
  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false)
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(false)
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [hasUserStartedPlaying, setHasUserStartedPlaying] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isSeekingRef = useRef<boolean>(false)

  const activeTrack: LocalTrack = playlist.tracks[currentTrackIndex] || playlist.tracks[0]

  // Synchronize audio volume and muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // When track changes and user has already started playing, play new track
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Update duration fallback if metadata not yet loaded
    if (activeTrack.duration) {
      setTrackDuration(activeTrack.duration)
    }

    if (hasUserStartedPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((err: any) => {
            console.warn('Playback error on track switch:', err)
            setIsPlaying(false)
            if (err.name !== 'AbortError') {
              setToastMessage(`Unable to play "${activeTrack.title}". Please verify ${activeTrack.url}`)
              setTimeout(() => setToastMessage(null), 4000)
            }
          })
      }
    }
  }, [currentTrackIndex, activeTrack, hasUserStartedPlaying])

  // HTML5 Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeekingRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration
      if (!isNaN(d) && isFinite(d) && d > 0) {
        setTrackDuration(d)
      }
    }
  }

  const handleAudioEnded = () => {
    // Automatically advance to the next song when current finishes
    handleNextTrack(true)
  }

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error event:', e)
    setIsPlaying(false)
    setToastMessage(`Could not load "${activeTrack.title}". Please ensure ${activeTrack.url} is in public/music/`)
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Select a specific track
  const selectTrack = (index: number, shouldPlay: boolean = true) => {
    setIsChangingTrack(true)
    setTimeout(() => setIsChangingTrack(false), 250)

    setCurrentTrackIndex(index)
    setCurrentTime(0)

    if (shouldPlay) {
      setHasUserStartedPlaying(true)
    }
  }

  // Next Track logic
  const handleNextTrack = (auto: boolean = false) => {
    let nextIdx: number
    if (isShuffle) {
      const remaining = playlist.tracks.map((_, i) => i).filter(i => i !== currentTrackIndex)
      nextIdx = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 0
    } else {
      nextIdx = (currentTrackIndex + 1) % playlist.tracks.length
    }
    selectTrack(nextIdx, auto || hasUserStartedPlaying || isPlaying)
  }

  // Previous Track logic
  const handlePrevTrack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }
    const prevIdx = (currentTrackIndex - 1 + playlist.tracks.length) % playlist.tracks.length
    selectTrack(prevIdx, hasUserStartedPlaying || isPlaying)
  }

  // Play / Pause Toggle
  const handlePlayToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      setHasUserStartedPlaying(true)
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err: any) {
        console.error('Audio play error:', err)
        setIsPlaying(false)
        setToastMessage(`Could not play audio: ${err.message || 'Check audio file'}`)
        setTimeout(() => setToastMessage(null), 4000)
      }
    }
  }

  // Working "Refresh Music" handler (selects unrepeated track with animation)
  const handleRefreshMusic = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSpinningRefresh(true)
    setTimeout(() => setIsSpinningRefresh(false), 600)
    handleNextTrack(true)
  }

  // Shuffle toggle
  const handleToggleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextShuffle = !isShuffle
    setIsShuffle(nextShuffle)
    setToastMessage(nextShuffle ? 'Shuffle: On 🌸' : 'Shuffle: Off')
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Seeking timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setCurrentTime(val)
    if (audioRef.current) {
      audioRef.current.currentTime = val
    }
  }

  // Volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (isMuted && val > 0) {
      setIsMuted(false)
    }
  }

  // Mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted(!isMuted)
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = trackDuration > 0 ? Math.min(100, (currentTime / trackDuration) * 100) : 0

  // Filtered tracks for drawer search
  const filteredTracks = playlist.tracks.filter(
    t =>
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <aside
      id="floating-pill-player"
      className={`reference-style-music-player ${isPlaying ? 'is-playing' : ''}`}
      aria-label="Birthday music player for Anshika"
    >
      {/* Real HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={activeTrack.url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="player-toast-notice" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Birthday Playlist Drawer */}
      {showPlaylistDrawer && (
        <div className="player-spotify-modal" role="dialog" aria-label="Anshika's Birthday Playlist">
          <div className="spotify-modal-header">
            <div className="spotify-modal-title-row">
              <span className={`spotify-indicator-dot ${isPlaying ? 'dot-active' : ''}`} />
              <span className="spotify-modal-title">
                {playlist.title} — {playlist.tracks.length} Songs Curated for Anshika
              </span>
            </div>
            <div className="spotify-modal-buttons">
              <button
                onClick={() => setShowPlaylistDrawer(false)}
                className="btn-spotify-close"
                aria-label="Close playlist modal"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="playlist-search-box">
            <Search size={13} className="playlist-search-icon" />
            <input
              type="text"
              placeholder="Search in 34 birthday songs..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="playlist-search-input"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="btn-search-clear"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Scrollable Tracklist */}
          <div className="playlist-tracks-scroll" role="list">
            {filteredTracks.map(track => {
              const originalIndex = playlist.tracks.findIndex(t => t.id === track.id)
              const isActive = originalIndex === currentTrackIndex

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    selectTrack(originalIndex, true)
                  }}
                  className={`playlist-track-row ${isActive ? 'is-active' : ''}`}
                  role="listitem"
                >
                  <div className="track-left-info">
                    <span className="track-index-num">
                      {isActive && isPlaying ? (
                        <span className="track-playing-eq">
                          <span className="eq-dot dot-1" />
                          <span className="eq-dot dot-2" />
                          <span className="eq-dot dot-3" />
                        </span>
                      ) : (
                        originalIndex + 1
                      )}
                    </span>
                    <div className="track-name-meta">
                      <span className="track-row-title">{track.title}</span>
                      <span className="track-row-artist">{track.artist}</span>
                    </div>
                  </div>
                  <span className="track-row-duration">
                    {formatTime(track.duration)}
                  </span>
                </div>
              )
            })}
            {filteredTracks.length === 0 && (
              <div className="playlist-empty-state">
                <span>No songs match "{searchFilter}"</span>
              </div>
            )}
          </div>

          <div className="spotify-modal-footer">
            <span className="spotify-footer-hint">
              ♡ Lossless local playback from public/music/ • Click any song to play
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Pill Bar */}
      <div className="reference-pill-bar">
        {/* Album Artwork Thumbnail */}
        <button
          onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
          className={`player-album-thumb ${isPlaying ? 'thumb-rotating' : ''}`}
          title="Open Playlist (34 Songs)"
          aria-label="Open Playlist (34 Songs)"
        >
          <img
            src={activeTrack.thumbnailUrl || playlist.thumbnailUrl || '/shrine-clean.jpg'}
            alt="Song artwork"
            className="thumb-image-circle"
            loading="eager"
            onError={e => {
              ;(e.target as HTMLImageElement).src = '/shrine-clean.jpg'
            }}
          />
        </button>

        {/* Current Track Information */}
        <div
          className={`player-track-info ${isChangingTrack ? 'is-changing' : ''}`}
          onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
          title="Click to view all 34 songs"
          style={{ cursor: 'pointer' }}
        >
          <span className="player-song-title">{activeTrack.title}</span>
          <span className="player-song-artist">{activeTrack.artist}</span>
        </div>

        {/* Animated Equalizer */}
        <div
          className={`mini-equalizer ${isPlaying ? 'is-dancing' : ''}`}
          aria-hidden="true"
          title={isPlaying ? 'Music playing' : 'Paused'}
        >
          <span className="eq-bar bar-1" />
          <span className="eq-bar bar-2" />
          <span className="eq-bar bar-3" />
          <span className="eq-bar bar-4" />
        </div>

        {/* Timeline Track & Timestamps */}
        <div className="player-timeline-box">
          <div className="timeline-interactive-track">
            <input
              type="range"
              min="0"
              max={trackDuration > 0 ? trackDuration : 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="player-timeline-range"
              aria-label="Seek track position"
            />
            <div className="player-timeline-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="player-timestamps">
            {formatTime(currentTime)} / {formatTime(trackDuration)}
          </span>
        </div>

        {/* Control Cluster */}
        <div className="player-control-cluster">
          {/* Refresh Music Button (Unrepeated Next Track) */}
          <button
            id="player-refresh-music-btn"
            onClick={handleRefreshMusic}
            className={`btn-player-action btn-refresh ${isSpinningRefresh ? 'is-spinning' : ''}`}
            title="Refresh / Next Song"
            aria-label="Refresh / Next Song"
          >
            <RefreshCw size={14} />
          </button>

          {/* Shuffle Button */}
          <button
            onClick={handleToggleShuffle}
            className={`btn-player-action btn-shuffle ${isShuffle ? 'active-shuffle' : ''}`}
            title={isShuffle ? 'Shuffle: On' : 'Shuffle: Off'}
            aria-label={isShuffle ? 'Disable Shuffle' : 'Enable Shuffle'}
          >
            <Shuffle size={14} />
          </button>

          {/* Previous Track */}
          <button
            onClick={handlePrevTrack}
            className="btn-player-action btn-prev"
            title="Previous song"
            aria-label="Previous song"
          >
            <SkipBack size={15} />
          </button>

          {/* Main Accent Play / Pause Button */}
          <button
            id="player-play-pause-btn"
            onClick={handlePlayToggle}
            className={`btn-player-action btn-play-pause ${isPlaying ? 'active-playing' : ''}`}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="play-icon-offset" />}
          </button>

          {/* Next Track */}
          <button
            onClick={() => handleNextTrack(false)}
            className="btn-player-action btn-next"
            title="Next song"
            aria-label="Next song"
          >
            <SkipForward size={15} />
          </button>

          {/* Volume Control */}
          <div className="player-volume-wrapper">
            <button
              onClick={handleMuteToggle}
              onMouseEnter={() => setShowVolumePopup(true)}
              className={`btn-player-action btn-vol ${isMuted ? 'muted' : ''}`}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {showVolumePopup && (
              <div
                className="volume-slider-card"
                onMouseLeave={() => setShowVolumePopup(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider-range"
                  aria-label="Volume slider"
                />
              </div>
            )}
          </div>

          {/* Playlist Drawer Toggle Button */}
          <button
            id="player-playlist-toggle"
            onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
            className={`btn-player-spotify ${showPlaylistDrawer ? 'is-active' : ''}`}
            title="View 34 Birthday Songs"
            aria-label="Toggle Playlist Drawer"
          >
            <Music size={13} />
            <span className="spotify-label">26 October 🌸</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
