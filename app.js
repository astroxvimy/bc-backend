/*
 * Module Imports
 * */
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const config = require('./config');
const Logger = require('./services/logger');
const saveBcRecent = require('./helpers/bc.helper');

/**
 * Global declarations
 */
const dbURL = config.server.mongoDBConnectionUrl;

/**
 * Bootstrap App
 */
const app = express();

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      ' X-Requested-With',
      ' Content-Type',
      ' Accept ',
      ' Authorization',
    ],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  }),
);

app.use(Logger.morgan);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
  }),
);
app.use(cookieParser());

let index = require('./routes/index');

app.use('/', index);

/**
 * Catch 404 routes
 */
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/**
 * Error Handler
 */
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json(err);
});

/**
 * Mongoose Configuration
 */
mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
  Logger.log.info('DATABASE - Connected');
});

mongoose.connection.on('error', (err) => {
  Logger.log.error('DATABASE - Error:' + err);
});

mongoose.connection.on('disconnected', () => {
  Logger.log.warn('DATABASE - disconnected  Retrying....');
});

let connectDb = function () {
  const dbOptions = {
    useNewUrlParser: true,
  };
  mongoose.connect(dbURL, dbOptions).catch((err) => {
    Logger.log.fatal('DATABASE - Error:' + err);
  });
};

connectDb();

saveBcRecent();

cron.schedule('*/1 * * * * *', () => {
  try {
    saveBcRecent();
  } catch {
    console.log('error occurred');
  }
});

module.exports = app;
