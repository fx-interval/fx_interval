"use strict";

const assert = require('chai').assert; 
const mockedFixerApi = require('../MockedFixerApi').getMockedFixerApi();
const mockedRethinkDbCache = require('../MockedRethinkDbCache').getMockedRethinkDbCache();
const fxIntervalApi = require('../FxIntervalApi').getFxIntervalApi();

describe('GetFxRatesForInterval', () => {
    describe('Valid requests', () => {
        runTest({
            name: 'General case',
            fixerApi: [{ fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.01 },
                    { date: '2017-04-07', fxRate: 9.02 }
                ]}, { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-05', fxRate: 8.01 },
                    { date: '2017-04-06', fxRate: 8.07 },
                    { date: '2017-04-08', fxRate: 8.05 },
                    { date: '2017-04-10', fxRate: 7.99 }
                ]}
            ], rethinkDbCache: [
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: [
                    '2017-04-05',
                    '2017-04-07',
                    '2017-04-10'
                ]}            
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-07', toDate: '2017-04-11'
            }, expectedResult: {
                success: true,
                response: {
                    fxRates: [
                        { date: '2017-04-07', fxRate: null },
                        { date: '2017-04-08', fxRate: 8.05 },
                        { date: '2017-04-09', fxRate: null },
                        { date: '2017-04-10', fxRate: 7.99 }
                    ]
                }
            }, expectedRethinkDbCache: [
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-05', fxRate: 8.01 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: 8.05 },
                    { date: '2017-04-09', fxRate: null },
                    { date: '2017-04-10', fxRate: 7.99 }
                ]}
            ]
        });
    });

    describe('Invalid', () => {
        const commonTestPart = {
            fixerApi: [
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-18', fxRate: 7.87 },
                    { date: '2017-04-20', fxRate: 8.07 }
                ]}
            ], rethinkDbCache: [
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: [
                    '2017-04-18',
                    '2017-04-19'
                ]}            
            ], expectedRethinkDbCache: [
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-18', fxRate: 7.87 },
                    { date: '2017-04-19', fxRate: null }
                ]}
            ]
        };
        const validFilter = {
            fromCurrency: 'USD', toCurrency: 'SEK',
            fromDate: '2017-04-17', toDate: '2017-04-21'
        };
        [
            {
                name: 'fromCurrency (missing)',
                filter: { ...validFilter, fromCurrency: undefined },
                expectedError: 'Missing fromCurrency.'
            }, {
                name: 'toCurrency (missing)',
                filter: { ...validFilter, toCurrency: undefined },
                expectedError: 'Missing toCurrency.'
            }, {
                name: 'fromDate (missing)',
                filter: { ...validFilter, fromDate: undefined },
                expectedError: 'Missing fromDate.'
            }, {
                name: 'toDate (missing)',
                filter: { ...validFilter, toDate: undefined },
                expectedError: 'Missing toDate.'
            }, {
                name: 'fromCurrency (invalid pattern)',
                filter: { ...validFilter, fromCurrency: 'iN_\'vA+lId.' },
                expectedError: 'Invalid fromCurrency.'
            }, {
                name: 'fromCurrency (not in fx rate source)',
                filter: { ...validFilter, fromCurrency: 'SEK', toCurrency: 'USD' },
                expectedError: 'Invalid fromCurrency.'
            }, {
                name: 'toCurrency (invalid pattern)',
                filter: { ...validFilter, toCurrency: 'iN_\'vAl+Id.' },
                expectedError: 'Invalid toCurrency.'
            }, {
                name: 'toCurrency (not in fx rate source)',
                filter: { ...validFilter, toCurrency: 'PLN' },
                expectedError: 'Invalid toCurrency.'
            }, {
                name: 'fromCurrency toCurrency (equal)',
                filter: { ...validFilter, fromCurrency: 'PLN', toCurrency: 'PLN' },
                expectedError: 'fromCurrency and toCurrency should not be the same.'
            }, {
                name: 'fromDate (invalid)',
                filter: { ...validFilter, fromDate: '2017-04-32' },
                expectedError: 'Invalid fromDate.'
            }, {
                name: 'toDate (invalid)',
                filter: { ...validFilter, toDate: '2017-04-33' },
                expectedError: 'Invalid toDate.'
            }, {
                name: 'fromDate toDate (invalid order)',
                filter: { ...validFilter, fromDate: validFilter.toDate, toDate: validFilter.fromDate },
                expectedError: 'Invalid order between fromDate and toDate.'
            }
        ].forEach(test => {
            runTest({
                name: test.name,
                ...commonTestPart,
                filter: test.filter,
                expectedResult: {
                    success: false,
                    response: { error: test.expectedError }
                }
            });
        });
    });
});

async function runTest(test) {
    const _test = JSON.parse(JSON.stringify(test));
    it(_test.name, async () => {
        await mockedFixerApi.mock(_test.fixerApi);
        await mockedRethinkDbCache.mock(mockedFixerApi, _test.rethinkDbCache);

        const result = await fxIntervalApi.getFxRatesForInterval(
            _test.filter.fromCurrency, _test.filter.toCurrency,
            _test.filter.fromDate, _test.filter.toDate
        );
        assert.deepEqual(result, _test.expectedResult);

        const rethinkDbCache = await mockedRethinkDbCache.getFxRatesPerCurrencyPair();
        assert.deepEqual(rethinkDbCache, _test.expectedRethinkDbCache);
    });
}
