'use strict';

angular
    .module('explorer')
    .controller(
        'NewFolderController', [
            '$scope',
            '$modalInstance',
            'messageBoxService',
            'children',
    function(scope, modalInstance, messageBox, children) {

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
            if (children) {
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var child = children[i];
                    if (child.data.name.toLowerCase() === candidate.toLowerCase()) {
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
			else
				modalInstance.close(scope.current.name);
		};

		scope.cancel = function () {
			modalInstance.dismiss('cancel');
		};

		//scope.getProposedName();
	}
]);