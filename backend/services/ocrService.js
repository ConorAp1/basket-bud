const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

async function extractText(imagePath) {
  logger.info('Starting OCR extraction', { imagePath });

  try {
    const { data } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        if (process.env.NODE_ENV === 'development' && m.status === 'recognizing text') {
          logger.debug('OCR progress', { progress: Math.round(m.progress * 100) });
        }
      },
    });

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
    throw new Error(`OCR processing failed for ${imagePath}: ${err.message}`);
  }
}

module.exports = { extractText };
