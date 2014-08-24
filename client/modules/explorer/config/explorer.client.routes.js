'use strict';

// Setting up route
angular.module('explorer').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('explorer', {
			url: '/explorer',
			templateUrl: 'modules/explorer/views/home.client.view.html'
		});
	}
]);