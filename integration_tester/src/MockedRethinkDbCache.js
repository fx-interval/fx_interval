"use strict";

const r = require('rethinkdb');
const settings = require('./settings');

var _mockedRethinkDbCache = null;
function getMockedRethinkDbCache() {
    if (_mockedRethinkDbCache === null)
        _mockedRethinkDbCache = new MockedRethinkDbCache();
    return _mockedRethinkDbCache;
}

function MockedRethinkDbCache() {
}

MockedRethinkDbCache.prototype.constructor = MockedRethinkDbCache;

MockedRethinkDbCache.prototype.mock = async function(mockedFixerApi, cachedDatesPerCurrencyPair) {
    const cachedDates = Array.prototype.concat.apply([], 
        cachedDatesPerCurrencyPair.map(currencyPair =>
            currencyPair.dates.map(date => ({
                fromCurrency: currencyPair.fromCurrency,
                toCurrency:   currencyPair.toCurrency,
                date
            }))
        )
    );
    const fxRates = mockedFixerApi.getFxRates();
    const cachedFxRates = cachedDates.map(currencyPairDate => ({
        fromCurrencyToCurrencyDate: [
            currencyPairDate.fromCurrency,
            currencyPairDate.toCurrency,
            currencyPairDate.date
        ],
        fxRate: (x => (x !== undefined) ? x.fxRate : null)(
            fxRates.find(fxRate =>
                fxRate.fromCurrency === currencyPairDate.fromCurrency &&
                fxRate.toCurrency === currencyPairDate.toCurrency &&
                fxRate.date === currencyPairDate.date
            )
        )
    }));

    const conn = await this._getConn();
    await r.table('fxRates').delete().run(conn);
    await r.table('fxRates').insert(cachedFxRates).run(conn);
}

MockedRethinkDbCache.prototype.getFxRatesPerCurrencyPair = async function() {
    const conn = await this._getConn();
    const fxRatesCursor = await r
        .table('fxRates')
        .map({
            fromCurrency: r.row('fromCurrencyToCurrencyDate')(0),
            toCurrency: r.row('fromCurrencyToCurrencyDate')(1),
            date: r.row('fromCurrencyToCurrencyDate')(2),
            fxRate: r.row('fxRate')
        })
        .group(r.row.pluck('fromCurrency', 'toCurrency'))
        .pluck('date', 'fxRate')
        .ungroup()
        .map({
            fromCurrency: r.row('group')('fromCurrency'),
            toCurrency: r.row('group')('toCurrency'),
            fxRates: r.row('reduction').orderBy(fxRate => fxRate('date'))
        })
        .orderBy(r.row('fromCurrency'), r.row('toCurrency'))
        .run(conn);
    return fxRatesCursor.toArray();
}

MockedRethinkDbCache.prototype._getConn = function() {
    return r.connect({
        host: settings.rethinkDb.host,
        port: settings.rethinkDb.port,
        db: settings.rethinkDb.db
    });
}

module.exports = { getMockedRethinkDbCache };
