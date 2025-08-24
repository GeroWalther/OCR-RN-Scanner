import { useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { performOCR, performTranslation } from '../services/ocrService';
import {
  extractEmails,
  extractLinks,
  extractPhoneNumbers,
  saveOCRResult,
} from '../services/storageService';

export default function CameraScreen() {
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [confidence, setConfidence] = useState<number>(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
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
  const cameraRef = useRef<CameraView>(null);

  // Request camera permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const performOCRProcess = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      // Perform OCR using Google Vision
      const result = await performOCR(imageUri);

      // Save to history
      await saveOCRResult(
        result.text,
        result.confidence,
        'google-vision',
        result.detectedLanguage,
        result.translatedText,
        undefined // No translation language on initial OCR
      );

      // Set extracted text and metadata
      setExtractedText(result.text.trim());
      setConfidence(result.confidence || 0);
      setDetectedLanguage(result.detectedLanguage || '');
      setTranslatedText(result.translatedText || '');
      setShowCamera(false);

      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert(
        'OCR Failed',
        'Failed to extract text from the image. Please try again with a clearer image.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        await performOCRProcess(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await performOCRProcess(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetToCamera = () => {
    setShowCamera(true);
    setExtractedText('');
    setConfidence(0);
    setDetectedLanguage('');
    setTranslatedText('');
    setShowTranslation(false);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const copyText = async (text?: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(text || extractedText);
    Alert.alert('✅ Copied!', 'Text copied to clipboard');
  };

  const translateTextToLanguage = async (targetLanguage: string) => {
    if (!extractedText) return;

    try {
      setIsProcessing(true);
      console.log(`🌍 Translating to ${targetLanguage}...`);

      // Use real Google Translate API
      const result = await performTranslation(extractedText, targetLanguage);

      setTranslatedText(result.translatedText);
      setShowTranslation(true);

      // Note: Translation will be saved when user goes back to history
      // The history item will be updated when they view the detail screen

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('✅ Translation completed successfully');
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert(
        'Translation Failed',
        (error as Error).message ||
          'Unable to translate text. Please check your internet connection and try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const selectLanguageForTranslation = () => {
    const languageOptions = availableLanguages.map((lang) => ({
      text: `${lang.flag} ${lang.name}`,
      onPress: () => translateTextToLanguage(lang.code),
    }));

    Alert.alert('Translate To', 'Select target language', [
      ...languageOptions.slice(0, 8), // Show first 8 languages
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

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionMessage}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar barStyle='dark-content' backgroundColor='#f8fafc' />
        <View style={styles.permissionContent}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            OCR Scanner needs camera access to capture images and extract text
            from them.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.processingContainer}>
        <StatusBar barStyle='light-content' backgroundColor='#1e293b' />
        <View style={styles.processingContent}>
          <ActivityIndicator size='large' color='#3b82f6' />
          <Text style={styles.processingTitle}>Extracting Text...</Text>
          <Text style={styles.processingSubtitle}>
            Using Google Vision AI to analyze your image
          </Text>
          <View style={styles.processingSteps}>
            <Text style={styles.processingStep}>
              🔍 Analyzing image content
            </Text>
            <Text style={styles.processingStep}>🤖 Running AI recognition</Text>
            <Text style={styles.processingStep}>📝 Extracting text data</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Results view
  if (!showCamera && extractedText) {
    const links = extractLinks(extractedText);
    const emails = extractEmails(extractedText);
    const phones = extractPhoneNumbers(extractedText);

    return (
      <SafeAreaView style={styles.resultsContainer}>
        <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />

        {/* Header */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity style={styles.headerButton} onPress={resetToCamera}>
            <Text style={styles.headerButtonText}>← Scan Again</Text>
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>Extracted Text</Text>
          <TouchableOpacity style={styles.headerButton} onPress={goBack}>
            <Text style={styles.headerButtonText}>Done ✓</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.resultsContent}
          showsVerticalScrollIndicator={false}>
          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Confidence</Text>
              <Text style={styles.metadataValue}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>
            {detectedLanguage && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Language</Text>
                <Text style={styles.metadataValue}>
                  {detectedLanguage.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Method</Text>
              <Text style={styles.metadataValue}>🔍 Google Vision</Text>
            </View>
          </View>

          {/* Extracted Text */}
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>Extracted Text</Text>
            <View style={styles.textBox}>
              <TextInput
                style={styles.selectableText}
                value={extractedText}
                multiline
                editable={false}
                selectTextOnFocus
                textAlignVertical='top'
                placeholder='No text extracted'
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => copyText()}>
              <Text style={styles.primaryButtonIcon}>📋</Text>
              <Text style={styles.primaryButtonText}>Copy All Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={selectLanguageForTranslation}>
              <Text style={styles.secondaryButtonIcon}>🌐</Text>
              <Text style={styles.secondaryButtonText}>Translate</Text>
            </TouchableOpacity>
          </View>

          {/* Translation Section */}
          {showTranslation && translatedText && (
            <View style={styles.translationSection}>
              <Text style={styles.translationLabel}>Translation</Text>
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
          )}

          {/* Links, Emails, Phone Numbers */}
          {(links.length > 0 || emails.length > 0 || phones.length > 0) && (
            <View style={styles.linksSection}>
              <Text style={styles.linksSectionTitle}>Detected Items</Text>
              <View style={styles.linksContainer}>
                {links.map((link, index) => (
                  <TouchableOpacity
                    key={`link-${index}`}
                    style={styles.linkItem}
                    onPress={() => openLink(link)}>
                    <Text style={styles.linkIcon}>🔗</Text>
                    <Text style={styles.linkText} numberOfLines={1}>
                      {link}
                    </Text>
                    <Text style={styles.linkArrow}>→</Text>
                  </TouchableOpacity>
                ))}
                {emails.map((email, index) => (
                  <TouchableOpacity
                    key={`email-${index}`}
                    style={styles.linkItem}
                    onPress={() => openEmail(email)}>
                    <Text style={styles.linkIcon}>✉️</Text>
                    <Text style={styles.linkText} numberOfLines={1}>
                      {email}
                    </Text>
                    <Text style={styles.linkArrow}>→</Text>
                  </TouchableOpacity>
                ))}
                {phones.map((phone, index) => (
                  <TouchableOpacity
                    key={`phone-${index}`}
                    style={styles.linkItem}
                    onPress={() => openPhone(phone)}>
                    <Text style={styles.linkIcon}>📞</Text>
                    <Text style={styles.linkText} numberOfLines={1}>
                      {phone}
                    </Text>
                    <Text style={styles.linkArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#000000' />
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={goBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.methodIndicator}>
            <Text style={styles.methodText}>🔍 Google Vision</Text>
          </View>
        </View>

        {/* Scan Area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>Position text within the frame</Text>
          <Text style={styles.scanSubtext}>
            Ensure good lighting for best results
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
            <Text style={styles.controlButtonText}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}>
            <Text style={styles.controlButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },

  // Permission styles
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Processing styles
  processingContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
  },
  processingSteps: {
    alignItems: 'center',
  },
  processingStep: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 12,
    textAlign: 'center',
  },

  // Camera header
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  methodIndicator: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  methodText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scan area
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 280,
    height: 200,
    borderWidth: 3,
    borderColor: '#3b82f6',
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginBottom: 32,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  scanText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanSubtext: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Camera controls
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3b82f6',
  },

  // Results styles
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
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
  },
  headerButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  resultsContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Metadata
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

  // Text container
  textContainer: {
    marginBottom: 24,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
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
  extractedText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
  },

  // Actions
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flex: 1,
  },
  primaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    flex: 1,
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },

  // Selectable text
  selectableText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
    minHeight: 60,
    padding: 0,
  },

  // Translation section
  translationSection: {
    marginBottom: 24,
  },
  translationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
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

  // Links section
  linksSection: {
    marginBottom: 40,
  },
  linksSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  linksContainer: {
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
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '500',
  },
  linkArrow: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
});
