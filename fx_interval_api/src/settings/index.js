switch (process.env.TARGET) {
    case 'DEV':
        module.exports = require('./settings-dev');
        break;
    case 'DEMO':
        module.exports = require('./settings-demo');
        break;
    default:
        throw Error('Invalid value of environment variable TARGET.');
}
