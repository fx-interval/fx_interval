"use strict";

const assert = require('chai').assert;
const rethinkDb = require('rethinkdb');
const settings = require('../settings');
const RethinkDbFxRateCache = require('../RethinkDbFxRateCache');

describe('RethinkDbFxRateCache class', () => {  
    describe('getFxRates method', () => {
        it('General case', async () => {
            const rethinkDbFxRateCache = new RethinkDbFxRateCache({ settings, rethinkDb });
            await rethinkDbFxRateCache.test_mock([
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-04'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-13'], fxRate: 9.40 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-02'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-03'], fxRate: 7.82 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-04'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-13'], fxRate: 8.02 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-14'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-15'], fxRate: 7.88 }
            ]);

            const fxRates = await rethinkDbFxRateCache.getFxRates('USD', 'SEK', '2017-04-03', '2017-04-14');
            assert.deepEqual(fxRates, [
                { date: '2017-04-03', fxRate: 7.82 },
                { date: '2017-04-04', fxRate: null },
                { date: '2017-04-13', fxRate: 8.02 },
                { date: '2017-04-14', fxRate: null },
            ]);

            await rethinkDbFxRateCache.destroy();
        });
    });

    describe('setFxRates method', () => {
        it('Existing currency pair', async () => {
            const rethinkDbFxRateCache = new RethinkDbFxRateCache({ settings, rethinkDb });
            await rethinkDbFxRateCache.test_mock([
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-05'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-07'], fxRate: 9.33 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-03'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-05'], fxRate: 7.99 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-07'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-08'], fxRate: 7.85 }
            ]);

            await rethinkDbFxRateCache.setFxRates('USD', 'SEK', [
                { date: '2017-04-02', fxRate: 7.83 },
                { date: '2017-04-04', fxRate: null },
                { date: '2017-04-07', fxRate: null },
                { date: '2017-04-08', fxRate: 7.85 }                
            ]);

            assert.deepEqual(await rethinkDbFxRateCache.test_getCachedFxRates(), [
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-05'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-07'], fxRate: 9.33 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-02'], fxRate: 7.83 },               
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-03'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-04'], fxRate: null }, 
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-05'], fxRate: 7.99 },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-07'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-08'], fxRate: 7.85 }
            ]); 

            await rethinkDbFxRateCache.destroy();
        });

        it('New currency pair', async () => {
            const rethinkDbFxRateCache = new RethinkDbFxRateCache({ settings, rethinkDb });
            await rethinkDbFxRateCache.test_mock([
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-03'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-05'], fxRate: 7.97 }
            ]);

            await rethinkDbFxRateCache.setFxRates('EUR', 'NOK', [
                { date: '2017-04-03', fxRate: 7.83 },
                { date: '2017-04-05', fxRate: null },
               
            ]);

            assert.deepEqual(await rethinkDbFxRateCache.test_getCachedFxRates(), [
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-03'], fxRate: 7.83 },
                { fromCurrencyToCurrencyDate: ['EUR', 'NOK', '2017-04-05'], fxRate: null },                
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-03'], fxRate: null },
                { fromCurrencyToCurrencyDate: ['USD', 'SEK', '2017-04-05'], fxRate: 7.97 }
            ]); 

            await rethinkDbFxRateCache.destroy();
        });
    });
});
