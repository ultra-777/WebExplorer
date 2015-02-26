'use strict';

angular.module('home').controller('HeaderController', ['$scope', '$timeout', 'dataService', 'Authentication', 'Menus',
	function(scope, timeout, dataService, Authentication, Menus) {
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

        function getUserInfo() {
            dataService
                .getUserInfo()
                    .then(function(data) {
                        if (data.ip)
                            data.ip = data.ip.replace('::ffff:', '');
                        scope.userInfo = data;
                    },
                    function (error) {
                        console.log(error);
                    });
        };

        getUserInfo();
    }


]);