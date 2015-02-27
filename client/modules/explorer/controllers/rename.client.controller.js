'use strict';

angular.
    module('explorer')
        .controller('renameController', [
            '$scope',
            '$modalInstance',
            'messageBoxService',
            'currentName',
            'target',
            'neighbours',
    function(scope, modalInstance, messageBox, currentName, target, neighbours) {

        scope.current = {
            name: currentName,
            originalName: currentName,
            target: target,
            nameChanged: false
        };

		scope.checkName = function (candidate) {
			var result = true;
            if (neighbours) {
                var length = neighbours.length;
                for (var i = 0; i < length; i++) {
                    var neighbour = neighbours[i];
                    if (neighbour.name.toLowerCase() === candidate.toLowerCase()) {
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

        scope.onHandleNameChange = function(newValue, oldValue) {
            scope.current.nameChanged =
                (scope.current.name.toLowerCase() != scope.current.originalName.toLowerCase());
        }

        scope.$watch('current.name', scope.onHandleNameChange);
	}
]);