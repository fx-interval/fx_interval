"use strict";

/* Mocks FixerFxRateSource for unit testing of getFxRatesForInterval. */
function MockedFxRateSource(fxRatesPerCurrencyPair) {
    this._fxRatesPerCurrencyPair = JSON.parse(JSON.stringify(fxRatesPerCurrencyPair));
    this._test_numLatestDateLookups = 0;
    this._test_numFxRateForDateLookups = 0;    
    this._test_fxRateForDateExceptions = [];
}

MockedFxRateSource.prototype.constructor = MockedFxRateSource;

MockedFxRateSource.prototype.getLatestDate = async function(fromCurrency, toCurrency) {
    this._test_numLatestDateLookups++;
    
    const dates = this._getCurrencyPairFxRates(fromCurrency, toCurrency)
        .map(fxRate => fxRate.date);
    return dates[dates.length - 1];
};

MockedFxRateSource.prototype.getFxRateForDate = async function(fromCurrency, toCurrency, date) {
    this._test_numFxRateForDateLookups++;
    const exception = this._test_fxRateForDateExceptions.find(exception =>
        exception.fromCurrency === fromCurrency && exception.toCurrency === toCurrency &&
        exception.date === date
    );
    if (exception !== undefined)
        throw new Error(exception.exception);

    return this._getFxRateForDate(fromCurrency, toCurrency, date);
};

MockedFxRateSource.prototype._getFxRateForDate = function(fromCurrency, toCurrency, date) {
    const fxRate = this._getCurrencyPairFxRates(fromCurrency, toCurrency)
        .find(fxRate => fxRate.date === date);
    return (fxRate === undefined) ? null : fxRate.fxRate;
};

MockedFxRateSource.prototype._getCurrencyPairFxRates = function(fromCurrency, toCurrency) {
    const fromCurrencyFxRates = this._fxRatesPerCurrencyPair.filter(fxRate => fxRate.fromCurrency === fromCurrency);
    if (fromCurrencyFxRates.length === 0)
        throw new Error('FxRateSource_InvalidFromCurrency');

    const currencyPairFxRates = fromCurrencyFxRates.find(fxRate => fxRate.toCurrency === toCurrency);
    if (currencyPairFxRates === undefined)
        throw new Error('FxRateSource_InvalidToCurrency');

    return currencyPairFxRates.fxRates
        .map(fxRate => ({ date: fxRate.date, fxRate: fxRate.fxRate }))
        .sort((fxRate1, fxRate2) => new Date(fxRate1.date) - new Date(fxRate2.date));
}

MockedFxRateSource.prototype.test_getNumLatestDateLookups = function() {
    return this._test_numLatestDateLookups;
};

MockedFxRateSource.prototype.test_getNumFxRateForDateLookups = function() {
    return this._test_numFxRateForDateLookups;
};

MockedFxRateSource.prototype.test_setFxRateForDateExceptions = function(fxRateForDateExceptions) {
    this._test_fxRateForDateExceptions = JSON.parse(JSON.stringify(fxRateForDateExceptions));
}

module.exports = MockedFxRateSource;
