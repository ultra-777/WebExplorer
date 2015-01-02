'use strict';
/**
 * Module dependencies.
 */


var cluster = require('cluster');
var init = require('./config/init')();


/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */


	if (cluster.isMaster) {
		var toString = require('./server/common/stringify');
		var subscribeChild = function(child){
			child.on('message', function(msg) {
				if (msg.broadcast) {
					console.log('-- broadcast message from child (%d): %s', child.process.pid, toString(msg));

					Object.keys(cluster.workers).forEach(function(id) {
						if (id != child.id) {
							cluster.workers[id].send(msg);
						}
					});
				}
			});
		};

		var debug = process.execArgv.indexOf('--debug') !== -1;
		cluster.setupMaster({
			execArgv: process.execArgv.filter(function(s) { return s !== '--debug' })
		});



		// Count the machine's CPUs
		var cpuCount = require('os').cpus().length;

		var config = require('./config/config');
		if (cpuCount < config.minNodesCount)
			cpuCount = config.minNodesCount;


		console.log('-- CPU count: ' + cpuCount);

		// Create a worker for each CPU
		for (var i = 0; i < cpuCount; i += 1) {
			if (debug)
				cluster.settings.execArgv.push('--debug=' + (5859 + i));
			subscribeChild(cluster.fork());
			if (debug)
				cluster.settings.execArgv.pop();

		}

		console.log('-- Master started: ' + process.pid);

		cluster.on('online', function(worker) {
			console.log('--worker %s online', worker.id);
		});
		cluster.on('listening', function(worker, addr) {
			console.log('--worker %s listening on %s:%d', worker.id, addr.address, addr.port);
		});
		cluster.on('disconnect', function(worker) {
			console.log('--worker %s disconnected', worker.id);
		});


		/**/
		cluster.on('exit', function (worker, code, signal) {

			if (signal){
				console.log('Worker died with signal (ID: %d, PID: %d)', worker.id, worker.process.pid);
			}
			else if (code){
				console.log('Worker died (ID: %d, PID: %d, code: %d)', worker.id, worker.process.pid, code);
				subscribeChild(cluster.fork());
			}

		});


// Code to run if we're in a worker process
	} else {

		var config = require('./config/config');
		var db = require('./server/models/storage/db');

		db = db.init(config.db);
		db.then(function(){
			// Init the express application
			var app = require('./config/express')();

			// Bootstrap passport config
			require('./config/passport')();

			// Start the app by listening on <port>
			app.listen(config.port);

			// Logging initialization
			console.log('-- Application (' + process.pid + ') started on port ' + config.port);
		})
		.catch(function(err){
				console.log('Sequelize init failed: ' + err);
		});
}

