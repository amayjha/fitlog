import { resizeImageFile } from "./imageResize.js";
import { getItemSync, removeItem, setItem } from "../lib/storage.js";

const BG_KEY = "fitlog:bgImage";
const MAX_DIM = 1440;
const JPEG_QUALITY = 0.82;

export const loadBgImage = () => {
  try { return getItemSync(BG_KEY); }
  catch { return null; }
};

export const clearBgImage = () => {
  removeItem(BG_KEY).catch(() => {});
};

export const saveBgImage = async (file) => {
  const dataUrl = await resizeImageFile(file, MAX_DIM, JPEG_QUALITY);
  try {
    await setItem(BG_KEY, dataUrl);
  } catch {
    throw new Error("Image too large to save — try a smaller photo");
  }
  return dataUrl;
};
