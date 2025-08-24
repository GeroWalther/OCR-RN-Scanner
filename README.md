# OCR Copy It 📸✨

A powerful mobile OCR (Optical Character Recognition) app built with Expo that allows users to extract text from images, save history, detect links, and open them in the browser.

## 🚀 Features

### Core OCR Features

- **Camera Integration**: Take photos directly within the app
- **Gallery Upload**: Select images from your device's photo library
- **Advanced OCR**: Extract text from images using Google Vision API or Demo mode
- **Copy to Clipboard**: One-tap copying of extracted text
- **Cross-platform**: Works on iOS, Android, and web

### Smart Text Processing

- **Link Detection**: Automatically detects URLs and allows opening in browser
- **Email Detection**: Finds email addresses and opens mail app
- **Phone Detection**: Detects phone numbers and opens dialer
- **Smart Formatting**: Clean text extraction and formatting

### History & Storage

- **Local Storage**: All OCR results saved locally using AsyncStorage
- **History Management**: View, search, and manage up to 50 recent scans
- **Quick Actions**: Copy, share, or delete individual history items
- **Persistent Data**: History survives app restarts

### User Experience

- **Two-Screen Design**: Separate History and Camera screens
- **Tab Navigation**: Easy switching between screens
- **Haptic Feedback**: Touch feedback for better UX
- **Loading States**: Clear progress indicators
- **Error Handling**: Graceful error handling with user feedback

## 🛠 Tech Stack

### Frontend Framework

- **[Expo](https://expo.dev)** (~53.0) - React Native framework
- **[React Native](https://reactnative.dev)** (19.0.0) - Mobile app development
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe JavaScript

### Navigation & Storage

- **[@react-navigation/native](https://reactnavigation.org/)** - Navigation system
- **[@react-navigation/bottom-tabs](https://reactnavigation.org/)** - Tab navigation
- **[@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)** - Local storage

### Camera & Media

- **[expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)** - Camera functionality
- **[expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)** - Gallery image selection
- **[expo-image-manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)** - Image preprocessing

### OCR & External Services

- **[Google Vision API](https://cloud.google.com/vision)** - Cloud-based OCR (optional)
- **Demo OCR Mode** - Client-side simulation for testing

### Additional Features

- **[expo-clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/)** - Clipboard operations
- **[expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)** - Haptic feedback
- **[expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)** - In-app browser
- **[expo-linking](https://docs.expo.dev/versions/latest/sdk/linking/)** - Deep linking

## 📱 App Structure

```
OCR-copy-it/
├── App.tsx                    # Main app with stack navigation
├── screens/
│   ├── HomeScreen.tsx         # Main screen with OCR history & FAB
│   └── CameraScreen.tsx       # Modal camera/OCR scanning screen
├── services/
│   ├── ocrService.ts          # OCR processing (Demo + Google Vision)
│   └── storageService.ts      # Local storage & text processing
└── app.json                   # Expo configuration
```

## 🚀 Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Run on device**
   - Scan QR code with Expo Go app
   - Or run on iOS Simulator / Android Emulator

## 🔧 Configuration

### Google Vision API (Optional)

For real OCR functionality, set up Google Vision API:

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Vision API
3. Replace `YOUR_API_KEY_HERE` in `services/ocrService.ts`
4. Switch to Google Vision mode in the camera screen

### Demo Mode (Default)

The app works out of the box in demo mode:

- Simulates OCR processing with realistic delays
- Returns sample text with links, emails, and phone numbers
- Perfect for testing the complete workflow

## 📋 How It Works

### Home Screen (History)

- **View History**: See all previously scanned texts
- **Smart Detection**: Links, emails, and phone numbers are automatically detected
- **Quick Actions**: Copy, share, or delete any history item
- **Link Opening**: Tap detected links to open in browser
- **Contact Integration**: Tap emails/phones to open respective apps

### Camera Screen (Scanning)

- **Live Camera**: Real-time camera preview with scan frame
- **Gallery Access**: Select images from photo library
- **OCR Processing**: Extract text using Demo or Google Vision mode
- **Method Switching**: Toggle between OCR methods
- **Results Display**: View extracted text with detected links/contacts

### Data Flow

```
1. User takes photo or selects image
2. Image preprocessed (resize, compress)
3. OCR service extracts text
4. Text analyzed for links, emails, phones
5. Result saved to local storage
6. History updated automatically
7. User can copy, share, or open detected items
```

## 🎯 Key Features Breakdown

### Text Extraction

- **Camera Capture**: High-quality image capture with optimized settings
- **Image Preprocessing**: Automatic resizing and compression for better OCR
- **Multiple Sources**: Camera photos and gallery images supported

### Smart Detection

- **URL Detection**: Finds http/https URLs and domain names
- **Email Recognition**: Detects valid email addresses
- **Phone Numbers**: Identifies various phone number formats
- **Duplicate Removal**: Automatically removes duplicate detections

### History Management

- **Automatic Saving**: Every OCR result automatically saved
- **Metadata Storage**: Includes timestamp, confidence, and OCR method
- **Storage Limit**: Keeps last 50 items to manage storage space
- **Easy Management**: Delete individual items or clear all history

### User Experience

- **Haptic Feedback**: Tactile feedback for button presses and actions
- **Loading States**: Clear progress indicators during processing
- **Error Handling**: User-friendly error messages and recovery
- **Responsive Design**: Works on different screen sizes

## 🌟 Future Enhancements

- [ ] Search functionality in history
- [ ] Export history to files
- [ ] OCR result editing
- [ ] Multiple language support
- [ ] Batch image processing
- [ ] Cloud sync (optional)
- [ ] Text translation integration
- [ ] Business card parsing
- [ ] Receipt/document templates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Google Vision API](https://cloud.google.com/vision) for powerful OCR capabilities
- [Expo team](https://expo.dev) for the excellent development platform
- [React Navigation](https://reactnavigation.org/) for smooth navigation experience
