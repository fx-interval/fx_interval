"use strict";

const moment = require('moment');
const _getFxRate = require('./_getFxRate');

function getFxRateForDate(req, res) {
    const date = req.params.date;
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        res.status(422).json({ error: 'Invalid date' });
        return;
    }
    _getFxRate(date, req, res);
}

module.exports = getFxRateForDate;
