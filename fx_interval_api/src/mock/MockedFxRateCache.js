"use strict";

/* Mocks RethinkDbFxRateCache for unit testing of getFxRatesForInterval. */
function MockedFxRateCache(mockedFxRateSource, cachedDatesPerCurrencyPair) {   
    this._cachedFxRatesPerCurrencyPair = cachedDatesPerCurrencyPair.map(currencyPair => ({
        fromCurrency: currencyPair.fromCurrency,
        toCurrency: currencyPair.toCurrency,
        fxRates: currencyPair.dates.map(
            date => ({
                date,
                fxRate: mockedFxRateSource._getFxRateForDate(currencyPair.fromCurrency, currencyPair.toCurrency, date)
            })
        )
    }));
}

MockedFxRateCache.prototype.constructor = MockedFxRateCache;

MockedFxRateCache.prototype.getFxRates = async function(fromCurrency, toCurrency, fromDate, toDate) {
    const currencyPair = this._cachedFxRatesPerCurrencyPair.find(currencyPair =>
        currencyPair.fromCurrency === fromCurrency && currencyPair.toCurrency === toCurrency
    );
    return (currencyPair === undefined ? [] : currencyPair.fxRates)
        .filter(fxRate => fromDate <= fxRate.date && fxRate.date <= toDate);
};

MockedFxRateCache.prototype.setFxRates = async function(fromCurrency, toCurrency, fxRates) {
    if (fxRates.length === 0)
        return;

    let currencyPair = this._cachedFxRatesPerCurrencyPair.find(currencyPair =>
        currencyPair.fromCurrency === fromCurrency && currencyPair.toCurrency === toCurrency
    );
    if (currencyPair === undefined)
        this._cachedFxRatesPerCurrencyPair.push({ fromCurrency, toCurrency, fxRates });
    else
        Array.prototype.push.apply(currencyPair.fxRates, fxRates);
};

MockedFxRateCache.prototype.getFxRatesPerCurrencyPair = function() {
    const fxRatesPerCurrencyPair = JSON.parse(JSON.stringify(this._cachedFxRatesPerCurrencyPair));

    fxRatesPerCurrencyPair.sort((currencyPair1, currencyPair2) => {
        if (currencyPair1.fromCurrency > currencyPair2.fromCurrency) return 1;
        if (currencyPair1.fromCurrency < currencyPair2.fromCurrency) return -1;
        if (currencyPair2.toCurrency > currencyPair2.toCurrency) return 1;
        if (currencyPair2.toCurrency < currencyPair2.toCurrency) return -1;
        return 0;
    });
    
    fxRatesPerCurrencyPair.forEach(currencyPair => {
        currencyPair.fxRates
            .sort((fxRate1, fxRate2) => new Date(fxRate1.date) - new Date(fxRate2.date));
    });

    return fxRatesPerCurrencyPair;
};

module.exports = MockedFxRateCache;
