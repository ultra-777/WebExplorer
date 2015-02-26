'use strict';

angular.module('explorer').filter('duration', [
	function() {
		return function(totalSeconds) {
			if ((0 === totalSeconds) || isNaN(parseInt(totalSeconds)) || !isFinite(totalSeconds))
				return '-';

            var seconds = Math.floor(totalSeconds) % 60;
            var minutes = Math.floor(totalSeconds / 60) % 60;
            var hours = Math.floor(totalSeconds / 3600);

            var result =
                ((hours > 9) ? '' : '0') +
                hours +
                ':' +
                ((minutes > 9) ? '' : '0') +
                minutes +
                ':' +
                ((seconds > 9) ? '' : '0') +
                seconds;
            return result;
		};
	}
]);