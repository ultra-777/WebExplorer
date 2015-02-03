'use strict';

angular.module('home').controller('HeaderController', ['$scope', '$timeout', 'Authentication', 'Menus',
	function(scope, timeout, Authentication, Menus) {
        scope.currentTime = null;
		scope.authentication = Authentication;
		scope.isCollapsed = false;
		scope.menu = Menus.getMenu('topbar');

		scope.toggleCollapsibleMenu = function() {
			scope.isCollapsed = !scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		scope.$on('$stateChangeSuccess', function() {
			scope.isCollapsed = false;
		});

        function showTime() {
            scope.currentTime = new Date();
            timeout(showTime, 1000);
        }

        showTime();

    }


]);