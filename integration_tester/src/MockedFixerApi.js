"use strict";

const requestHandler = require('request-promise-native');
const settings = require('./settings');

var _mockedFixerApi = null;
function getMockedFixerApi() {
    if (_mockedFixerApi === null)
        _mockedFixerApi = new MockedFixerApi();
    return _mockedFixerApi;
}

function MockedFixerApi() {
    this._fxRates = [];
}

MockedFixerApi.prototype.constructor = MockedFixerApi;

MockedFixerApi.prototype.mock = async function(fxRatesPerCurrencyPair) {
    this._fxRates = Array.prototype.concat.apply([], 
        fxRatesPerCurrencyPair.map(currencyPair =>
            currencyPair.fxRates.map(fxRate => ({
                fromCurrency: currencyPair.fromCurrency,
                toCurrency:   currencyPair.toCurrency,
                date:         fxRate.date,
                fxRate:       fxRate.fxRate
            }))
        )
    );

    await requestHandler({
        baseUrl: settings.mockedFixerApi.baseUrl, url: 'test/mock',
        body: { fxRates: this._fxRates },
        method: 'POST', json: true, simple: true
    });
}

MockedFixerApi.prototype.getFxRates = function() {
    return JSON.parse(JSON.stringify(this._fxRates));
}

module.exports = { getMockedFixerApi };
