const bcRecent = () => `https://bc.game/api/crash/result/recent/`;

const HistoricalChart = (id, days = 365, currency) =>
  `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;

module.exports = {
  bcRecent,
  HistoricalChart,
};