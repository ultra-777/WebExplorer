'use strict';
/**
 * Module dependencies.
 */


var cluster = require('cluster');
var init = require('./config/init')();
var config = require('./config/config');
var db = require('./server/models/storage/db');


/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */


	if (cluster.isMaster) {

		db
			.initAndSynq(config.db)
			.then(function() {
				var toString = require('./server/common/stringify');
				var subscribeChild = function (child) {
					child.on('message', function (msg) {
						if (msg.broadcast) {
							console.log('-- broadcast message from child (%d): %s', child.process.pid, toString(msg));

							Object.keys(cluster.workers).forEach(function (id) {
								if (id != child.id) {
									cluster.workers[id].send(msg);
								}
							});
						}
					});
				};

				var debug = process.execArgv.indexOf('--debug') !== -1;
				cluster.setupMaster({
					execArgv: process.execArgv.filter(function (s) {
						return s !== '--debug'
					})
				});


				// Count the machine's CPUs
				var cpuCount = require('os').cpus().length;

				var config = require('./config/config');
				if (cpuCount < config.minNodesCount)
					cpuCount = config.minNodesCount;


				console.log('-- CPU count: ' + cpuCount);

				// Create a worker for each CPU
				var debugPort = 5859;
				var portIndex = debugPort;
				for (var i = 0; i < cpuCount; i += 1) {
					setTimeout(function () {
						if (debug)
							cluster.settings.execArgv.push('--debug=' + (++portIndex));
						subscribeChild(cluster.fork());
						if (debug)
							cluster.settings.execArgv.pop();
					}, i * 5000)
				}

				console.log('-- Master started: ' + process.pid);

				cluster.on('online', function (worker) {
					console.log('--worker %s online', worker.id);
				});
				cluster.on('listening', function (worker, addr) {
					console.log('--worker %s listening on %s:%d', worker.id, addr.address, addr.port);
				});
				cluster.on('disconnect', function (worker) {
					console.log('--worker %s disconnected', worker.id);
				});


				/**/
				cluster.on('exit', function (worker, code, signal) {
					if (portIndex > (debugPort + (10 * cpuCount)))
						portIndex = debugPort;

					if (signal) {
						console.log('Worker died with signal (ID: %d, PID: %d)', worker.id, worker.process.pid);
					}
					else if (code) {
						console.log('Worker died (ID: %d, PID: %d, code: %d)', worker.id, worker.process.pid, code);
						if (debug)
							cluster.settings.execArgv.push('--debug=' + (++portIndex));
						subscribeChild(cluster.fork());
						if (debug)
							cluster.settings.execArgv.pop();
					}

				});
			})
			.catch(function(err){
				console.log('Sequelize init failed: ' + err);
			});


// Code to run if we're in a worker process
	} else {

		db.init(config.db);

		// Init the express application
		var app = require('./config/express')();

		// Bootstrap passport config
		require('./config/passport')();

		// Start the app by listening on <port>
		app.listen(config.port);

		setInterval(function(){
			process.exit(1);
		}, 60 * 60 * 1000);

		// Logging initialization
		console.log('-- node (' + process.pid + ') started on port ' + config.port);

}

