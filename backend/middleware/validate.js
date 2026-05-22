const Joi = require('joi');

const itemSchema = Joi.object({
  rawName:           Joi.string().trim().min(1).required(),
  rawPrice:          Joi.number().positive().required(),
  quantity:          Joi.number().positive().optional(),
  weightGrams:       Joi.number().positive().optional().allow(null),
  volumeMl:          Joi.number().positive().optional().allow(null),
  unitType:          Joi.string().optional().allow('', null),
  normalisedPrice:   Joi.number().optional().allow(null),
  productId:         Joi.number().integer().optional().allow(null),
  suggestedCategory: Joi.string().optional().allow('', null),
  category:          Joi.string().optional().allow('', null),
  uncertain:         Joi.boolean().optional(),
});

const schemas = {
  confirmReceipt: Joi.object({
    shopName:     Joi.string().trim().optional().allow('', null),
    shopLocation: Joi.string().optional().allow('', null),
    scannedAt:    Joi.string().isoDate().optional().allow(null),
    imagePath:    Joi.string().optional().allow('', null),
    rawText:      Joi.string().optional().allow('', null),
    totalAmount:  Joi.number().positive().optional().allow(null),
    items:        Joi.array().items(itemSchema).min(1).required(),
  }),

  updateProduct: Joi.object({
    name:           Joi.string().trim().min(1).optional(),
    brand:          Joi.string().optional().allow('', null),
    category:       Joi.string().optional().allow('', null),
    tags:           Joi.array().items(Joi.string()).optional(),
    canonical_unit: Joi.string()
      .valid('per_item', 'per_100g', 'per_kg', 'per_litre', 'per_100ml', 'unknown')
      .optional(),
  }).min(1),
};

function validate(schemaName) {
  const schema = schemas[schemaName];
  if (!schema) throw new Error(`Unknown validation schema: ${schemaName}`);

  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return res.status(400).json({ error: message });
    }
    next();
  };
}

module.exports = validate;
