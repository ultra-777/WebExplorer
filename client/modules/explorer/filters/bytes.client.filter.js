'use strict';

angular.module('explorer').filter('bytes', [
	function() {
		return function(bytes, precision) {
			if ((0 === bytes) || isNaN(parseFloat(bytes)) || !isFinite(bytes))
				return '-';
			if (typeof precision === 'undefined') precision = 1;
			var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
				number = Math.floor(Math.log(bytes) / Math.log(1024));
			return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
		};
	}
]);