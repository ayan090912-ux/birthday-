import { SiteConfig, PlaylistInfo, LocalTrack } from '../types'

/**
 * Anshika's Birthday Playlist (HTML5 Local Audio Source)
 * 
 * To add more songs:
 * 1. Place your audio file (.mp3) into the `public/music/` directory (e.g. `public/music/MySong.mp3`).
 * 2. Add an entry to this `localPlaylistTracks` array with its title, artist, duration, and URL path `/music/MySong.mp3`.
 */
export const localPlaylistTracks: LocalTrack[] = [
  {
    id: 'track-1',
    title: 'Always',
    artist: 'Daniel Caesar',
    url: '/music/Always.mp3',
    duration: 225
  },
  {
    id: 'track-2',
    title: 'Love Me Harder',
    artist: 'Ariana Grande, The Weeknd',
    url: '/music/Love Me Harder.mp3',
    duration: 236
  },
  {
    id: 'track-3',
    title: 'Co2',
    artist: 'Prateek Kuhad',
    url: '/music/Co2.mp3',
    duration: 164
  },
  {
    id: 'track-4',
    title: 'Choo Lo',
    artist: 'The Local Train',
    url: '/music/Choo Lo.mp3',
    duration: 234
  },
  {
    id: 'track-5',
    title: 'Baarishein',
    artist: 'Anuv Jain',
    url: '/music/Baarishein.mp3',
    duration: 207
  },
  {
    id: 'track-6',
    title: 'Kasoor',
    artist: 'Prateek Kuhad',
    url: '/music/Kasoor.mp3',
    duration: 198
  },
  {
    id: 'track-7',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    url: '/music/Jo Tum Mere Ho.mp3',
    duration: 252
  },
  {
    id: 'track-8',
    title: 'Make You Mine',
    artist: 'PUBLIC',
    url: '/music/Make You Mine.mp3',
    duration: 233
  },
  {
    id: 'track-9',
    title: 'We Don’t Talk Anymore',
    artist: 'Charlie Puth, Selena Gomez',
    url: '/music/We Don’t Talk Anymore.mp3',
    duration: 218
  },
  {
    id: 'track-10',
    title: 'Die For You',
    artist: 'The Weeknd',
    url: '/music/Die For You.mp3',
    duration: 260
  },
  {
    id: 'track-11',
    title: 'White Ferrari',
    artist: 'Frank Ocean',
    url: '/music/White Ferrari.mp3',
    duration: 249
  },
  {
    id: 'track-12',
    title: 'Ivy',
    artist: 'Frank Ocean',
    url: '/music/Ivy.mp3',
    duration: 249
  },
  {
    id: 'track-13',
    title: 'Awaaz',
    artist: 'Kamal Khan',
    url: '/music/Awaaz.mp3',
    duration: 283
  },
  {
    id: 'track-14',
    title: 'Jaavedaan Hai',
    artist: "KK, Suzanne D'Mello",
    url: '/music/Jaavedaan Hai.mp3',
    duration: 346
  },
  {
    id: 'track-15',
    title: 'Reflections',
    artist: 'The Neighbourhood',
    url: '/music/Reflections.mp3',
    duration: 244
  },
  {
    id: 'track-16',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    url: '/music/Sweater Weather.mp3',
    duration: 240
  },
  {
    id: 'track-17',
    title: 'Fallen Star',
    artist: 'The Neighbourhood',
    url: '/music/Fallen Star.mp3',
    duration: 225
  },
  {
    id: 'track-18',
    title: 'Leather Weather',
    artist: 'The Neighbourhood',
    url: '/music/Leather Weather.mp3',
    duration: 177
  },
  {
    id: 'track-19',
    title: 'Tera Ban Jaunga',
    artist: 'Akhil Sachdeva, Tulsi Kumar',
    url: '/music/Tera Ban Jaunga.mp3',
    duration: 236
  },
  {
    id: 'track-20',
    title: 'Pehla Pyaar',
    artist: 'Armaan Malik, Vishal Mishra',
    url: '/music/Pehla Pyaar.mp3',
    duration: 273
  },
  {
    id: 'track-21',
    title: 'Pehle Bhi Main',
    artist: 'Vishal Mishra, Raj Shekhar',
    url: '/music/Pehle Bhi Main.mp3',
    duration: 250
  },
  {
    id: 'track-22',
    title: 'Mera Pehla Pehla Pyaar',
    artist: 'KK',
    url: '/music/Mera Pehla Pehla Pyaar.mp3',
    duration: 271
  },
  {
    id: 'track-23',
    title: 'Dil Aaj Kal',
    artist: 'Ram Sampath, KK',
    url: '/music/Dil Aaj Kal.mp3',
    duration: 322
  },
  {
    id: 'track-24',
    title: 'O Sanam',
    artist: 'Lucky Ali',
    url: '/music/O Sanam.mp3',
    duration: 223
  },
  {
    id: 'track-25',
    title: 'Bairan',
    artist: 'Banjaare',
    url: '/music/Bairan.mp3',
    duration: 151
  },
  {
    id: 'track-26',
    title: 'Sheesha',
    artist: 'Mitta Ror, Swara Verma',
    url: '/music/Sheesha.mp3',
    duration: 196
  },
  {
    id: 'track-27',
    title: 'Tu Na Samjhe',
    artist: 'Hellow Raja, MaxxTurnn',
    url: '/music/Tu Na Samjhe.mp3',
    duration: 150
  },
  {
    id: 'track-28',
    title: 'Barsaat',
    artist: 'Banjaare, Roni',
    url: '/music/Barsaat.mp3',
    duration: 185
  },
  {
    id: 'track-29',
    title: 'Feelings',
    artist: 'Sumit Goswami',
    url: '/music/Feelings.mp3',
    duration: 225
  },
  {
    id: 'track-30',
    title: 'Nazra Ke Teer',
    artist: 'Vikram Sarkar, Guri Nimana',
    url: '/music/Nazra Ke Teer.mp3',
    duration: 210
  },
  {
    id: 'track-31',
    title: 'Khaab',
    artist: 'Akhil',
    url: '/music/Khaab.mp3',
    duration: 202
  },
  {
    id: 'track-32',
    title: 'Deewane',
    artist: 'Navaan Sandhu, Bir, Daaku',
    url: '/music/Deewane.mp3',
    duration: 207
  },
  {
    id: 'track-33',
    title: 'Kalla Sohna Nai',
    artist: 'Akhil',
    url: '/music/Kalla Sohna Nai.mp3',
    duration: 157
  },
  {
    id: 'track-34',
    title: 'Sohne Lagde',
    artist: 'Sidhu Moose Wala, The PropheC',
    url: '/music/Sohne Lagde.mp3',
    duration: 205
  }
]

// Backwards-compatibility alias
export const anshikaPlaylistTracks = localPlaylistTracks

export const anshikaPlaylistInfo: PlaylistInfo = {
  id: '26-october-anshika',
  title: '26 October ♡',
  description: 'Songs curated with love for Anshika',
  thumbnailUrl: '/shrine-clean.jpg',
  tracks: localPlaylistTracks
}

export const initialSiteConfig: SiteConfig = {
  recipientName: 'Anshika',
  headlineLine1: 'HAPPY BIRTHDAY,',
  headlineLine2: 'ANSHIKA ♡',
  supportingMessage: 'Some people make the world feel a little more beautiful just by being in it.',
  playlistTitle: '26 October ♡'
}
