/*
 * Module Imports
 * */
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const Logger = require('./../services/logger');
const { HistoricalChart } = require('../api/api');
const HistoricalData = require('../models/historical-data.model');

const router = express.Router();

router.get('/get-coin-history', async function (req, res) {
  if (!req.query.coinId) {
    Logger.log.warn(req.query)
    Logger.log.warn('Coin ID is missing');
    return res.status(400).send({
      status: 'ERROR',
      messageCode: 'COINID_NOT_FOUND',
      message: 'Coin ID is missing',
    });
  }
  if (!req.query.currency) {
    Logger.log.warn('Currency is missing');
    return res.status(400).send({
      status: 'ERROR',
      messageCode: 'CURRENCY_NOT_FOUND',
      message: 'Currency is missing',
    });
  }
  if (!req.query.days) {
    Logger.log.warn('Days is missing');
    return res.status(400).send({
      status: 'ERROR',
      messageCode: 'DAYS_NOT_FOUND',
      message: 'Days is missing',
    });
  }
  const coinId = req.query.coinId;
  const currency = req.query.currency;
  const days = req.query.days;
  try {
    const response = await axios.get(HistoricalChart(coinId, days, currency));
    if(response.status === 200) {
      if(days > 90 && currency === 'USD') {
        const lastTimestamp = await HistoricalData.findOne({coinId: coinId}, { timestamp: 1, _id: 0 }, { sort: { timestamp: -1 } });
        const collectionData = response.data.prices.map((element) => {
          if(lastTimestamp === null || element[0] > lastTimestamp) {
            return {
              timestamp: element[0],
              price: element[1],
              coinId: coinId
            };
          }
        }).filter((data) => data !== undefined);

        await HistoricalData.insertMany(collectionData);
      }
      res.status(200).send({ 
        data: response.data
      });
    }
  } catch (e) {
    console.log("error => ", e);
    res.status(400).send({
      messageCode: 'ERROR',
      message: 'Error occured.',
    });
  }
});

router.get('/get-chart-data', async function (req, res) {
  const total = parseInt(req.params.total);
  try {
    const result = await HistoricalData.aggregate([
      { $sort: { gameId: -1 } }, // Sort by gameId in ascending order
      { $limit: Number(req.query.total) },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$maxRate", 200] }, then: "Under 200" },
                { case: { $and: [{ $gte: ["$maxRate", 200] }, { $lt: ["$maxRate", 400] }] }, then: "200-400" },
                { case: { $and: [{ $gte: ["$maxRate", 400] }, { $lt: ["$maxRate", 1000] }] }, then: "400-1000" },
                { case: { $gte: ["$maxRate", 1000] }, then: "More than 1000" }
              ],
              default: "Other"
            }
          },
          count: { $sum: 1 }
        }
      },
    ]);
    const value = await HistoricalData.aggregate([
      { $match: { maxRate: { $type: "number" } } }, // Filter out non-numeric maxRate values
      { $sort: { gameId: -1 } }, // Sort by gameId in descending order
      { $limit: Number(req.query.total) },
      {
        $group: {
          _id: null,
          total: { $sum: { $divide: [100, "$maxRate"] } }, // Sum of 1/maxRate field
          count: { $sum: 1 } // Count of documents
        }
      },
      {
        $project: {
          _id: 0,
          average: { $divide: ["$total", "$count"] } // Calculate average by dividing total by count
        }
      }
    ]);
    // The average value will be available in the result array
    const average = value.length > 0 ? value[0].average : null;
    res.status(200).send({ 
      data: [
        result.find((element) => element._id === 'Under 200')?.count??0,
        result.find((element) => element._id === '200-400')?.count??0,
        result.find((element) => element._id === '400-1000')?.count??0,
        result.find((element) => element._id === 'More than 1000')?.count??0,
      ],
      average: 1-average
    });
  } catch (error) {
    console.error(error);
  }
});

router.get('/get-graph-data', async function (req, res) {
  try {
    const result = await HistoricalData.aggregate([
      { $sort: { gameId: -1 } }, // Sort by gameId in ascending order
      { $limit: Number(req.query.total) },
    ]);
    const response = result.map(
      (element) => element.maxRate
    );
    res.status(200).send({ 
      data: response
    });
  } catch (error) {
    console.error(error);
  }
});

router.get('/get-chart2-data', async function (req, res) {
  try {
    let result = []
    const a = await HistoricalData.aggregate([
      { $sort: { gameId: -1 } }, // Sort by gameId in descending order
      { $limit: 200 }, // Limit to 2000 documents
      { $match: { maxRate: { $gt: 10000 } } }, // Filter documents where maxRate > 10000
      { 
        $group: {
          _id: null, // Group all documents together
          count: { $sum: 1 } // Count the matching documents
        }
      }
    ]);
    result.push(a[0]?.count??0);
    for (i = 2; i < 6; i++) {
      const temp = await HistoricalData.aggregate([
        { $sort: { gameId: -1 } }, // Sort by gameId in descending order
        { $limit: 200 * i }, // Limit to 2000 documents
        { $match: { maxRate: { $gt: 10000 } } }, // Filter documents where maxRate > 10000
        { 
          $group: {
            _id: null, // Group all documents together
            count: { $sum: 1 } // Count the matching documents
          }
        }
      ]);
      result.push(temp[0].count);
    }
    for(i = 4; i > 0; i--) {
      result[i] -= (result[i-1]);
    }
    result = result.map((element) => {
      if(element === 0) {
        return 0.1
      } else {
        return element;
      }
    })
    res.status(200).send({ 
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;