const ProductModel = require('../models/Product');
const ProductMergeModel = require('../models/ProductMerge');
const logger = require('../utils/logger');

// pg_trgm similarity above which we auto-link without asking the user.
// Receipt abbreviations ("SS MILK 2PT") rarely clear this bar, so uncertain
// matches are surfaced as candidates for the review screen instead.
const AUTO_MATCH_THRESHOLD = 0.5;

/**
 * If the matched product has been merged into another, follow the merge so
 * all price records accumulate against the primary product.
 */
async function resolveToPrimary(productId) {
  const merges = await ProductMergeModel.findByProduct(productId);
  const asMerged = merges.find((m) => m.merged_product_id === productId);
  return asMerged ? asMerged.primary_product_id : productId;
}

/**
 * Attach product-match info to each scanned line item.
 * Adds: productId (when confident), matchedProductName, matchConfidence,
 * and candidates[] (top fuzzy matches for the review UI).
 */
async function matchLineItems(items) {
  return Promise.all(
    items.map(async (item) => {
      if (!item.rawName) {
        return { ...item, productId: null, matchedProductName: null, matchConfidence: 0, candidates: [] };
      }

      let candidates = [];
      try {
        candidates = await ProductModel.fuzzySearch(item.rawName);
      } catch (err) {
        logger.warn('Fuzzy product match failed', { rawName: item.rawName, error: err.message });
      }

      const best = candidates[0];
      let productId = null;
      let matchedProductName = null;
      const matchConfidence = best ? Number(best.sim) || 0 : 0;

      if (best && matchConfidence >= AUTO_MATCH_THRESHOLD) {
        productId = await resolveToPrimary(best.id);
        matchedProductName = best.name;
      }

      return {
        ...item,
        productId,
        matchedProductName,
        matchConfidence,
        uncertain: !productId && candidates.length > 0,
        candidates: candidates.slice(0, 3).map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          similarity: Number(c.sim) || 0,
        })),
      };
    })
  );
}

/**
 * Ensure a line item has a product to attach price records to.
 * Uses the supplied productId if present (resolving merges), otherwise
 * creates a new canonical product from the item details.
 */
async function ensureProduct(item) {
  if (item.productId) {
    return resolveToPrimary(item.productId);
  }

  const name = cleanProductName(item.rawName);
  if (!name) return null;

  // Re-check for an exact-ish match before creating: the user may have
  // renamed the item in review to match an existing product.
  const candidates = await ProductModel.fuzzySearch(name);
  const best = candidates[0];
  if (best && Number(best.sim) >= 0.85) {
    return resolveToPrimary(best.id);
  }

  const product = await ProductModel.create({
    name,
    category: item.suggestedCategory && item.suggestedCategory !== 'Unknown' ? item.suggestedCategory : null,
    canonical_unit: item.unitType || 'unknown',
  });
  logger.info('Auto-created product from receipt item', { productId: product.id, name });
  return product.id;
}

/** Tidy raw receipt text into a readable product name (e.g. "SS MILK 2PT" → "Ss Milk 2pt"). */
function cleanProductName(rawName) {
  const trimmed = (rawName || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  // Title-case only if the receipt printed it in ALL CAPS; otherwise keep as-is.
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

module.exports = { matchLineItems, ensureProduct, resolveToPrimary, cleanProductName, AUTO_MATCH_THRESHOLD };
