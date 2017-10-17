"use strict";

const express = require('express');
const requestHandler = require('request-promise-native');
const rethinkDb = require('rethinkdb');
const settings = require('./settings');
const createRethinkDbSchema = require('./createRethinkDbSchema');
const FixerFxRateSource = require('./FixerFxRateSource');
const RethinkDbFxRateCache = require('./RethinkDbFxRateCache');
const _getFxRatesForInterval = require('./getFxRatesForInterval');
const _route = require('./route');

(async () => {
    await createRethinkDbSchema();

    const app = express();
    const route = {};

    const fxRateSource = new FixerFxRateSource({ settings, requestHandler });
    const fxRateCache = new RethinkDbFxRateCache({ settings, rethinkDb });
    const getFxRatesForInterval = _getFxRatesForInterval.bind(null, { fxRateSource, fxRateCache });
    route.getFxRatesForInterval = _route.getFxRatesForInterval.bind(null, { getFxRatesForInterval });
    app.get('/api/getFxRatesForInterval', route.getFxRatesForInterval);

    const host = settings.app.host;
    const port = settings.app.port;
    app.listen(port, host, () => {
        console.log(`Running on http://${host}:${port}`);
    });
})();
