import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OCRHistoryItem {
  id: string;
  text: string;
  confidence?: number;
  timestamp: Date;
  method: 'google-vision';
  detectedLanguage?: string;
  originalLanguage?: string;
  translations?: { [languageCode: string]: string };
  links?: string[];
  emails?: string[];
  phones?: string[];
}

const STORAGE_KEY = 'ocr_history';

/**
 * Save OCR result to history
 */
export async function saveOCRResult(
  text: string,
  confidence?: number,
  method: 'google-vision' = 'google-vision',
  detectedLanguage?: string,
  translatedText?: string,
  translatedLanguage?: string
): Promise<OCRHistoryItem> {
  try {
    const links = extractLinks(text);
    const emails = extractEmails(text);
    const phones = extractPhoneNumbers(text);

    const translations: { [languageCode: string]: string } = {};
    if (translatedText && translatedLanguage) {
      translations[translatedLanguage] = translatedText;
    }

    const newItem: OCRHistoryItem = {
      id: Date.now().toString(),
      text,
      confidence,
      timestamp: new Date(),
      method,
      detectedLanguage,
      originalLanguage: detectedLanguage,
      translations,
      links,
      emails,
      phones,
    };

    const existingHistory = await getOCRHistory();
    const updatedHistory = [newItem, ...existingHistory.slice(0, 49)]; // Keep last 50 items

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return newItem;
  } catch (error) {
    console.error('Error saving OCR result:', error);
    throw new Error('Failed to save OCR result');
  }
}

/**
 * Get all OCR history
 */
export async function getOCRHistory(): Promise<OCRHistoryItem[]> {
  try {
    const historyString = await AsyncStorage.getItem(STORAGE_KEY);
    if (historyString) {
      const history = JSON.parse(historyString);
      // Convert timestamp strings back to Date objects
      return history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting OCR history:', error);
    return [];
  }
}

/**
 * Delete an OCR history item
 */
export async function deleteOCRHistoryItem(id: string): Promise<void> {
  try {
    const history = await getOCRHistory();
    const updatedHistory = history.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error deleting OCR history item:', error);
    throw new Error('Failed to delete item');
  }
}

/**
 * Clear all OCR history
 */
export async function clearOCRHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing OCR history:', error);
    throw new Error('Failed to clear history');
  }
}

/**
 * Add translation to existing OCR history item
 */
export async function addTranslationToHistoryItem(
  itemId: string,
  languageCode: string,
  translatedText: string
): Promise<void> {
  try {
    const history = await getOCRHistory();
    const itemIndex = history.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error('History item not found');
    }

    // Update the item with new translation
    history[itemIndex] = {
      ...history[itemIndex],
      translations: {
        ...history[itemIndex].translations,
        [languageCode]: translatedText,
      },
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding translation to history item:', error);
    throw new Error('Failed to add translation');
  }
}

/**
 * Extract links from text
 */
export function extractLinks(text: string): string[] {
  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex) || [];

  // Clean up and validate URLs
  return matches
    .map((url) => {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    })
    .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const matches = text.match(emailRegex) || [];
  return matches.filter(
    (email, index, array) => array.indexOf(email) === index
  );
}

/**
 * Extract phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex =
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/gi;
  const matches = text.match(phoneRegex) || [];
  return matches.filter(
    (phone, index, array) => array.indexOf(phone) === index
  );
}
