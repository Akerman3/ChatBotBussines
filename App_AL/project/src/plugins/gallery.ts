// src/plugins/gallery.ts
import { registerPlugin } from "@capacitor/core";

export interface SaveImageOptions {
  base64Data: string; // SIN el "data:image/jpeg;base64,"
  fileName?: string;
}

export interface SaveImageResult {
  uri: string; // URI que devuelve MediaStore, por si lo quieres usar
}

export interface GalleryPlugin {
  saveImageToGallery(options: SaveImageOptions): Promise<SaveImageResult>;
}

export const Gallery = registerPlugin<GalleryPlugin>("Gallery");
