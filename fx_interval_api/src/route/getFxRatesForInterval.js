"use strict";

const moment = require('moment');

/* This route handles request for getting fx rates for a currency pair and date interval. If a date does not have an
   fx rate we will have fxRate === null in the result for that date. If a date is too new to have an fx rate yet 
   (may get an fx rate later) the date will not be included in the result. */
async function getFxRatesForInterval(dependencies, req, res) {
    const fromCurrency = req.query.fromCurrency;
    const toCurrency = req.query.toCurrency;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    let error;
    if (fromCurrency === undefined)
        error = 'Missing fromCurrency.';
    else if (toCurrency === undefined)
        error = 'Missing toCurrency.';
    else if (fromDate === undefined)
        error = 'Missing fromDate.';
    else if (toDate === undefined)
        error = 'Missing toDate.';
    else if (!/^[A-Z]{3}$/.test(fromCurrency))
        error = 'Invalid fromCurrency.';
    else if (!/^[A-Z]{3}$/.test(toCurrency))
        error = 'Invalid toCurrency.';
    else if (fromCurrency === toCurrency)
        error = 'fromCurrency and toCurrency should not be the same.';
    else if (!moment(fromDate, 'YYYY-MM-DD', true).isValid())
        error = 'Invalid fromDate.';
    else if (!moment(toDate, 'YYYY-MM-DD', true).isValid())
        error = 'Invalid toDate.';
    else if (fromDate > toDate)
        error = 'Invalid order between fromDate and toDate.';

    if (error !== undefined) {
        res.status(422).json({ error });
        return;
    }        

    try {
        const fxRates = await dependencies.getFxRatesForInterval(fromCurrency, toCurrency, fromDate, toDate);
        res.status(200).json({ fxRates });
        return;
    } catch (e) {
        if (e.message === 'FxRateSource_InvalidFromCurrency') {
            res.status(422).json({ error: 'Invalid fromCurrency.' });
            return;
        } else if (e.message === 'FxRateSource_InvalidToCurrency') {
            res.status(422).json({ error: 'Invalid toCurrency.' });
            return;
        } else {
            res.status(500).json({ error: 'Unexpected error. Try again.' });
            return;
        }
    }
}

module.exports = getFxRatesForInterval;
