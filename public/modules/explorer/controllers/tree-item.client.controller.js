'use strict';

angular.module('explorer').controller('TreeItemController', ['$scope',
	function(scope) {
		scope.name = 'No Name';
		scope.path = [];
		scope.id = null;
		scope.isFolder = null;
		scope.size = 0;
		var path = {};
		scope.init = function () {
			var node = scope.itemData;
			if ((undefined !== node) && (null !== node)) {
				scope.name = node.Name;
				scope.id = node.Id;
				var path = [];
				if ((undefined !== node.ParentAbsolutePath) && (null !== node.ParentAbsolutePath))
					path = path.concat(node.ParentAbsolutePath);
				path.push(node.Name);
				scope.path = path;

				scope.isFolder = node.IsContainer;
				var iconName = 'modules/explorer/img/file.png';
				if (scope.isFolder) {
					iconName = 'modules/explorer/img/folder.png';
				}
				else {
                    scope.href = scope.getDownloadUrl(scope.itemData);
					scope.size = node.Size;
				}
				scope.iconName = iconName;
			}
		};

		scope.select = function () {
            if (scope.isFolder)
                scope.navigate(scope.id);
		};

		scope.delete = function () {
			scope.onDelete(scope.itemData);
		};
	}
]);