'use strict';

module.exports = {
	app: {
		title: 'Cheers',
		description: 'Cheers',
		keywords: 'Cheers'
	},
	port: process.env.PORT || 80,
	minNodesCount: 4,
    storage: process.env.STORAGE_PATH || 'data',
    rootAlias: process.env.ROOT_ALIAS || '$',
	templateEngine: 'swig',
	sessionSecret: '724833F4-1338-4325-A702-DB630901D394',
	sessionExpirationTime: 1000 * 60 * 10,
	sessionUpdateTimeout: 1000 * 60,
	sessionCollection: 'sessions',
	messageUpdateUser: 'updateUser',
	messageUpdateSession: 'updateSession',
	messageUpdateBlob: 'updateBlob',
	assets: {
		lib: {
			css: [
				'client/lib/bootstrap/dist/css/bootstrap.css',
				'client/lib/bootstrap/dist/css/bootstrap-theme.css',
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