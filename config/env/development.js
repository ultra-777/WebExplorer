'use strict';

module.exports = {
	db: 'postgres://postgres:password@localhost:5432/site',
	maxNodesCount: 1,
	workerStatePeriod: 1000 * 60 * 60 * 24, // 24 hr
	workerStateCheckTimeout: 1000 * 60, // 1 min
	workerStateOverheadRatio: 10,
	app: {
		title: 'Cheers - Development'
	},
	port: process.env.PORT || 80
};