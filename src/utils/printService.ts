/**
 * Print Service - Handles reliable thermal & standard browser printing.
 * Single Responsibility: Encapsulate print triggering, timing, and fallbacks.
 */

export interface PrintOptions {
  delayMs?: number;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function executePrintReceipt(options: PrintOptions = {}): Promise<boolean> {
  const { delayMs = 150, onBeforePrint, onAfterPrint } = options;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (onBeforePrint) {
      try {
        onBeforePrint();
      } catch (err) {
        console.warn('[PrintService] onBeforePrint error:', err);
      }
    }

    // Small delay to ensure DOM updates and images/QR codes are ready
    setTimeout(() => {
      try {
        window.print();
        if (onAfterPrint) {
          onAfterPrint();
        }
        resolve(true);
      } catch (err) {
        console.error('[PrintService] window.print() failed:', err);
        resolve(false);
      }
    }, delayMs);
  });
}
