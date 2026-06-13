const Anthropic = require('@anthropic-ai/sdk');
const sharp = require('sharp');
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

// Claude Vision accepts images up to 5MB / ~1568px before server-side downscaling.
// Phone photos are routinely 3000px+ and can exceed 5MB, and are often EXIF-rotated,
// so normalise everything to an upright, bounded JPEG before sending.
async function prepareImage(imagePath) {
  try {
    return await sharp(imagePath)
      .rotate() // apply EXIF orientation so sideways photos read correctly
      .resize(1568, 1568, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (err) {
    throw new Error(`Could not read receipt image (${err.message}). Try re-uploading as JPEG or PNG.`);
  }
}

async function extractText(imagePath) {
  logger.info('Starting Claude Vision OCR', { imagePath });

  const imageBuffer = await prepareImage(imagePath);
  const base64Image = imageBuffer.toString('base64');

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
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
          },
          { type: 'text', text: 'Extract all line items from this receipt.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'max_tokens') {
    logger.error('Claude Vision response truncated at max_tokens', { imagePath });
    throw new Error('Receipt has too many items to parse in one pass — response was truncated.');
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Claude Vision returned no text content for this image.');
  }
  const rawText = textBlock.text;
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
