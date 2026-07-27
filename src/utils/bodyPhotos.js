// Progress-photo timeline — same resize-then-localStorage approach as exercisePhotos.js
// and background.js, but keyed as a list (one entry per photo) rather than a single value,
// since photos accumulate over time instead of replacing each other.
import { resizeImageFile } from "./imageResize.js";

const PHOTOS_KEY = "fitlog:bodyPhotos";
const MAX_DIM = 1080;
const JPEG_QUALITY = 0.8;

const loadPhotos = () => {
  try { return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || []; }
  catch { return []; }
};

const savePhotos = (list) => localStorage.setItem(PHOTOS_KEY, JSON.stringify(list));

// Newest first.
export const getBodyPhotos = () =>
  loadPhotos().sort((a, b) => (a.date === b.date ? b.ts - a.ts : a.date < b.date ? 1 : -1));

export const addBodyPhoto = async (file, date) => {
  const dataUrl = await resizeImageFile(file, MAX_DIM, JPEG_QUALITY);
  const list = loadPhotos();
  const entry = { id: `p${Date.now()}`, date, dataUrl, ts: Date.now() };
  list.push(entry);
  try {
    savePhotos(list);
  } catch {
    throw new Error("Image too large to save — try a smaller photo, or delete an older one");
  }
  return entry;
};

export const removeBodyPhoto = (id) => {
  savePhotos(loadPhotos().filter((p) => p.id !== id));
};
