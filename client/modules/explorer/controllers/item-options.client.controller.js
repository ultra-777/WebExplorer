'use strict';

angular.module('explorer').controller('ItemOptionsController', ['$scope', '$timeout',
	function(scope, timeout) {
		scope.folderItems =
			[
				{ Title: 'Delete', Action: '2' }
			];

		scope.fileItems =
			[
				{ Title: 'Delete', Action: '2' }
			];

		scope.getItems = function() {
			if (scope.itemData.IsContainer) {
				return scope.folderItems;
			}
			else
				return scope.fileItems;
		};

		scope.onAction = function (argument) {
			if ('1' === argument) {
				scope.download(scope.path);
			}
			if ('2' === argument) {
					scope.delete(scope.itemData);
			}
		};
	}
]);