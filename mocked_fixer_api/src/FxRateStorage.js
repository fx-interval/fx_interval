"use strict";

var _fxRateStorage = null;
function getFxRateStorage() {
    if (_fxRateStorage === null)
        _fxRateStorage = new FxRateStorage();
    return _fxRateStorage;
}

function FxRateStorage() {
    this._fxRates = [];
}

FxRateStorage.prototype.constructor = FxRateStorage;

FxRateStorage.prototype.mock = function(fxRates) {
    this._fxRates = JSON.parse(JSON.stringify(fxRates));
}

FxRateStorage.prototype.getFxRateForDate = function(fromCurrency, toCurrency, date) {
    const currencyPairFxRates = this._getCurrencyPairFxRates(fromCurrency, toCurrency);

    const fxRate = currencyPairFxRates.find(fxRate => fxRate.date === date);

    if (fxRate === undefined) {
        const earlierFxRates = currencyPairFxRates.filter(fxRate => fxRate.date < date);
        if (earlierFxRates.length === 0)
            throw new Error('FxRateStorage_DateTooOld');
        
        const earlierFxRate = earlierFxRates[earlierFxRates.length - 1];
        
        return { date: earlierFxRate.date, fxRate: earlierFxRate.fxRate };
    } else
        return { date: fxRate.date, fxRate: fxRate.fxRate };
}

FxRateStorage.prototype.getFxRateLatest = function(fromCurrency, toCurrency) {
    const currencyPairFxRates = this._getCurrencyPairFxRates(fromCurrency, toCurrency);

    const latestFxRate = currencyPairFxRates[currencyPairFxRates.length - 1];
    
    return { date: latestFxRate.date, fxRate: latestFxRate.fxRate };
}

FxRateStorage.prototype._getCurrencyPairFxRates = function(fromCurrency, toCurrency) {
    const fromCurrencyFxRates = this._fxRates.filter(fxRate => fxRate.fromCurrency === fromCurrency);
    if (fromCurrencyFxRates.length === 0)
        throw new Error('FxRateStorage_InvalidFromCurrency');

    const currencyPairFxRates = fromCurrencyFxRates.filter(fxRate => fxRate.toCurrency === toCurrency);
    if (currencyPairFxRates.length === 0)
        throw new Error('FxRateStorage_InvalidToCurrency');

    return currencyPairFxRates
        .map(fxRate => ({ date: fxRate.date, fxRate: fxRate.fxRate }))
        .sort((fxRate1, fxRate2) => new Date(fxRate1.date) - new Date(fxRate2.date));
}

module.exports = { getFxRateStorage };
