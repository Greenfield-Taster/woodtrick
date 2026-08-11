export interface SocialAccount {
  id: 'instagram' | 'facebook' | 'twitter' | 'youtube'
  name: string
  handle: string
  url: string
  followers: string
}

export const SOCIAL: SocialAccount[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@unidragon_com',
    url: 'https://www.instagram.com/unidragon_com/',
    followers: '113k',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: '@UnidragonPuzzle',
    url: 'https://www.facebook.com/UnidragonPuzzle',
    followers: '31k',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    handle: '@unidragon_com',
    url: 'https://x.com/unidragon_com',
    followers: '1.29k',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@unidragon8152',
    url: 'https://www.youtube.com/@unidragon8152',
    followers: '1.55k',
  },
]
