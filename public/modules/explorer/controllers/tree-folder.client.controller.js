'use strict';

angular.module('explorer').controller('TreeFolderController', ['$scope',
	function(scope) {
		scope.name = 'No Name';
		scope.init = function () {
			var prefix = '';
			if (0 < scope.index)
				prefix = '/';
			scope.name = scope.itemData.Name;
		};

		scope.select = function() {
			scope.navigate(scope.itemData.Id);
		};
	}
]);