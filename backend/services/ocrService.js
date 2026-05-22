const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are a receipt parser. Extract all line items from this receipt image. ' +
  'Return ONLY a JSON array where each item has: name (string), price (number in GBP), ' +
  'quantity (number), unit (string e.g. kg/g/L/ml/each). ' +
  'Skip totals, subtotals, discounts, VAT lines, and loyalty card savings. ' +
  'Return raw JSON only, no markdown.';

async function extractText(imagePath) {
  logger.info('Starting Claude Vision OCR', { imagePath });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          { type: 'text', text: 'Extract all line items from this receipt.' },
        ],
      },
    ],
  });

  const rawText = response.content[0].text;
  logger.info('Claude Vision raw response', { rawText });

  let items;
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    items = JSON.parse(cleaned);
    if (!Array.isArray(items)) throw new Error('Response is not a JSON array');
  } catch (err) {
    logger.error('Failed to parse Claude Vision response as JSON', { rawText, error: err.message });
    throw new Error(`Claude Vision returned unparseable response: ${err.message}`);
  }

  logger.info('Claude Vision OCR complete', { itemCount: items.length });

  return { items, confidence: 95, rawText };
}

module.exports = { extractText };
