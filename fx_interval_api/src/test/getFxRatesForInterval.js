"use strict";

const assert = require('chai').assert;
const getFxRatesForInterval = require('../getFxRatesForInterval');
const MockedFxRateSource = require('../mock/MockedFxRateSource');
const MockedFxRateCache = require('../mock/MockedFxRateCache');

describe('getFxRatesForInterval function', () => {
    describe('Normal cases.', () => {
        runTest({
            name: 'Including too old dates: False, Including too new dates: False.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 4
        });

        runTest({
            name: 'Including too old dates: False, Including too new dates: True.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 3
        });

        runTest({
            name: 'Including too old dates: True, Including too new dates: False.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-06', '2017-04-07', '2017-04-11'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: null },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-05', fxRate: null },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 },
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 4
        });

        runTest({
            name: 'Including too old dates: True, Including too new dates: True.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: null },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-05', fxRate: null },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 3
        });

        runTest({
            name: 'toDate does not have any fx rate.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: null }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: null }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 4
        });

        runTest({
            name: 'Every date in interval is cached.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: [
                    '2017-04-04',
                    '2017-04-05', '2017-04-06', '2017-04-07', '2017-04-08', '2017-04-09', '2017-04-10'
                ]}
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: true,
                fxRates: [
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 }
                ]
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-08', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 }
                ]}
            ], expectedNumLatestDateLookups: 0,
            expectedNumFxRateForDateLookups: 0
        });
    });

    describe('Error cases.', () => {
        runTest({
            name: 'fromCurrency (not in fx source).',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'SEK', toCurrency: 'NOK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: false,
                exception: 'FxRateSource_InvalidFromCurrency'
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 0
        });
        
        runTest({
            name: 'toCurrency (not in fx source).',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'NOK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: false,
                exception: 'FxRateSource_InvalidToCurrency'
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 0
        });

        runTest({
            name: 'Other error.',
            fxRateSource: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 },
                    { date: '2017-04-07', fxRate: 8.98 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-09', fxRate: 8.00 },
                    { date: '2017-04-10', fxRate: 8.03 },
                    { date: '2017-04-11', fxRate: 8.01 }
                ]}
            ], fxRateForDateExceptions: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', date: '2017-04-07', exception: 'Some error.' },
                { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-08', exception: 'Something went wrong.' },
                { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-10', exception: 'Boom!' }
            ], fxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', dates: ['2017-04-06'] },
                { fromCurrency: 'USD', toCurrency: 'SEK', dates: ['2017-04-04', '2017-04-06', '2017-04-07'] }
            ], filter: {
                fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-05', toDate: '2017-04-10'
            }, expectedResult: {
                success: false,
                exception: 'GetFxRatesForInterval_SomeFxRateSourceRequestsFailed'
            }, expectedFxRateCache: [
                { fromCurrency: 'EUR', toCurrency: 'NOK', fxRates: [
                    { date: '2017-04-06', fxRate: 9.00 }
                ]},
                { fromCurrency: 'USD', toCurrency: 'SEK', fxRates: [
                    { date: '2017-04-04', fxRate: 7.84 },
                    { date: '2017-04-05', fxRate: 7.83 },
                    { date: '2017-04-06', fxRate: 7.91 },
                    { date: '2017-04-07', fxRate: null },
                    { date: '2017-04-09', fxRate: 8.00 }
                ]}
            ], expectedNumLatestDateLookups: 1,
            expectedNumFxRateForDateLookups: 4
        });
    });
});

function runTest(test) {
    const _test = JSON.parse(JSON.stringify(test));
    it(_test.name, async () => {
        const mockedFxRateSource = new MockedFxRateSource(_test.fxRateSource);
        const mockedFxRateCache = new MockedFxRateCache(mockedFxRateSource, _test.fxRateCache);

        if (_test.fxRateForDateExceptions !== undefined)
            mockedFxRateSource.test_setFxRateForDateExceptions(_test.fxRateForDateExceptions);

        try {
            const fxRates = await getFxRatesForInterval(
                { fxRateSource: mockedFxRateSource, fxRateCache: mockedFxRateCache },
                _test.filter.fromCurrency, _test.filter.toCurrency,
                _test.filter.fromDate, _test.filter.toDate
            );
            assert.deepEqual({ success: true, fxRates }, _test.expectedResult);
        } catch (e) {
            if (_test.expectedResult.success === false)
                assert.strictEqual(e.message, _test.expectedResult.exception);
            else
                throw e;
        }

        const fxRateCache = mockedFxRateCache.getFxRatesPerCurrencyPair();
        assert.deepEqual(fxRateCache, _test.expectedFxRateCache);

        assert.strictEqual(
            mockedFxRateSource.test_getNumFxRateForDateLookups(),
            _test.expectedNumFxRateForDateLookups
        );
        assert.strictEqual(
            mockedFxRateSource.test_getNumLatestDateLookups(),
            _test.expectedNumLatestDateLookups         
        );
    });
}
