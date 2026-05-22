const ShopModel = require('../models/Shop');

async function getShops(req, res) {
  const shops = await ShopModel.findAll();
  res.json(shops);
}

async function createShop(req, res) {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Shop name is required' });

  const shop = await ShopModel.create({ name, location });
  res.status(201).json(shop);
}

module.exports = { getShops, createShop };
