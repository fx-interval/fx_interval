"use strict";

const assert = require('chai').assert;
const sinon = require('sinon');
const route = require('../../route');

describe('route.getFxRatesForInterval function', () => {  
    describe('Invalid requests', () => {
        const validQueryStrings = {
            fromCurrency: 'USD', toCurrency: 'SEK',
            fromDate: '2017-04-11', toDate: '2017-04-25'
        };
        [
            {
                name: 'fromCurrency (missing).',
                queryStrings: { ...validQueryStrings, fromCurrency: undefined },
                expectedHttpStatus: 422, expectedResponseError: 'Missing fromCurrency.'
            }, {
                name: 'toCurrency (missing).',
                queryStrings: { ...validQueryStrings, toCurrency: undefined },
                expectedHttpStatus: 422, expectedResponseError: 'Missing toCurrency.'      
            }, {
                name: 'fromDate (missing).',
                queryStrings: { ...validQueryStrings, fromDate: undefined },
                expectedHttpStatus: 422, expectedResponseError: 'Missing fromDate.'
            }, {
                name: 'toDate (missing).',
                queryStrings: { ...validQueryStrings, toDate: undefined },
                expectedHttpStatus: 422, expectedResponseError: 'Missing toDate.'
            }, {
                name: 'fromCurrency (invalid pattern).',
                queryStrings: { ...validQueryStrings, fromCurrency: 'iNv\'aL-ID?' },
                expectedHttpStatus: 422, expectedResponseError: 'Invalid fromCurrency.'
            }, {
                name: 'toCurrency (invalid pattern).',
                queryStrings: { ...validQueryStrings, toCurrency: 'iNv\'aL-ID?' },
                expectedHttpStatus: 422, expectedResponseError: 'Invalid toCurrency.'
            }, {
                name: 'fromDate (invalid).',
                queryStrings: { ...validQueryStrings, fromDate: '2017-04-37' },
                expectedHttpStatus: 422, expectedResponseError: 'Invalid fromDate.'
            }, {
                name: 'fromCurrency toCurrency (equal).',
                queryStrings: { ...validQueryStrings, fromCurrency: 'PLN', toCurrency: 'PLN' },
                expectedHttpStatus: 422, expectedResponseError: 'fromCurrency and toCurrency should not be the same.'
            }, {
                name: 'toDate (invalid).',
                queryStrings: { ...validQueryStrings, toDate: '2017-14-11' },
                expectedHttpStatus: 422, expectedResponseError: 'Invalid toDate.'
            }, {
                name: 'fromDate toDate (invalid order).',
                queryStrings: {
                    ...validQueryStrings,
                    fromDate: validQueryStrings.toDate, toDate: validQueryStrings.fromDate
                }, 
                expectedHttpStatus: 422, expectedResponseError: 'Invalid order between fromDate and toDate.'
            }, {
                name: 'fromCurrency (not in fx rate source).',
                queryStrings: { ...validQueryStrings, fromCurrency: 'PLN' },
                exception: 'FxRateSource_InvalidFromCurrency',
                expectedHttpStatus: 422, expectedResponseError: 'Invalid fromCurrency.'
            }, {
                name: 'toCurrency (not in fx rate source).',
                queryStrings: { ...validQueryStrings, toCurrency: 'PLN' },
                exception: 'FxRateSource_InvalidToCurrency',
                expectedHttpStatus: 422, expectedResponseError: 'Invalid toCurrency.'
            }, {
                name: 'Unexpected error.',
                queryStrings: { ...validQueryStrings },
                exception: 'Something went wrong.',
                expectedHttpStatus: 500, expectedResponseError: 'Unexpected error. Try again.'
            }
        ].forEach(test => { runTest(test); });
    });

    describe('Valid requests', () => {
        const fxRates = [
            { date: '2017-04-04', fxRate: null },
            { date: '2017-04-05', fxRate: 7.89 },
            { date: '2017-04-06', fxRate: null },
            { date: '2017-04-07', fxRate: 7.88 }
        ];
        runTest({
            name: 'General case',
            queryStrings: { fromCurrency: 'USD', toCurrency: 'SEK', fromDate: '2017-04-04', toDate: '2017-04-08' },
            fxRates,
            expectedHttpStatus: 200, expectedResponseBody: { fxRates }
        });
    });
});

function runTest(test) {
    const _test = JSON.parse(JSON.stringify(test));
    it(_test.name, async () => {
        const request = { query: _test.queryStrings };
        
        const response = { status: sinon.stub(), json: sinon.spy() };
        response.status.returns(response);

        const getFxRatesForIntervalStub = sinon.stub();
        if (_test.fxRates !== undefined)
            getFxRatesForIntervalStub.returns(Promise.resolve(_test.fxRates));
        else if (_test.exception !== undefined)
            getFxRatesForIntervalStub.returns(Promise.reject(new Error(_test.exception)));
        
        await route.getFxRatesForInterval({ getFxRatesForInterval: getFxRatesForIntervalStub }, request, response);

        assert(getFxRatesForIntervalStub.callCount <= 1);
        if (getFxRatesForIntervalStub.callCount === 1) {
            assert(getFxRatesForIntervalStub.alwaysCalledWithExactly(
                _test.queryStrings.fromCurrency, _test.queryStrings.toCurrency,
                _test.queryStrings.fromDate, _test.queryStrings.toDate            
            ));
        }

        assert(response.status.calledOnce);
        assert(response.status.alwaysCalledWithExactly(_test.expectedHttpStatus));

        assert(response.json.calledOnce);
        if (_test.expectedResponseError !== undefined)
            assert.deepEqual(response.json.args[0], [{ error: _test.expectedResponseError }]);
        else
            assert.deepEqual(response.json.args[0], [_test.expectedResponseBody]);

        assert(response.json.calledAfter(response.status));
    });
}
