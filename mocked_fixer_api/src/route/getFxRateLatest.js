"use strict";

const _getFxRate = require('./_getFxRate');

function getFxRateLatest(req, res) {
    _getFxRate(null, req, res);
}

module.exports = getFxRateLatest;
