'use strict';

angular
    .module('explorer')
    .controller(
        'MessageBoxController', [
            '$scope',
            '$modalInstance',
            'model',
    function(scope, modalInstance, model) {

        scope.dialogOptions = model;

        scope.ok = function () {
            modalInstance.close();
        };

        scope.cancel = function () {
            modalInstance.dismiss('cancel');
        };
    }
]);