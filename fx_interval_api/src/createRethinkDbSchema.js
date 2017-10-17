const r = require('rethinkdb');
const settings = require('./settings');

createRethinkDbSchema = async function() {
    if (!settings.rethinkDb.createSchema)
        return;
    
    let conn;
    const timeBetweenConnectionRetries = 500;
    while (true) {
        try {
            conn = await r.connect({
                host: settings.rethinkDb.host,
                port: settings.rethinkDb.port
            });
        } catch (e) {
            await new Promise((resolve, reject) => { setTimeout(resolve, timeBetweenConnectionRetries); });
            console.log('RethinkDb not ready yet. Trying again in ', timeBetweenConnectionRetries, 'ms.');
        }

        break;
    }

    const db = settings.rethinkDb.db;  
    await r.dbCreate(db).run(conn);
    await r.db(db).tableCreate('fxRates', {
        primaryKey: 'fromCurrencyToCurrencyDate'
    }).run(conn);
    
    conn.close();
}

module.exports = createRethinkDbSchema;
