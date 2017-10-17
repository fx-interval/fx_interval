/* TODO: Add a limit to the size of the fx request queue. */

"use strict";

const moment = require('moment');

/* Used for getting fx rates from the fx rate api called fixer. Two methods are used for this:

   * getLatestDate: Get the latest date that has an fx rate for a currency pair.
   * getFxRateForDate: Get the fx rate for a currency pair and a date.

   If fromCurrency or toCurrency is not supported by the fixer api both methods will throw an
   Error('FxRateSource_InvalidFromCurrency') or an Error('FxRateSource_InvalidToCurrency') exception respectivley.

   Due to a limitation of the fixer api we cannot distinguish between dates that does not have fx rates and dates
   that are too new to have fx rates yet (may get an fx rate later). In both cases the method getFxRateForDate will 
   return null. The method getLatestDate can be used to solve this problem (any date after the date it returns is 
   too new to have an fx rate yet).
   
   Becuase the fixer api is very sensitive to overloading (especially with parallell requests) we are sending
   requests to it one at a time using the queue this._fxRequestQueue. We are also retrying requests after waiting 
   some time in case the fixer api respons with a rate limit error (indicating overloading). */
function FixerFxRateSource(dependencies) {
    this._dependencies = dependencies;
    this._fxRequestQueue = [];
}

FixerFxRateSource.prototype.constructor = FixerFxRateSource;

FixerFxRateSource.prototype.getLatestDate = function(fromCurrency, toCurrency) {
    return this._queueFxRequest(fromCurrency, toCurrency, null);
};

FixerFxRateSource.prototype.getFxRateForDate = function(fromCurrency, toCurrency, date) {
    return this._queueFxRequest(fromCurrency, toCurrency, date);
}

FixerFxRateSource.prototype._queueFxRequest = function(fromCurrency, toCurrency, date) {
    const fxRequest = {};
    const startFxRequest = new Promise((resolve, reject) => {
        fxRequest.start = function() { resolve(undefined); }
    });
    fxRequest.latestDateOrFxRate = this._getLatestDateOrFxRate(fromCurrency, toCurrency, date, startFxRequest);

    /* If there are no fx requests before this fx request in the queue it will not get started unless we start it
       here. Fx requests are normally started when the fx request before it in the queue is finished. */
    this._fxRequestQueue.push(fxRequest);
    if (this._fxRequestQueue.length === 1)
        fxRequest.start();

    return fxRequest.latestDateOrFxRate;
}

FixerFxRateSource.prototype._getLatestDateOrFxRate = async function(fromCurrency, toCurrency, date, startFxRequest) {
    try {
        await startFxRequest;

        /* Get the date or the fx rate from the fixer api and handle rate limit problems by waiting and retrying. */
        let latestDateOrFxRate;
        const rateLimitRetries = this._dependencies.settings.FixerFxRateSource.rateLimitRetries;        
        let numAttempts = 0;
        const maxNumAttempts = rateLimitRetries.maxNumAttempts;
        let timeUntilNextAttempt = rateLimitRetries.initialTimeUntilNextAttempt;
        while (true) {
            try {
                numAttempts++;
                latestDateOrFxRate = await this._getLatestDateOrFxRateFromFixerApi(fromCurrency, toCurrency, date);
            } catch (e) {
                if (numAttempts === maxNumAttempts)
                    throw e;

                if (e.message === 'FxRateSource_RateLimit') {
                    await new Promise((resolve, reject) => { setTimeout(resolve, timeUntilNextAttempt); });
                    timeUntilNextAttempt *= 2;
                    continue;
                } else
                    throw e;
            }

            break;
        }

        return latestDateOrFxRate;
    /* Even if the fx rate request failed we still need to remove it from the queue and start
       the next fx request in queue (if any). */
    } finally {
        this._fxRequestQueue.shift();
        if (this._fxRequestQueue.length !== 0)
            this._fxRequestQueue[0].start();
    }
}

/* Handles communication with the fixer api. */
FixerFxRateSource.prototype._getLatestDateOrFxRateFromFixerApi = async function(fromCurrency, toCurrency, date) {
    let res;
    const url = (date === null) ? 'latest' : date;
    try {
        res = await this._dependencies.requestHandler({
            baseUrl: this._dependencies.settings.fixerApi.baseUrl, url,
            qs: { base: fromCurrency, symbols: toCurrency },
            method: 'GET', json: true, simple: true
        });
    } catch(e) {
        if (e.response === undefined)
            throw e;
        switch (e.response.body.error) {
            case 'Invalid base':
                throw new Error('FxRateSource_InvalidFromCurrency');
            case 'Date too old':
                if (date === null)
                    throw new Error('FxRateSource_UnexpectedFixerApiBehaviour Got "Date too old" when requesting latest fx rate.')
                else
                    return null;
            case 'Rate limit exceeded':
                throw new Error('FxRateSource_RateLimit');
            default:
                throw e;
        }
    }

    const resFxRate = res.rates[toCurrency];
    if (resFxRate === undefined)
        throw new Error('FxRateSource_InvalidToCurrency');            
    if (!Number.isFinite(resFxRate) || resFxRate <= 0)
        throw new Error('FxRateSource_UnexpectedFixerApiBehaviour Corrupt fx rate.');

    const resDate = res.date;
    if (!moment(resDate, 'YYYY-MM-DD', true).isValid())
        throw new Error('FxRateSource_UnexpectedFixerApiBehaviour Corrupt date.');
    
    if (date === null)
        return resDate;
    else {
        let fxRate;
        if (resDate < date)
            fxRate = null;
        else if (resDate === date)
            fxRate = resFxRate;
        else
            throw new Error('FxRateSource_UnexpectedFixerApiBehaviour Got newer date than requested.');

        return fxRate;
    }
}

FixerFxRateSource.prototype.test_getFxRequestQueueLength = function() {
    return this._fxRequestQueue.length;
}

module.exports = FixerFxRateSource;
