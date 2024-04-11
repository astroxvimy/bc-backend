const axios = require('axios');

const { bcRecent } = require('../api/api');
const HistoricalData = require('../models/historical-data.model');

const saveBcRecent = async() => {
  const response = await axios.get(bcRecent());
  const lastTimestamp = await HistoricalData.findOne({}, { gameId: 1, _id: 0 }, { sort: { gameId: -1 } });
  const collectionData = response.data.data.map((element) => {
    if(lastTimestamp === null || element.gameId > lastTimestamp.gameId) {
      return {
        gameId: element.gameId,
        maxRate: element.maxRate
      };
    }
  }).filter((data) => data !== undefined);

  if(collectionData.length !== 0) {
    await HistoricalData.create(collectionData);
  }
  return response.data;
}

module.exports = saveBcRecent;
