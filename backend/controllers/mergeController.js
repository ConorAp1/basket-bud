const ProductModel = require('../models/Product');
const ProductMergeModel = require('../models/ProductMerge');

async function getMerges(req, res) {
  const merges = await ProductMergeModel.findByProduct(req.params.id);
  res.json(merges);
}

async function createMerge(req, res) {
  const primaryId = parseInt(req.params.id, 10);
  const { mergeWithProductId } = req.body;

  if (!mergeWithProductId) {
    return res.status(400).json({ error: 'mergeWithProductId is required' });
  }
  const mergeId = parseInt(mergeWithProductId, 10);

  if (primaryId === mergeId) {
    return res.status(400).json({ error: 'A product cannot be merged with itself' });
  }

  const [primary, target] = await Promise.all([
    ProductModel.findById(primaryId),
    ProductModel.findById(mergeId),
  ]);
  if (!primary) return res.status(404).json({ error: `Product ${primaryId} not found` });
  if (!target) return res.status(404).json({ error: `Product ${mergeId} not found` });

  try {
    const merge = await ProductMergeModel.create(primaryId, mergeId);
    res.status(201).json(merge);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'These products are already merged' });
    }
    throw err;
  }
}

async function deleteMerge(req, res) {
  const removed = await ProductMergeModel.remove(req.params.mergeId);
  if (!removed) return res.status(404).json({ error: `Merge ${req.params.mergeId} not found` });
  res.status(204).end();
}

module.exports = { getMerges, createMerge, deleteMerge };
