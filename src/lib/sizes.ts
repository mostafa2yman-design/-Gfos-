import { PREDEFINED_SIZES } from '../types';

export const getAvailableSizes = (): string[] => {
  try {
    const customSizesStr = localStorage.getItem('CUSTOM_SIZES');
    const customSizes = customSizesStr ? JSON.parse(customSizesStr) : [];
    // Combine and remove duplicates
    return Array.from(new Set([...PREDEFINED_SIZES, ...customSizes]));
  } catch (e) {
    return PREDEFINED_SIZES;
  }
};

export const addCustomSize = (size: string) => {
  if (!size || !size.trim()) return;
  const s = size.trim();
  const current = getAvailableSizes();
  if (!current.includes(s)) {
    try {
      const customSizesStr = localStorage.getItem('CUSTOM_SIZES');
      const customSizes = customSizesStr ? JSON.parse(customSizesStr) : [];
      customSizes.push(s);
      localStorage.setItem('CUSTOM_SIZES', JSON.stringify(customSizes));
    } catch (e) {
      console.error('Could not save custom size', e);
    }
  }
};
