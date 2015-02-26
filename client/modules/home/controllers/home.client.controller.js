'use strict';


angular.module('home').controller('HomeController', ['$scope', 'Authentication', '$timeout',
    function(scope, Authentication, timeout) {
		// This provides Authentication context.
        scope.authentication = Authentication;

        function showTime() {
            scope.currentTime = new Date();
            timeout(showTime, 1000);
        };

        showTime();
	}
]);