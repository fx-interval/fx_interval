"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const settings = require('./settings');
const route = require('./route');

const app = express();
app.use(bodyParser.json());

app.get('/latest', route.getFxRateLatest);
app.get('/:date([0-9]{4}-[0-9]{2}-[0-9]{2})', route.getFxRateForDate);
app.post('/test/mock', route.mock);

const port = settings.app.port;
const host = settings.app.host;
app.listen(port, host, () => {
    console.log(`Running on http://${host}:${port}`);
});
