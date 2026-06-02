export type BrushMode = 'none' | 'restore' | 'erase';

export interface HistoryState {
  restoreData: string; // base64 or ImageData representation of restore mask
  eraseData: string;   // base64 or ImageData representation of erase mask
}

export type ThemeMode = 'checkerboard' | 'dark' | 'light' | 'custom';
