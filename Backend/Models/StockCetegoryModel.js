const mongoose = require('mongoose');
const StockCategorySchema = mongoose.Schema({
          name: {
          type: String,
          required: true,
          trim: true
          },
          firm: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Firm',
          required: true
          },
          description: {
          type: String,
          required: true
          },
          CategoryImg:{
          type: String,
          default: ""
          },
          createdAt: {
          type: Date,
          default: Date.now
          },
          removeAt: {
          type: Date,
          default: null
          }
          });
// Categories are per-firm — two shops can both have a "Rings" category.
StockCategorySchema.index({ firm: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('StockCategory', StockCategorySchema);
