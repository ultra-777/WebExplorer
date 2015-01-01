'use strict';
/**
 * Module dependencies.
 */

var cluster = require('cluster');

var init = require('./config/init')(),
	config = require('./config/config'),
	db = require('./server/models/storage/db');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

var db = db.init(config.db);
db.then(function(){

	// Count the machine's CPUs
	var cpuCount = require('os').cpus().length;
	console.log('-- CPU count: ' + cpuCount);

	// Init the express application
	var app = require('./config/express')();

	// Bootstrap passport config
	require('./config/passport')();

	// Start the app by listening on <port>
	app.listen(config.port);

	// Expose app
	module.exports = app;

	// Logging initialization
	console.log('Application started on port ' + config.port);
})
.catch(function(err){
	console.log('Sequelize init failed: ' + err);
});
