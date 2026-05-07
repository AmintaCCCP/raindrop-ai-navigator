export interface RaindropCollection {
  _id: number;
  title: string;
  count: number;
  cover: string[];
}

export interface Raindrop {
  _id: number;
  link: string;
  title: string;
  excerpt: string;
  cover: string;
  tags: string[];
  collectionId: number;
  domain: string;
}

export interface AppSettings {
  raindropApiKey: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  language: string;
}

export interface LocalBookmark extends Raindrop {
  _status?: 'unchanged' | 'modified' | 'deleted';
  _isDead?: boolean;
}

import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
});

// Collections
export const getCollections = async (settings: AppSettings): Promise<RaindropCollection[]> => {
  if (!settings.raindropApiKey) return [];
  const res = await api.get('/raindrop/collections', {
    headers: { 'X-Raindrop-Key': settings.raindropApiKey }
  });
  return res.data.items || [];
};

// Bookmarks (recursive fetch all for a collection)
export const getBookmarks = async (collectionId: number, settings: AppSettings): Promise<Raindrop[]> => {
  if (!settings.raindropApiKey) return [];
  let allBookmarks: Raindrop[] = [];
  let page = 0;
  const perpage = 50;
  
  while (true) {
    const res = await api.get(`/raindrop/bookmarks/${collectionId}`, {
      params: { page, perpage },
      headers: { 'X-Raindrop-Key': settings.raindropApiKey }
    });
    const items = res.data.items || [];
    allBookmarks = [...allBookmarks, ...items];
    if (items.length < perpage) break;
    page++;
  }
  return allBookmarks;
};

// Update Bookmark
export const updateBookmark = async (id: number, data: Partial<Raindrop>, settings: AppSettings): Promise<Raindrop> => {
  const res = await api.put(`/raindrop/bookmarks/${id}`, data, {
    headers: { 'X-Raindrop-Key': settings.raindropApiKey }
  });
  return res.data.item;
};

// Delete Bookmark
export const deleteBookmark = async (id: number, settings: AppSettings): Promise<void> => {
  await api.delete(`/raindrop/bookmarks/${id}`, {
    headers: { 'X-Raindrop-Key': settings.raindropApiKey }
  });
};

// Check Dead Link
export const checkLink = async (url: string): Promise<{ status: number; alive: boolean }> => {
  const res = await api.post('/util/check-link', { url });
  return res.data;
};

// AI Enrich
export const enrichWithAi = async (
  url: string,
  title: string,
  currentDescription: string,
  settings: AppSettings
): Promise<{ description: string; tags: string[] }> => {
  const res = await api.post('/ai/enrich', { url, title, currentDescription, settings });
  return res.data;
};
