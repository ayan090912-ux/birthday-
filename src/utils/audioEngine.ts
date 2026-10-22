// Romantic Ambient & Piano Audio Synthesizer Engine
// Built using Web Audio API to guarantee 100% playable romantic music without external link dependencies,
// with full support for external MP3s and real-time frequency visualizer.

class RomanticAudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private masterGain: GainNode | null = null
  private isPlaying: boolean = false
  private isMuted: boolean = false
  private currentVolume: number = 0.75
  private timerId: number | null = null
  private audioEl: HTMLAudioElement | null = null
  private currentTrackType: 'synth' | 'mp3' = 'synth'
  private synthPreset: 'romantic' | 'celestial' | 'lullaby' = 'romantic'
  private stepIndex: number = 0
  private listeners: Set<() => void> = new Set()
  public currentTime: number = 0
  public duration: number = 200

  constructor() {
    // Lazy initialize on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioContextClass()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 64
      this.analyser.smoothingTimeConstant = 0.8

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime)

      this.masterGain.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb())
  }

  // Musical scales for romantic chord progressions (Cmaj9, Am9, Fmaj7, Gsus4 -> G7)
  private getProgression(preset: 'romantic' | 'celestial' | 'lullaby') {
    if (preset === 'celestial') {
      // Ethereal night sky chords (F#m, Dmaj7, A, E)
      return [
        { bass: 146.83, chord: [220.00, 277.18, 369.99, 440.00] }, // Dmaj7
        { bass: 110.00, chord: [220.00, 277.18, 329.63, 440.00] }, // A
        { bass: 164.81, chord: [246.94, 329.63, 392.00, 493.88] }, // Em7
        { bass: 185.00, chord: [277.18, 369.99, 440.00, 554.37] }  // F#m7
      ]
    } else if (preset === 'lullaby') {
      // Warm nostalgic waltz (C, G/B, Am, F)
      return [
        { bass: 130.81, chord: [261.63, 329.63, 392.00, 523.25] }, // C
        { bass: 123.47, chord: [246.94, 293.66, 392.00, 493.88] }, // G/B
        { bass: 110.00, chord: [220.00, 261.63, 329.63, 440.00] }, // Am
        { bass: 87.31, chord: [220.00, 261.63, 349.23, 440.00] }   // F
      ]
    } else {
      // Romantic Serenade: Cmaj7, Am7, Fmaj7, G7add9
      return [
        { bass: 130.81, chord: [261.63, 329.63, 392.00, 493.88] }, // Cmaj7
        { bass: 110.00, chord: [220.00, 261.63, 329.63, 392.00] }, // Am7
        { bass: 87.31, chord: [220.00, 261.63, 349.23, 440.00] },  // Fmaj7
        { bass: 98.00, chord: [246.94, 293.66, 392.00, 440.00] }   // Gadd9
      ]
    }
  }

  private playTone(freq: number, startTime: number, duration: number, type: OscillatorType = 'triangle', gainVal: number = 0.12) {
    if (!this.ctx || !this.masterGain) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    // Gentle lowpass filter for warm analog cassette feel
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, startTime)
    filter.Q.setValueAtTime(1.5, startTime)

    // Smooth envelope attack and decay
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(gainVal * 0.4, startTime + 0.4)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.1)
  }

  private triggerSynthBeat() {
    if (!this.ctx || !this.isPlaying) return

    const progression = this.getProgression(this.synthPreset)
    const currentChordIndex = Math.floor(this.stepIndex / 4) % progression.length
    const beatInChord = this.stepIndex % 4
    const chordData = progression[currentChordIndex]

    const now = this.ctx.currentTime

    // Bass note on first beat
    if (beatInChord === 0) {
      this.playTone(chordData.bass, now, 2.4, 'sine', 0.22)
    }

    // Gentle piano arpeggio note
    const chordNoteFreq = chordData.chord[beatInChord % chordData.chord.length]
    this.playTone(chordNoteFreq, now, 1.6, 'triangle', 0.14)

    // Soft celestial chime overtone
    if (beatInChord === 0 || beatInChord === 2) {
      const chimeFreq = chordData.chord[(beatInChord + 2) % chordData.chord.length] * 2
      this.playTone(chimeFreq, now + 0.2, 1.2, 'sine', 0.04)
    }

    this.stepIndex++
    this.currentTime = (this.currentTime + 0.75) % this.duration
    this.notify()
  }

  public play(trackType: 'synth' | 'mp3' = 'synth', preset: 'romantic' | 'celestial' | 'lullaby' = 'romantic', mp3Url?: string) {
    this.initContext()
    this.currentTrackType = trackType
    this.synthPreset = preset
    this.isPlaying = true

    if (trackType === 'mp3' && mp3Url) {
      if (!this.audioEl) {
        this.audioEl = new Audio()
        this.audioEl.crossOrigin = 'anonymous'
        if (this.ctx && this.masterGain) {
          try {
            const source = this.ctx.createMediaElementSource(this.audioEl)
            source.connect(this.masterGain)
          } catch (e) {
            console.warn('Audio element source already connected or cors issue', e)
          }
        }
      }
      this.audioEl.src = mp3Url
      this.audioEl.play().catch(e => console.warn('Audio play restricted:', e))
    } else {
      if (this.audioEl) {
        this.audioEl.pause()
      }
      if (this.timerId !== null) {
        window.clearInterval(this.timerId)
      }
      // Trigger immediately then interval
      this.triggerSynthBeat()
      this.timerId = window.setInterval(() => {
        this.triggerSynthBeat()
      }, 750)
    }

    this.notify()
  }

  public pause() {
    this.isPlaying = false
    if (this.timerId !== null) {
      window.clearInterval(this.timerId)
      this.timerId = null
    }
    if (this.audioEl) {
      this.audioEl.pause()
    }
    this.notify()
  }

  public togglePlay(trackType: 'synth' | 'mp3' = 'synth', preset: 'romantic' | 'celestial' | 'lullaby' = 'romantic', mp3Url?: string) {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play(trackType, preset, mp3Url)
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime)
    }
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.currentVolume
    }
    this.notify()
  }

  public toggleMute() {
    this.isMuted = !this.isMuted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime)
    }
    if (this.audioEl) {
      this.audioEl.muted = this.isMuted
    }
    this.notify()
  }

  public getVisualizerData(): number[] {
    if (!this.analyser || !this.isPlaying) {
      return [12, 18, 14, 22, 16, 20, 10, 15] // idle gentle heights
    }
    const buffer = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(buffer)
    // Extract 8 representative bands
    const result: number[] = []
    const step = Math.floor(buffer.length / 8) || 1
    for (let i = 0; i < 8; i++) {
      const val = buffer[i * step] || 0
      // scale to percentage 15% - 95%
      result.push(Math.max(15, Math.min(95, Math.round((val / 255) * 80 + 15))))
    }
    return result
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds))
    this.stepIndex = Math.floor(this.currentTime / 0.75)
    this.notify()
  }

  public getIsPlaying() {
    return this.isPlaying
  }

  public getIsMuted() {
    return this.isMuted
  }

  public getVolume() {
    return this.currentVolume
  }
}

export const audioEngine = new RomanticAudioEngine()
