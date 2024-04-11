/*
 * Module Imports
 * */
const mongoose = require('mongoose');
const pagination = require('mongoose-paginate');
const Schema = mongoose.Schema;

/**
 * Schema Definition
 */

const historicalDataSchema = new Schema(
  {
    gameId: { type: Schema.Types.Number },
    maxRate: { type: Schema.Types.Number },
  },
  { timestamps: true },
)

historicalDataSchema.plugin(pagination);

module.exports = mongoose.model('historical-data', historicalDataSchema);
