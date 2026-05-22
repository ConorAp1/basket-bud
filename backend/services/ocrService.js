const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are a receipt parser. Extract information from this receipt image. ' +
  'Return ONLY a JSON object with two fields: ' +
  '"shop" (string, the shop/store name from the receipt header, or null if not visible) and ' +
  '"items" (array of line items). ' +
  'Each item must have: name (string), price (number in GBP), quantity (number), unit (string e.g. kg/g/L/ml/each). ' +
  'Skip totals, subtotals, discounts, VAT lines, and loyalty card savings. ' +
  'Return raw JSON only, no markdown. Example: {"shop":"Tesco","items":[{"name":"Milk","price":1.09,"quantity":1,"unit":"each"}]}';

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
  console.log('[ocrService] Claude Vision raw response:', rawText);
  logger.info('Claude Vision raw response', { rawText });

  let items;
  let detectedShop = null;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.items)) {
      items = parsed.items;
      detectedShop = parsed.shop || null;
    } else {
      throw new Error('Response is neither a JSON array nor an object with an items array');
    }
  } catch (err) {
    logger.error('Failed to parse Claude Vision response as JSON', { rawText, error: err.message });
    throw new Error(`Claude Vision returned unparseable response: ${err.message}`);
  }

  logger.info('Claude Vision OCR complete', { itemCount: items.length, detectedShop });

  return { items, detectedShop, confidence: 95, rawText };
}

module.exports = { extractText };
