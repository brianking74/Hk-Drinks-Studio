'use client'

import { create } from 'zustand'

export type PlatformId = 'facebook' | 'instagram'

export interface DraftPost {
  imageUrl: string | null
  filename: string | null
  caption: string
  hashtags: string
  platforms: PlatformId[]
  brandVoice: string
  extraContext: string
}

interface PostStore {
  draft: DraftPost
  isUploading: boolean
  isGenerating: boolean
  isPublishing: boolean
  imageUrl: string | null
  setImage: (url: string, filename: string) => void
  setCaption: (caption: string) => void
  setHashtags: (hashtags: string) => void
  togglePlatform: (p: PlatformId) => void
  setBrandVoice: (v: string) => void
  setExtraContext: (v: string) => void
  reset: () => void
  setUploading: (b: boolean) => void
  setGenerating: (b: boolean) => void
  setPublishing: (b: boolean) => void
}

const emptyDraft: DraftPost = {
  imageUrl: null,
  filename: null,
  caption: '',
  hashtags: '',
  // Default to FB only — IG is currently unavailable for this account.
  // Users can still toggle IG on manually if they want to attempt a publish
  // (e.g. after they switch to a fresh IG Business account in the future).
  platforms: ['facebook'],
  brandVoice: '',
  extraContext: '',
}

export const usePostStore = create<PostStore>((set) => ({
  draft: emptyDraft,
  isUploading: false,
  isGenerating: false,
  isPublishing: false,
  imageUrl: null,
  setImage: (url, filename) =>
    set((s) => ({
      imageUrl: url,
      draft: { ...s.draft, imageUrl: url, filename },
    })),
  setCaption: (caption) =>
    set((s) => ({ draft: { ...s.draft, caption } })),
  setHashtags: (hashtags) =>
    set((s) => ({ draft: { ...s.draft, hashtags } })),
  togglePlatform: (p) =>
    set((s) => {
      const has = s.draft.platforms.includes(p)
      return {
        draft: {
          ...s.draft,
          platforms: has
            ? s.draft.platforms.filter((x) => x !== p)
            : [...s.draft.platforms, p],
        },
      }
    }),
  setBrandVoice: (brandVoice) => set((s) => ({ draft: { ...s.draft, brandVoice } })),
  setExtraContext: (extraContext) =>
    set((s) => ({ draft: { ...s.draft, extraContext } })),
  reset: () => set({ draft: emptyDraft, imageUrl: null }),
  setUploading: (isUploading) => set({ isUploading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setPublishing: (isPublishing) => set({ isPublishing }),
}))
