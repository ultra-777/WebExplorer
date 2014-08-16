'use strict';

angular.module('explorer').directive('treeFolderData', [
	function() {
		return {
			restrict: 'EA',
			templateUrl: 'modules/explorer/views/tree-folder-view.client.view.html',
            /*template: '<button class="folderHeader" ng-click="select()">{{name}}</button>',*/
			replace: false,
			controller: 'TreeFolderController',

			link: function (scope, elem, attr, ctrl) {
            scope.init();
        }
		};
	}
]);