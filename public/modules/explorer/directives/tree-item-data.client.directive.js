'use strict';

angular.module('explorer').directive('treeItemData', ['$compile',
	function(compile) {
		return {
			restrict: 'EA',

			templateUrl: 'modules/explorer/views/tree-item-view.client.view.html',
			replace: true,
			controller: 'TreeItemController',

			link: function (scope, elem, attr, ctrl) {
				scope.init();
			}
		};
	}
]);