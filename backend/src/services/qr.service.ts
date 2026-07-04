import QRCode from 'qrcode';

class QRService {
  /**
   * Generates a base64 QR Code string for redirection URLs
   * @param text The destination short link URL
   */
  public async generateQRCode(text: string): Promise<string> {
    try {
      // Generate standard high-quality base64 PNG data URL
      const qrDataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: {
          dark: '#0A2540', // Stripe-inspired slate-navy color
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      throw new Error('Failed to generate QR Code');
    }
  }
}

export default new QRService();
