"use strict";

/* RethinkDb cache of fx rates per currency pair and date. The case fxRate = null means that there is no fx rate for 
   the currency pair and date. Keeps an open connection (using the promise this._conn) to the database. When finished
   using the cache the method destroy should be called in order to avoid leaking connections. */
function RethinkDbFxRateCache(dependencies) {
    this._dependencies = dependencies;
    this._connect();
}

RethinkDbFxRateCache.prototype.constructor = RethinkDbFxRateCache;

/* Gets fx rates from the cache for a currency pair and a date interval. The result is sorted by date. */
RethinkDbFxRateCache.prototype.getFxRates = async function(fromCurrency, toCurrency, fromDate, toDate) {
    const conn = await this._getConn();
    const r = this._dependencies.rethinkDb;

    return r
        .table('fxRates')
        .between(
            [fromCurrency, toCurrency, fromDate], [fromCurrency, toCurrency, toDate],
            { leftBound: 'closed', rightBound: 'closed' }
        )
        .map({ date: r.row('fromCurrencyToCurrencyDate')(2), fxRate: r.row('fxRate') })
        .orderBy(r.row('date'))
        .run(conn)
        .then(cursor => cursor.toArray())
}
/* Caches multiple fx rates for a currency pair. It is ok to add already cached fx rates long as their fxRate values are
   consistent with the cache. */
RethinkDbFxRateCache.prototype.setFxRates = async function(fromCurrency, toCurrency, nonCachedFxRates) {
    const conn = await this._getConn();
    const r = this._dependencies.rethinkDb;
    await r
        .table('fxRates')
        .insert(
            nonCachedFxRates.map(fxRate => ({
                fromCurrencyToCurrencyDate: [fromCurrency, toCurrency, fxRate.date],
                fxRate: fxRate.fxRate
            })),
            { conflict: 'update' } /* In case of already cached fx rates. */
        )
        .run(conn);
}

RethinkDbFxRateCache.prototype._connect = function() {
    this._conn = this._dependencies.rethinkDb.connect({
        host: this._dependencies.settings.rethinkDb.host,
        port: this._dependencies.settings.rethinkDb.port,
        db: this._dependencies.settings.rethinkDb.db
    }).then(
        conn => ({ success: true, conn }),
        err => ({ success: false, err })
    );
}
/* Get the connection and retry one time if connection failed or if the connection has been closed. */
RethinkDbFxRateCache.prototype._getConn = async function() {
    const conn = await this._conn;
    if (!conn.success || !conn.conn.open) {
        this._connect();
        const conn2 = await this._conn;
        if (!conn2.success)
            throw conn2.err;

        return conn2.conn;
    } else
        return conn.conn;
}

RethinkDbFxRateCache.prototype.destroy = async function() {
    const conn = await this._conn;
    if (conn.success && conn.conn.open)
        await conn.conn.close();    
}

RethinkDbFxRateCache.prototype.test_mock = async function(cachedFxRates) {
    const conn = await this._getConn();
    const r = this._dependencies.rethinkDb;
    await r.table('fxRates').delete().run(conn); 
    await r.table('fxRates').insert(cachedFxRates).run(conn);
}

RethinkDbFxRateCache.prototype.test_getCachedFxRates = async function() {
    const conn = await this._getConn();
    const r = this._dependencies.rethinkDb;
    return r
        .table('fxRates')
        .orderBy(r.row('fromCurrencyToCurrencyDate'))
        .run(conn)
        .then(cursor => cursor.toArray());
}

module.exports = RethinkDbFxRateCache;
