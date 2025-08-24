import * as ImageManipulator from 'expo-image-manipulator';

export interface OCRResult {
  text: string;
  confidence: number;
  detectedLanguage?: string;
  translatedText?: string;
}

// Google APIs configuration
// Replace 'YOUR_API_KEY_HERE' with your actual Google Cloud API key
const GOOGLE_API_KEY = 'AIzaSyDVX0b50XYTlgNSMHOFkjFfFMvF6qDxXoc';
const GOOGLE_VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
const GOOGLE_TRANSLATE_API_URL = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;

/**
 * Preprocess image for better OCR results
 */
async function preprocessImage(imageUri: string): Promise<string> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1000 } }, // Resize for optimal processing
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    return manipulatedImage.base64!;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw new Error('Failed to preprocess image');
  }
}

/**
 * Perform OCR using Google Vision API
 */
async function performGoogleVisionOCR(imageBase64: string): Promise<OCRResult> {
  try {
    console.log('🔍 Starting Google Vision OCR...');

    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await fetch(GOOGLE_VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responses?.[0]?.error) {
      throw new Error(`Vision API error: ${data.responses[0].error.message}`);
    }

    const textAnnotations = data.responses?.[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return { text: '', confidence: 0 };
    }

    const extractedText = textAnnotations[0].description || '';
    const confidence = 0.9; // Google Vision typically has high confidence

    console.log('✅ Google Vision OCR completed');
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);

    return {
      text: extractedText.trim(),
      confidence,
    };
  } catch (error) {
    console.error('❌ Google Vision OCR error:', error);
    throw new Error('Failed to extract text from image. Please try again.');
  }
}

/**
 * Translate text using Google Translate API
 */
async function translateText(
  text: string,
  targetLanguage: string = 'en'
): Promise<{ translatedText: string; detectedLanguage: string }> {
  try {
    console.log(`🌍 Translating text to ${targetLanguage}...`);

    const response = await fetch(GOOGLE_TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Translate API error: ${data.error.message}`);
    }

    const translation = data.data.translations[0];

    console.log('✅ Translation completed');
    console.log(
      `🔤 Detected language: ${translation.detectedSourceLanguage || 'unknown'}`
    );

    return {
      translatedText: translation.translatedText,
      detectedLanguage: translation.detectedSourceLanguage || 'unknown',
    };
  } catch (error) {
    console.error('❌ Translation error:', error);
    return {
      translatedText: text, // Return original if translation fails
      detectedLanguage: 'unknown',
    };
  }
}

/**
 * Main OCR function using Google Vision API
 */
export async function performOCR(
  imageUri: string,
  translateTo?: string
): Promise<OCRResult> {
  try {
    console.log('🔍 Starting Google Vision OCR...');

    // Use Google Vision API
    const base64Image = await preprocessImage(imageUri);
    const result = await performGoogleVisionOCR(base64Image);

    // Add translation if requested
    if (translateTo && result.text) {
      const translation = await translateText(result.text, translateTo);
      result.translatedText = translation.translatedText;
      result.detectedLanguage = translation.detectedLanguage;
    }

    return result;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

/**
 * Standalone translation function for existing text
 */
export async function performTranslation(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  try {
    console.log(`🌍 Translating text to ${targetLanguage}...`);
    return await translateText(text, targetLanguage);
  } catch (error) {
    console.error('Translation Error:', error);
    throw new Error(
      'Failed to translate text. Please check your internet connection and try again.'
    );
  }
}

/**
 * Get available languages for translation
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];
