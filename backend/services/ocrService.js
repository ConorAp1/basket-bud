const Tesseract = require('tesseract.js');
const path = require('path');
const logger = require('../utils/logger');

// Use locally bundled trained data to avoid CDN dependency at runtime.
// Falls back to Tesseract's default (CDN download) if the local file is missing.
const LOCAL_LANG_PATH = path.join(__dirname, '..', 'tessdata');

async function extractText(imagePath) {
  logger.info('Starting OCR extraction', { imagePath });

  let worker;
  try {
    worker = await Tesseract.createWorker('eng', 1, {
      langPath: LOCAL_LANG_PATH,
      logger: (m) => {
        if (process.env.NODE_ENV === 'development' && m.status === 'recognizing text') {
          logger.debug('OCR progress', { progress: Math.round(m.progress * 100) });
        }
      },
    });

    const { data } = await worker.recognize(imagePath);

    logger.info('OCR extraction complete', { confidence: Math.round(data.confidence) });

    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map((w) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
      lines: data.lines.map((l) => ({
        text: l.text,
        confidence: l.confidence,
      })),
    };
  } catch (err) {
    logger.error('OCR extraction failed', { imagePath, error: err.message });
    throw new Error(`OCR processing failed: ${err.message}`);
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

module.exports = { extractText };
