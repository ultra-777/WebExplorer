'use strict';

angular.module('explorer').controller('FileLoadedController', ['$scope', '$modalInstance', 'fileInfo',
	function(scope, modalInstance, fileInfo) {
		scope.name = fileInfo.name;
		scope.size = fileInfo.size;

		scope.ok = function () {
			modalInstance.close('Cheers');
		};

		scope.cancel = function () {
			modalInstance.dismiss('cancel');
		};
	}
]);