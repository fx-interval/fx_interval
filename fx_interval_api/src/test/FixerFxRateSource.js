'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const FixerFxRateSource = require('../FixerFxRateSource');

describe('FixerFxRateSource class', () => {
    it('Many different cases in the same fx request queue.', async () => {
        const settings = {
            FixerFxRateSource: { rateLimitRetries: {
                maxNumAttempts: 3,
                initialTimeUntilNextAttempt: 0
            }}, fixerApi: {
                baseUrl: 'fixer_api_base_url'
            }
        };
        const requestHandler = sinon.stub(); 
        const fixerFxRateSource = new FixerFxRateSource({ settings, requestHandler });
        
        let callNum = 0, numFxRequests = 0;
        const fxRequests = [], expectedResults = []; 
        function addFxRequestTest(test) {
            /* Set up the requestHandler sub. */
            let numAttempts = 0;
            const maxNumRateLimitAttempts = settings.FixerFxRateSource.rateLimitRetries.maxNumAttempts;
            const numRateLimits = (test.numRateLimits !== undefined) ? test.numRateLimits : 0;
            while (true) {
                if (numAttempts === maxNumRateLimitAttempts)
                    break;
                /* Set up initial series of requests that will fail because of rate limits. */
                else if (numAttempts < numRateLimits)
                    requestHandler.onCall(callNum++).rejects({ response: { body: { error: 'Rate limit exceeded' } } });
                /* Set up the first request not to fail due to rate limits. */    
                else if (numAttempts === numRateLimits) {
                    /* Case 1: Set up a problem with getting the response. */
                    if (test.responseException !== undefined)
                        requestHandler.onCall(callNum++).rejects(new Error(test.responseException));
                    /* Case 2: Set up a response with an error message. */
                    else if (test.responseError !== undefined)
                        requestHandler.onCall(callNum++).rejects({ response: { body: { error: test.responseError } } });
                    /* Case 3: Set up a normal response (no errors). */
                    else
                        requestHandler.onCall(callNum++).resolves(test.responseBody);
                } else
                    break;

                numAttempts++;
            }
        
            const fxRequest = (test.request.date === null) ?
                fixerFxRateSource.getLatestDate(test.request.fromCurrency, test.request.toCurrency) :
                fixerFxRateSource.getFxRateForDate(test.request.fromCurrency, test.request.toCurrency, test.request.date);
            fxRequests.push(fxRequest);

            expectedResults.push(test.expectedResult);
            
            assert.strictEqual(fixerFxRateSource.test_getFxRequestQueueLength(), ++numFxRequests);
        }

        [
            {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-07' },
                responseBody: { date: '2017-04-07', rates: { SEK: 8.11 } },
                numRateLimits: 1,
                expectedResult: { success: true, fxRateOrDate: 8.11 }
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-08' },
                responseBody: { date: '2017-04-07', rates: { SEK: 8.11 } },
                expectedResult: { success: true, fxRateOrDate: null }            
            }, {
                request: { fromCurrency: 'PLN', toCurrency: 'SEK', date: '2017-04-10' },
                responseError: 'Invalid base',
                numRateLimits: 2,
                expectedResult: { success: false, exception: 'FxRateSource_InvalidFromCurrency' }
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'PLN', date: '2017-04-10' },
                responseBody: { rates: {} },
                expectedResult: { success: false, exception: 'FxRateSource_InvalidToCurrency' }            
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-02' },
                responseError: 'Date too old',
                expectedResult: { success: true, fxRateOrDate: null }          
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-12' },
                responseException: 'Something went wrong.',
                numRateLimits: 1,
                expectedResult: { success: false, exception: 'Something went wrong.' }
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: '2017-04-13' },
                responseBody: { date: '2017-04-11', rates: { SEK: 7.97 } },
                numRateLimits: 3,
                expectedResult: { success: false, exception: 'FxRateSource_RateLimit' }       
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: null },
                responseBody: { date: '2017-04-15', rates: { SEK: 7.92 } },
                expectedResult: { success: true, fxRateOrDate: '2017-04-15' }        
            }, {
                request: { fromCurrency: 'PLN', toCurrency: 'SEK', date: null },
                responseError: 'Invalid base',
                expectedResult: { success: false, exception: 'FxRateSource_InvalidFromCurrency' }        
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'PLN', date: null },
                responseBody: { rates: {} },
                numRateLimits: 2,
                expectedResult: { success: false, exception: 'FxRateSource_InvalidToCurrency' }
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: null },
                responseException: 'Boom!',
                expectedResult: { success: false, exception: 'Boom!' }
            }, {
                request: { fromCurrency: 'USD', toCurrency: 'SEK', date: null },
                responseBody: { date: '2017-04-15', rates: { SEK: 7.92 } },
                numRateLimits: 3,
                expectedResult: { success: false, exception: 'FxRateSource_RateLimit' }
            }
        ].forEach(test => {
            addFxRequestTest(test);
        });

        const results = await Promise.all(fxRequests.map(
            fxRequest => fxRequest.then(
                fxRateOrDate => ({ success: true, fxRateOrDate }),
                err => ({ success: false, exception: err.message })
            )
        ));

        assert.deepEqual(results, expectedResults);
        assert.strictEqual(fixerFxRateSource.test_getFxRequestQueueLength(), 0);
    });
});
