const issue = require('./unit/order');
const renew = require('./unit/renew');
const exit = require('./unit/exit');
const fs = require('fs');
const path = require('path');
//global variables
var config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'))).token;
var certId;

// catch Ctrl-C
process.on('SIGINT', function () {
    exit(130);
});