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
	repositoryChildFoldersLimit: 3,
    assets: {
        lib: {
            css: [
                'client/lib/bootstrap/dist/css/bootstrap.css',
                'client/lib/bootstrap/dist/css/bootstrap-theme.css',
                'client/lib/angular-ui-grid/ui-grid.css'
            ],
            js: [
                'client/lib/jquery/dist/jquery.js',
                'client/lib/angular/angular.js',
                'client/lib/angular-resource/angular-resource.js',
                'client/lib/angular-cookies/angular-cookies.js',
                'client/lib/angular-animate/angular-animate.js',
                'client/lib/angular-touch/angular-touch.js',
                'client/lib/angular-sanitize/angular-sanitize.js',
                'client/lib/angular-ui-router/release/angular-ui-router.js',
                'client/lib/angular-ui-utils/ui-utils.js',
                'client/lib/angular-ui-grid/ui-grid.js',
                'client/lib/angular-bootstrap/ui-bootstrap-tpls.js'
            ]
        },
        css: [
            'client/modules/**/css/*.css'
        ],
        js: [
            'client/config.js',
            'client/application.js',
            'client/modules/*/*.js',
            'client/modules/*/*/*.js'
        ]
    }
};