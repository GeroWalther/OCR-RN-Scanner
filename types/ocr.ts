export interface OCRResult {
  text: string;
  confidence: number;
  timestamp: Date;
}

export interface CameraState {
  hasPermission: boolean;
  isProcessing: boolean;
  showCamera: boolean;
}

export interface ImageProcessingOptions {
  quality: number;
  base64: boolean;
  allowsEditing?: boolean;
}
