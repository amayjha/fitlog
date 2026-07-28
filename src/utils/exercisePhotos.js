import { resizeImageFile } from "./imageResize.js";
import { getItemSync, setItem } from "../lib/storage.js";

const PHOTOS_KEY = "fitlog:exercisePhotos";
const MAX_DIM = 900;
const JPEG_QUALITY = 0.78;

const loadMap = () => {
  try { return JSON.parse(getItemSync(PHOTOS_KEY)) || {}; }
  catch { return {}; }
};

const saveMap = (map) => setItem(PHOTOS_KEY, JSON.stringify(map));

export const getExercisePhoto = (exId) => loadMap()[exId] || null;

export const saveExercisePhoto = async (exId, file) => {
  const dataUrl = await resizeImageFile(file, MAX_DIM, JPEG_QUALITY);
  const map = loadMap();
  map[exId] = dataUrl;
  try {
    await saveMap(map);
  } catch {
    throw new Error("Image too large to save — try a smaller photo");
  }
  return dataUrl;
};

export const removeExercisePhoto = (exId) => {
  const map = loadMap();
  delete map[exId];
  saveMap(map).catch(() => {});
};
