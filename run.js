'use strict';
/**
 * Module dependencies.
 */

var cluster = require('cluster');
var init = require('./config/init')();
var config = require('./config/config');
var db = require('./server/models/storage/db');

if (process.env.NODE_ENV === 'production') {
	console.log = function(){};

}
cluster.schedulingPolicy = cluster.SCHED_RR;
var stateTracker = function (period, deviationRate, callback) {

	var initialValue = null;
	var history = new Object();

	this.addValue = function(newValue) {

		if (!initialValue)
			initialValue = newValue;

		var currentMoment = (new Date()).getTime();
		history[currentMoment] = newValue;
		var lastSuitableMoment = currentMoment - period;

		var currentValue = null;
		var minValue = null;
		for (var dt in history) {
			var moment = Number(dt);
			if (moment < lastSuitableMoment){
				delete history[dt]
				continue;
			}

			currentValue = history[dt];
			if (minValue){
				if (minValue > currentValue)
					minValue = currentValue;
			}
			else
				minValue = currentValue;
		}

		if (minValue && initialValue && deviationRate && callback){
			var borderValue = initialValue * deviationRate;
			if (borderValue < minValue)
				callback(minValue);
		}
	}
};

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
			if (config.maxNodesCount)
				cpuCount = config.maxNodesCount;

			console.log('-- CPU count: ' + cpuCount);
			console.log('-- Master started: ' + process.pid);

			// Create a worker for each CPU
			var debugPort = 5859;
			var portIndex = debugPort;
			var workerDownHistory  = new Object();
			var checkIfRecoverRequired = function(id){
				if (workerDownHistory[id])
					return false;
				workerDownHistory[id] = true;
				return true;
			}

			var recoverNodes = function(urgent){
				var currentNodesCount =
					Object.keys(cluster.workers).length ?
						Object.keys(cluster.workers).length
						: 0;
				var requiredAmount = cpuCount - currentNodesCount;
				var launchTimeout = urgent ? 0 : config.workerLaunchSpread;
				for (var i = 0; i < requiredAmount; i += 1) {
					setTimeout(function () {
						if (debug) {
							if (portIndex > (debugPort + (10 * cpuCount)))
								portIndex = debugPort;
							cluster.settings.execArgv.push('--debug=' + (++portIndex));
						}
						subscribeChild(cluster.fork());
						if (debug)
							cluster.settings.execArgv.pop();
					}, i * launchTimeout)
				}
			}


			cluster.on('online', function (worker) {
				console.log('--worker %s online', worker.id);
			});
			cluster.on('listening', function (worker, addr) {
				console.log('--worker %s listening on %s:%d', worker.id, addr.address, addr.port);
			});
			cluster.on('disconnect', function (worker) {
				if (checkIfRecoverRequired(worker.id))
					recoverNodes(true);
				console.log('--worker %s disconnected on %s:%d', worker.id);
			});

			recoverNodes(false);

			cluster.on('exit', function (worker, code, signal) {
				if (signal) {
					console.log('Worker died with signal (ID: %d, PID: %d)', worker.id, worker.process.pid);
				}
				else if (code) {
					console.log('Worker died (ID: %d, PID: %d, code: %d)', worker.id, worker.process.pid, code);
					if (checkIfRecoverRequired(worker.id))
						recoverNodes(true);
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



	var stateTracker =
		new stateTracker(
			config.workerStatePeriod,
			config.workerStateOverheadRatio,
			function(theValue){
		//process.disconnect();
				process.exit(0);
	});
	stateTracker.addValue(process.memoryUsage().rss);
	/*
	// Start the app by listening on <port>
	app.listen(config.port);

	 */

	var http = require('http');
	var server = http.createServer(app).listen(config.port, function(){
		console.log("Express server listening on port " + config.port);
	});

	try {
		var fs = require('fs');
		var https = require('https');
		var options = {
			key: fs.readFileSync(config.sslKeyFilePath),
			cert: fs.readFileSync(config.sslCertificateFilePath)
		};
		var serverSsl = https.createServer(options, app).listen(config.portSsl, function () {
			console.log("Express server listening on port " + config.portSsl);
		});
		console.log("SSL is supported");
	}
	catch(err){
		console.error("SSL is not supported: " + err);
	}


	setInterval(function(){
		stateTracker.addValue(process.memoryUsage().rss);
	}, config.workerStateCheckTimeout);

	// Logging initialization
	console.log('-- node (' + process.pid + ') started on port ' + config.port);

}

