"use strict";

const fxRateStorage = require('../FxRateStorage').getFxRateStorage();

function mock(req, res) {
    fxRateStorage.mock(req.body.fxRates);
    res.status(200).json({});
}

module.exports = mock;
