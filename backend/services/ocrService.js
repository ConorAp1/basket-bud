const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are a receipt parser. Extract structured data from this grocery receipt image. ' +
  'Return ONLY a JSON object with keys: ' +
  'shop (string|null, the store name e.g. "Tesco", "Aldi", "Lidl", "Sainsbury\'s"), ' +
  'date (string|null, the receipt date in ISO YYYY-MM-DD format), ' +
  'total (number|null, the receipt grand total in GBP), ' +
  'items (array). Each item has: ' +
  'name (string, the product name as printed), ' +
  'price (number, the line total paid in GBP), ' +
  'quantity (number, default 1), ' +
  'size_value (number|null, pack size or weight if printed, e.g. 2 for "2L", 500 for "500g"), ' +
  'size_unit (string|null, one of: g, kg, ml, l — null if no size printed). ' +
  'For loose weighed produce (e.g. "0.456 kg @ £1.20/kg") set size_value to the weight and size_unit accordingly. ' +
  'Skip totals, subtotals, discounts, VAT lines, and loyalty card savings as items. ' +
  'Return raw JSON only, no markdown.';

async function extractText(imagePath) {
  logger.info('Starting Claude Vision OCR', { imagePath });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          { type: 'text', text: 'Extract the shop, date, total and all line items from this receipt.' },
        ],
      },
    ],
  });

  const rawText = response.content[0].text;
  logger.info('Claude Vision raw response', { rawText });

  let parsed;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    logger.error('Failed to parse Claude Vision response as JSON', { rawText, error: err.message });
    throw new Error(`Claude Vision returned unparseable response: ${err.message}`);
  }

  // Accept both the new object shape and the legacy bare-array shape.
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) {
    throw new Error('Claude Vision response did not contain an items array');
  }

  const shopName = Array.isArray(parsed) ? null : parsed.shop || null;
  const receiptDate = Array.isArray(parsed) ? null : parsed.date || null;
  const totalAmount = Array.isArray(parsed) ? null : parsed.total ?? null;

  logger.info('Claude Vision OCR complete', { itemCount: items.length, shopName, receiptDate });

  return { items, shopName, receiptDate, totalAmount, confidence: 95, rawText };
}

module.exports = { extractText };
