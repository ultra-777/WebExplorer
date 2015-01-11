'use strict';

module.exports = {
	app: {
		title: 'Cheers - Development'
	},
	db: 'postgres://postgres:password@localhost:5432/site',
	maxNodesCount: 1,
	workerStatePeriod: 1000 * 60 * 60 * 24, // 24 hr
	workerStateCheckTimeout: 1000 * 60, // 1 min
	workerStateOverheadRatio: 10,
	port: process.env.PORT || 80,
	sessionExpirationTime: 1000 * 60 * 60 * 24, // 24h
	repositoryChildFilesLimit: 3,
	repositoryChildFoldersLimit: 3
};