'use strict';

angular.module('explorer').controller('UploadFileController', ['$scope', '$modalInstance', 'messageBoxService', 'children',
	function(scope, modalInstance, messageBox, children) {

		scope.current = {
			name: 'Not Defined',
			size: 0,
			path: {},
			file: undefined
		};

		scope.$watch('current.path', function () {
			if ((scope.current.path === null) || (scope.current.path === undefined))
				scope.current.name = '';
			else {
				var fileInfo = document.getElementById('source').files[0];
                if (fileInfo !== undefined) {
                    var r = new FileReader();
                    scope.current.size = fileInfo.size;
                    scope.current.name = fileInfo.name;
                    scope.current.file = fileInfo;
                }
			}
            scope.$digest();
		});

        scope.check = function(){
            var fileInfo = document.getElementById('source').files[0];
            var q = 0;
        };



		scope.getProposedName = function () {
			var result = false;
			var index = -1;
			var template = 'New Folder';
			var candidate = '';
			while (!result) {
				index = index + 1;
				candidate = template;
				if (0 < index)
					candidate = candidate + ' ' + index;
				result = scope.checkName(candidate);
			}
			scope.current.name = candidate;
		};

		scope.checkName = function (candidate) {
			var result = true;
            if (children !== null) {
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var child = children[i];
                    if (child.Name === candidate) {
                        result = false;
                        break;
                    }
                }
            }
			return result;
		};

		scope.ok = function () {
			if (!scope.checkName(scope.current.name))
                messageBox.show(
                    'Exception',
                    'The name ' + scope.current.name + ' already exists'
                );
			else {
				var fileInfo = {source: scope.current.file, name: scope.current.name};
				modalInstance.close(fileInfo);
			}
		};

		scope.cancel = function () {
			modalInstance.dismiss('cancel');
		};

	}
]);