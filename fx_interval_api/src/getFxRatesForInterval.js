"use strict";

const moment = require('moment'); require('twix');

/* This function returns fx rates for a currency pair and a date interval. Dates that does not have an fx rate will
   have fxRate = null. Dates that are too new to have an fx rate yet are not included in the result. */
async function getFxRatesForInterval(dependencies, fromCurrency, toCurrency, fromDate, toDate) {
    const cachedFxRates = await dependencies.fxRateCache.getFxRates(fromCurrency, toCurrency, fromDate, toDate);

    const allDates = moment.twix(moment.utc(fromDate), moment.utc(toDate)).toArray('day')
        .map(date => date.format('YYYY-MM-DD'));
    const cachedDates = cachedFxRates.map(fxRate => fxRate.date);
    const nonCachedDates = allDates.filter(date => cachedDates.indexOf(date) === -1);

    if (nonCachedDates.length === 0)
        return cachedFxRates.sort((fxRate1, fxRate2) => new Date(fxRate1.date) - new Date(fxRate2.date));

    /* We need this value in order to distinguish between a date that have no fx rate and a date that is too new to 
       have an fx rate yet. In both cases dependencies.fxRateSource.getFxRateForDate will return null. */
    const latestDate = await dependencies.fxRateSource.getLatestDate(fromCurrency, toCurrency);

    const nonCachedFxRates = await Promise.all(
        nonCachedDates.filter(date => date <= latestDate)
            .map(date =>
                dependencies.fxRateSource.getFxRateForDate(fromCurrency, toCurrency, date)
                    .then(
                        fxRate => ({ success: true,  date, fxRate }),
                        err    => ({ success: false, date, err })
                    )
            )
    );

    /* Even if some calls to dependencies.fxRateSource.getFxRateForDate fail we will still cache fx rates for the 
       successful calls. */
    const nonCachedFxRatesOk = nonCachedFxRates.filter(fxRate => fxRate.success)
        .map(fxRate => ({ date: fxRate.date, fxRate: fxRate.fxRate }));
    await dependencies.fxRateCache.setFxRates(fromCurrency, toCurrency, nonCachedFxRatesOk);

    if (nonCachedFxRates.find(fxRate => !fxRate.success) !== undefined)
        throw Error('GetFxRatesForInterval_SomeFxRateSourceRequestsFailed');

    return cachedFxRates.filter(fxRate => fxRate.date <= latestDate).concat(nonCachedFxRatesOk)
        .sort((fxRate1, fxRate2) => new Date(fxRate1.date) - new Date(fxRate2.date));
}

module.exports = getFxRatesForInterval;
