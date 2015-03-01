'use strict';

angular
    .module('explorer')
    .controller(
        'explorerController', [
            '$scope',
            'explorerDataService',
            '$modal',
            '$filter',
            'messageBoxService',
	function(scope, dataService, modal, filter, messageBox) {

		scope.currentFolder = null;
		scope.canBack = false;
		scope.path = [];
		scope.isNavigating = false;
		scope.percent = 0.0;
        scope.transferRate = 0;
		scope.currentBlob = null;
        scope.currentUploader = null;
        scope.isUploading = false;
        scope.driveInfo = null;
        scope.currentNodeId = null;

		scope.init = function() {
			scope.getData();
		};

        scope.onSelectedFolderChanged = function(id){
            scope.currentNodeId = id;
        };

		scope.getData = function () {

			dataService.getData()
				.then(function (data) {
					scope.applyScopeFolder(data);
				},
				function (error) {
                    messageBox.show(
                        'Exception',
                        error
                    );
				}
			);
		};


		scope.applyScopeFolder = function (newFolder) {
            scope.driveInfo =
                (newFolder) ?
                    {
                        id: newFolder.Id,
                        name: newFolder.Name
                    }
                    : null;
		};

		scope.getData();

	}
]);