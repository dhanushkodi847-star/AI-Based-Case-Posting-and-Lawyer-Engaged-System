const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  paymentsEnabled: { type: Boolean, default: true },
  casePostingEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
