import * as faceapi from '@vladmandic/face-api';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'kiri' | 'kanan';
}

export class FaceDetectorService {
  private isModelLoaded: boolean = false;
  private loadError: string | null = null;
  private historyLeft: number[] = [];
  private historyRight: number[] = [];

  public async loadModel(): Promise<{ success: boolean; error?: string }> {
    if (this.isModelLoaded) return { success: true };

    try {
      // Model dimuat dari folder /models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      this.isModelLoaded = true;
      this.loadError = null;
      return { success: true };
    } catch (err: unknown) {
      console.warn('Gagal memuat model Tiny Face Detector dari /models:', err);
      const errMsg = 'File model belum ditemukan di folder public/models/ (butuh tiny_face_detector_model-weights_manifest.json dan tiny_face_detector_model.bin). Anda tetap dapat menggunakan kontrol hitung manual (A+/A-, B+/B-).';
      this.loadError = errMsg;
      return { success: false, error: errMsg };
    }
  }

  public getIsModelLoaded(): boolean {
    return this.isModelLoaded;
  }

  public getLoadError(): string | null {
    return this.loadError;
  }

  public async detectFaces(
    videoElement: HTMLVideoElement,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ): Promise<{ boxes: FaceBox[]; countLeft: number; countRight: number }> {
    if (!this.isModelLoaded || !videoElement || videoElement.readyState < 2) {
      return { boxes: [], countLeft: 0, countRight: 0 };
    }

    try {
      // TinyFaceDetectorOptions inputSize 416, scoreThreshold 0.4
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.4,
      });

      const detections = await faceapi.detectAllFaces(videoElement, options);
      const videoW = videoElement.videoWidth || canvasWidth;
      const videoH = videoElement.videoHeight || canvasHeight;
      const scaleX = canvasWidth / videoW;
      const scaleY = canvasHeight / videoH;

      const boxes: FaceBox[] = [];
      let instantLeft = 0;
      let instantRight = 0;

      detections.forEach((det) => {
        const box = det.box;
        let x = box.x * scaleX;
        const y = box.y * scaleY;
        const w = box.width * scaleX;
        const h = box.height * scaleY;

        // Jika dicerminkan (mirrored view), balikkan koordinat X
        if (isMirrored) {
          x = canvasWidth - (x + w);
        }

        const centerX = x + w / 2;
        const side: 'kiri' | 'kanan' = centerX < canvasWidth / 2 ? 'kiri' : 'kanan';

        if (side === 'kiri') instantLeft++;
        else instantRight++;

        boxes.push({ x, y, width: w, height: h, side });
      });

      // Filter Median dari 5 pembacaan terakhir agar stabil
      this.historyLeft.push(instantLeft);
      this.historyRight.push(instantRight);
      if (this.historyLeft.length > 5) this.historyLeft.shift();
      if (this.historyRight.length > 5) this.historyRight.shift();

      const medianLeft = this.calculateMedian(this.historyLeft);
      const medianRight = this.calculateMedian(this.historyRight);

      return {
        boxes,
        countLeft: medianLeft,
        countRight: medianRight,
      };
    } catch (e) {
      console.error('Detection error:', e);
      return { boxes: [], countLeft: 0, countRight: 0 };
    }
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  public resetHistory() {
    this.historyLeft = [];
    this.historyRight = [];
  }
}

export const faceDetectorService = new FaceDetectorService();
