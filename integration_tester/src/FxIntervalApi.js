"use strict";

const requestHandler = require('request-promise-native');
const settings = require('./settings');

var _fxIntervalApi = null;
function getFxIntervalApi() {
    if (_fxIntervalApi === null)
        _fxIntervalApi = new FxIntervalApi();
    return _fxIntervalApi;
}

function FxIntervalApi() {
}

FxIntervalApi.prototype.constructor = FxIntervalApi;

FxIntervalApi.prototype.getFxRatesForInterval = async function(fromCurrency, toCurrency, fromDate, toDate) { 
    let response;
    try {
        response = await requestHandler({
            baseUrl: settings.fxIntervalApi.baseUrl, url: 'api/getFxRatesForInterval',
            qs: { fromCurrency, toCurrency, fromDate, toDate },
            method: 'GET', json: true, simple: true
        });
    } catch (e) {
        if (e.response === undefined)
            throw e;

        return { success: false, response: e.response.body };
    }
    
    return { success: true, response };
}

module.exports = { getFxIntervalApi };
