'use strict';

module.exports = {
	db: 'postgres://postgres:password@localhost:5432/Test',
	app: {
		title: 'Cheers - Development'
	},
	port: process.env.PORT || 80,
};