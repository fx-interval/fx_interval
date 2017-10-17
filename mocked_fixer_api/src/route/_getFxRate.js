"use strict";

const fxRateStorage = require('../FxRateStorage').getFxRateStorage();

function _getFxRate(date, req, res) {
    const base = req.query.base;
    const symbols = req.query.symbols;

    if (base === undefined || symbols === undefined || symbols.indexOf(',') !== -1) {
        res.status(422).json({ error: 'This case has not been mocked.' });
        return;
    }

    if (!/^[A-Z]{3}$/.test(base)) {
        res.status(422).json({ error: 'Invalid base' });
        return;
    }
    if (!/^[A-Z]{3}$/.test(symbols)) {
        res.json({ rates: {} });
        return;
    }
    
    try {
        const fxRate = (date === null) ?
            fxRateStorage.getFxRateLatest(base, symbols) :
            fxRateStorage.getFxRateForDate(base, symbols, date);

        res.json({ date: fxRate.date, rates: { [symbols]: fxRate.fxRate } });
        return;
    } catch (e) {
        switch(e.message) {
            case 'FxRateStorage_DateTooOld':
                if (date === null)
                    throw e;
                
                res.status(422).json({ error: 'Date too old' });
                return;
            case 'FxRateStorage_InvalidFromCurrency':
                res.status(422).json({ error: 'Invalid base' });
                return;
            case 'FxRateStorage_InvalidToCurrency':
                res.status(200).json({ rates: {} });
                return;
            default:
                throw e;
        }
    }
}

module.exports = _getFxRate;
