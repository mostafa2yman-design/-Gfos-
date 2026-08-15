import { PREDEFINED_COLORS } from '../types';

export const getAvailableColors = (): string[] => {
  try {
    const customColorsStr = localStorage.getItem('CUSTOM_COLORS');
    const customColors = customColorsStr ? JSON.parse(customColorsStr) : [];
    // Combine and remove duplicates
    return Array.from(new Set([...PREDEFINED_COLORS, ...customColors]));
  } catch (e) {
    return PREDEFINED_COLORS;
  }
};

export const addCustomColor = (color: string) => {
  if (!color || !color.trim()) return;
  const c = color.trim();
  const current = getAvailableColors();
  if (!current.includes(c)) {
    try {
      const customColorsStr = localStorage.getItem('CUSTOM_COLORS');
      const customColors = customColorsStr ? JSON.parse(customColorsStr) : [];
      customColors.push(c);
      localStorage.setItem('CUSTOM_COLORS', JSON.stringify(customColors));
    } catch (e) {
      console.error('Could not save custom color', e);
    }
  }
};
