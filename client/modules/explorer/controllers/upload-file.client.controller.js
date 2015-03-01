'use strict';

angular
    .module('explorer')
    .controller(
        'UploadFileController', [
            '$scope',
            '$modalInstance',
            'messageBoxService',
            'children',
	function(scope, modalInstance, messageBox, children) {

		scope.current = {
			name: undefined,
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

  		scope.checkName = function (candidate) {
			var result = true;
            if (children) {
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var child = children[i];
                    if (child.name.toLowerCase() == candidate.toLowerCase()) {
                        result = false;
                        break;
                    }
                }
            }
			return result;
		};

		scope.ok = function () {

            while (!scope.checkName(scope.current.name)){
                scope.current.name = scope.current.name + '_';
            }

            var fileInfo = {source: scope.current.file, name: scope.current.name};
            modalInstance.close(fileInfo);
		};

		scope.cancel = function () {
			modalInstance.dismiss('cancel');
		};
	}
]);