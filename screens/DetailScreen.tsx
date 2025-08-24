import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { performTranslation } from '../services/ocrService';
import {
  OCRHistoryItem,
  addTranslationToHistoryItem,
} from '../services/storageService';

interface RouteParams {
  item: OCRHistoryItem;
}

export default function DetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params as RouteParams;

  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState(item.translations || {});
  const [availableLanguages] = useState([
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  ]);

  const copyText = async (text: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(text);
    Alert.alert('✅ Copied!', 'Text copied to clipboard');
  };

  const translateToLanguage = async (targetLanguage: string) => {
    if (!item.text || translations[targetLanguage]) return;

    try {
      setIsTranslating(true);
      console.log(`🌍 Translating to ${targetLanguage}...`);

      const result = await performTranslation(item.text, targetLanguage);

      // Update local state
      const newTranslations = {
        ...translations,
        [targetLanguage]: result.translatedText,
      };
      setTranslations(newTranslations);

      // Save to storage
      await addTranslationToHistoryItem(
        item.id,
        targetLanguage,
        result.translatedText
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('✅ Translation completed and saved');
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert(
        'Translation Failed',
        (error as Error).message ||
          'Unable to translate text. Please check your internet connection and try again.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const selectLanguageForTranslation = () => {
    const languageOptions = availableLanguages
      .filter((lang) => !translations[lang.code]) // Only show languages not yet translated
      .map((lang) => ({
        text: `${lang.flag} ${lang.name}`,
        onPress: () => translateToLanguage(lang.code),
      }));

    if (languageOptions.length === 0) {
      Alert.alert(
        'All Languages Translated',
        'This text has been translated to all available languages.'
      );
      return;
    }

    Alert.alert('Translate To', 'Select target language', [
      ...languageOptions.slice(0, 8),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openLink = async (url: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const openEmail = async (email: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = `mailto:${email}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email app available');
      }
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const openPhone = async (phone: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No phone app available');
      }
    } catch (error) {
      console.error('Error opening phone:', error);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (isTranslating) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle='light-content' backgroundColor='#1e293b' />
        <View style={styles.loadingContent}>
          <ActivityIndicator size='large' color='#3b82f6' />
          <Text style={styles.loadingTitle}>Translating...</Text>
          <Text style={styles.loadingSubtitle}>Using Google Translate API</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={goBack}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>OCR Details</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Date</Text>
            <Text style={styles.metadataValue}>
              {item.timestamp.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Confidence</Text>
            <Text style={styles.metadataValue}>
              {item.confidence
                ? `${Math.round(item.confidence * 100)}%`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Original Text */}
        <View style={styles.textContainer}>
          <Text style={styles.textLabel}>Original Text</Text>
          {item.detectedLanguage && (
            <Text style={styles.languageLabel}>
              Detected: {item.detectedLanguage.toUpperCase()}
            </Text>
          )}
          <View style={styles.textBox}>
            <TextInput
              style={styles.selectableText}
              value={item.text}
              multiline
              editable={false}
              selectTextOnFocus
              textAlignVertical='top'
            />
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyText(item.text)}>
            <Text style={styles.copyButtonText}>📋 Copy Original</Text>
          </TouchableOpacity>
        </View>

        {/* Translations */}
        <View style={styles.translationsContainer}>
          <View style={styles.translationsHeader}>
            <Text style={styles.textLabel}>Translations</Text>
            <TouchableOpacity
              style={styles.addTranslationButton}
              onPress={selectLanguageForTranslation}>
              <Text style={styles.addTranslationText}>+ Add Translation</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(translations).length === 0 ? (
            <View style={styles.noTranslationsContainer}>
              <Text style={styles.noTranslationsText}>
                No translations yet. Tap &quot;Add Translation&quot; to
                translate this text.
              </Text>
            </View>
          ) : (
            Object.entries(translations).map(([langCode, translatedText]) => {
              const language = availableLanguages.find(
                (l) => l.code === langCode
              );
              return (
                <View key={langCode} style={styles.translationItem}>
                  <Text style={styles.translationLanguage}>
                    {language?.flag} {language?.name || langCode.toUpperCase()}
                  </Text>
                  <View style={styles.textBox}>
                    <TextInput
                      style={styles.selectableText}
                      value={translatedText}
                      multiline
                      editable={false}
                      selectTextOnFocus
                      textAlignVertical='top'
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.copyTranslationButton}
                    onPress={() => copyText(translatedText)}>
                    <Text style={styles.copyTranslationText}>
                      📋 Copy Translation
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Detected Items */}
        {((item.links && item.links.length > 0) ||
          (item.emails && item.emails.length > 0) ||
          (item.phones && item.phones.length > 0)) && (
          <View style={styles.detectedItemsSection}>
            <Text style={styles.textLabel}>Detected Items</Text>
            <View style={styles.detectedItemsContainer}>
              {item.links?.map((link, index) => (
                <TouchableOpacity
                  key={`link-${index}`}
                  style={styles.detectedItem}
                  onPress={() => openLink(link)}>
                  <Text style={styles.detectedIcon}>🔗</Text>
                  <Text style={styles.detectedText} numberOfLines={1}>
                    {link}
                  </Text>
                  <Text style={styles.detectedArrow}>→</Text>
                </TouchableOpacity>
              ))}
              {item.emails?.map((email, index) => (
                <TouchableOpacity
                  key={`email-${index}`}
                  style={styles.detectedItem}
                  onPress={() => openEmail(email)}>
                  <Text style={styles.detectedIcon}>✉️</Text>
                  <Text style={styles.detectedText} numberOfLines={1}>
                    {email}
                  </Text>
                  <Text style={styles.detectedArrow}>→</Text>
                </TouchableOpacity>
              ))}
              {item.phones?.map((phone, index) => (
                <TouchableOpacity
                  key={`phone-${index}`}
                  style={styles.detectedItem}
                  onPress={() => openPhone(phone)}>
                  <Text style={styles.detectedIcon}>📞</Text>
                  <Text style={styles.detectedText} numberOfLines={1}>
                    {phone}
                  </Text>
                  <Text style={styles.detectedArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  headerButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  metadataContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  metadataItem: {
    flex: 1,
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '700',
  },
  textContainer: {
    marginBottom: 24,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  languageLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 12,
  },
  textBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectableText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
    minHeight: 60,
    padding: 0,
  },
  copyButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  translationsContainer: {
    marginBottom: 24,
  },
  translationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTranslationButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addTranslationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noTranslationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  noTranslationsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  translationItem: {
    marginBottom: 20,
  },
  translationLanguage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  copyTranslationButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  copyTranslationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  detectedItemsSection: {
    marginBottom: 40,
  },
  detectedItemsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detectedIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detectedText: {
    flex: 1,
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '500',
  },
  detectedArrow: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
});
