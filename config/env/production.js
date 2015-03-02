'use strict';

module.exports = {
	db: process.env.POSTGRES_URI || 'postgres://postgres:password@localhost:5432/site',
	minNodesCount: 4,
	workerStatePeriod: 1000 * 60 * 60, // 1 hr
	workerStateCheckTimeout: 1000 * 10, // 10 sec
	workerStateOverheadRatio: 1.5,
	sessionExpirationTime: 1000 * 60 * 60, // 1h
	sessionUpdateTimeout: 1000 * 60,
	assets: {
		lib: {
			css: [
				'client/lib/bootstrap/dist/css/bootstrap.min.css',
				'client/lib/bootstrap/dist/css/bootstrap-theme.min.css',
                'client/lib/angular-ui-grid/ui-grid.min.css'
			],
			js: [
                'client/lib/jquery/dist/jquery.min.js',
				'client/lib/angular/angular.min.js',
				'client/lib/angular-resource/angular-resource.min.js',
				'client/lib/angular-cookies/angular-cookies.min.js',
				'client/lib/angular-animate/angular-animate.min.js',
				'client/lib/angular-touch/angular-touch.min.js',
				'client/lib/angular-sanitize/angular-sanitize.min.js',
				'client/lib/angular-ui-router/release/angular-ui-router.min.js',
				'client/lib/angular-ui-utils/ui-utils.min.js',
                'client/lib/angular-ui-grid/ui-grid.min.js',
				'client/lib/angular-bootstrap/ui-bootstrap-tpls.min.js'
			]
		},
		css: 'client/dist/application.min.css',
		js: 'client/dist/application.min.js'
	}
};