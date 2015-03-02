'use strict';

angular
    .module('explorer')
    .controller(
    'fileListController', [
        '$scope',
        '$filter',
        '$interval',
        '$modal',
        '$q',
        'explorerDataService',
        'messageBoxService',
        function(scope, filter, interval, modal, q, dataService, messageBox) {

        scope.files = [];
        scope.isAsynqOperation = false;
        scope.transferDuration = null;
        scope.percent = 0.0;
        scope.transferRate = 0;
        scope.currentBlob = null;
        scope.currentUploader = null;
        scope.isUploading = false;

        scope.gridOptions = {
            data: 'files',
            enableColumnResizing: true,
            enableCellSelection: false,
            enableRowSelection: true,
            multiSelect: false,
            enableCellEditOnFocus: true,
            noUnselect: true,
            enableRowHeaderSelection: false,

            columnDefs: [
                {
                    field: 'name',
                    displayName: 'Name',
                    enableColumnResizing: true,
                    enableSorting: true,
                    enableCellEdit: true,
                    enableCellEditOnFocus:false,
                    editableCellTemplate : 'modules/explorer/views/file-list/cell-name-editable.html'
                },
                {
                    field:'size',
                    displayName:'Size',
                    width: 100,
                    enableColumnResizing: true,
                    enableCellEdit: false,
                    enableSorting: true,
                    cellTemplate: 'modules/explorer/views/file-list/cell-size.html'
                },
                {
                    field:'actions',
                    displayName:'',
                    width: 100,
                    enableColumnResizing: true,
                    enableSorting: false,
                    cellTemplate: 'modules/explorer/views/file-list/cell-actions.html'
                }
            ]

        };

            scope.gridOptions.onRegisterApi = function(gridApi){
          //set gridApi on scope
          scope.gridApi = gridApi;
          gridApi.selection.on.rowSelectionChanged(scope,function(row){
              row.entity.isSelected =  row.isSelected;
              });

          gridApi.selection.on.rowSelectionChangedBatch(scope,function(rows){
              enumerateArray(rows, function(row, index){
                  row.entity.isSelected = row.isSelected;
                });
              });
          gridApi.rowEdit.on.saveRow(scope, function( rowEntity ){
              scope
                  .gridApi
                  .rowEdit
                  .setSavePromise(
                        rowEntity,
                        saveNewFileName(
                            rowEntity,
                            rowEntity.name)
                        .promise );
          });
        };

        scope.init = function () {
            scope.$watch('nodeId', onHandleNodeIdChange);
        };

        scope.stopUploading = function() {
            scope.isUploading = false;
            if (scope.currentBlob !== null) {
                dataService.releaseBlob(scope.currentBlob);
                scope.currentBlob = null;
                scope.$digest();
            }
            if (scope.currentUploader !== null){
                scope.currentUploader.abort();
            }
        };

        scope.uploadByChunks = function () {
            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/upload-file.client.view.html',
                controller: 'UploadFileController',
                resolve: {
                    children: function () {
                        return scope.files;
                    }
                }
            });

            modalInstance.result.then(function (fileInfo) {

                if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
                    messageBox.show(
                        'Exception',
                        'File API не поддерживается данным браузером'
                    );
                    return;
                }

                scope.isUploading = true;
                var taskInfo = newTask(fileInfo.source.size);

                var interruptLoading = function(skipDigest){
                    scope.isUploading = false;
                    scope.currentBlob = null;
                    if (!skipDigest)
                        scope.$digest();
                };

                dataService.initBlob(scope.nodeId, fileInfo.name, fileInfo.source.size, taskInfo.step)
                    .then(function(blobIdObject) {

                        var d = new Date();
                        var startTime = d.getTime();
                        var lastTime = startTime;
                        var lastLeft = taskInfo.left;
                        scope.transferDuration = 0;

                        scope.currentBlob = blobIdObject.id;
                        var blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
                        var reader = new FileReader();
                        reader.onloadend = function (evt) {
                            if (scope.currentBlob !== null) {

                                if (evt.target.readyState === FileReader.DONE) { // DONE == 2

                                    if (!scope.isUploading){
                                        interruptLoading();
                                        return;
                                    }

                                    var data = evt.target.result;
                                    data = data.substr(data.lastIndexOf(',') + 1);
                                    dataService.addBlobChunk(scope.currentBlob, taskInfo.index, data)
                                        .then(function(result) {
                                            if (result && result.id) {
                                                scope.currentBlob = result.id;
                                                var prcent = result.percent;
                                                var isComplete = result.isComplete;

                                                if (isComplete) {
                                                    addNewFile(result.file);
                                                }

                                                taskInfo.applyNewData(evt.loaded);

                                                var dd = new Date();
                                                var currentTime = dd.getTime();
                                                var interval = currentTime - lastTime;
                                                if (interval >= (1000)) {
                                                    lastTime = currentTime;
                                                    var currentLeft = taskInfo.left;
                                                    var transferredBytes = lastLeft - currentLeft;
                                                    lastLeft = currentLeft;
                                                    scope.transferRate = transferredBytes;
                                                    scope.transferDuration = Math.floor((currentTime - startTime) / 1000);
                                                }

                                                if (taskInfo.left > 0) {
                                                    if (!scope.isUploading){
                                                        interruptLoading();
                                                        return;
                                                    }
                                                    blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
                                                    reader.readAsDataURL(blob);
                                                } else {
                                                    interruptLoading(true);
                                                    var secondsLeft = (currentTime - startTime) / 1000;

                                                    messageBox.show(
                                                        'Transfer complete',
                                                        'Size: ' + filter('bytes')(taskInfo.total, 1) + '<br/>' +
                                                        'Chunks count: ' + taskInfo.index + '<br/>' +
                                                        'Duration: ' + secondsLeft + ' sec.' + '<br/>' +
                                                        'Rate: ' + filter('bytes')((taskInfo.total / secondsLeft), 1) + ' / sec'
                                                    );
                                                }

                                                scope.percent = prcent;
                                                scope.$digest();
                                            }
                                            else {
                                                dataService.releaseBlob(scope.currentBlob);
                                                scope.interruptLoading();
                                            }
                                        },
                                        function(result) {
                                            dataService.releaseBlob(scope.currentBlob);
                                            scope.interruptLoading();
                                            messageBox.show(
                                                'Exception',
                                                result
                                            );
                                        });


                                } else {
                                    scope.interruptLoading();
                                }
                            } else {
                                scope.interruptLoading();
                            }
                        };

                        reader.readAsDataURL(blob);
                    });
            }, function (exc) {
                var w = 0;
            });
        };

        scope.uploadFast = function (){
            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/upload-file.client.view.html',
                controller: 'UploadFileController',
                resolve: {
                    children: function () {
                        return scope.files;
                    }
                }
            });

            modalInstance.result.then(function (fileInfo) {

                var file = fileInfo.source;

                if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
                    messageBox.show(
                        'Exception',
                        'File API не поддерживается данным браузером'
                    );
                    return;
                }


                var d = new Date();
                var startTime = d.getTime();
                var lastTime = startTime;
                var lastTransferred = 0;
                scope.isUploading = true;

                scope.currentUploader = new XMLHttpRequest();
                var form = new FormData();
                form.append(scope.nodeId, '');
                form.append("file", file, fileInfo.name);

                scope.currentUploader.upload.onprogress = function(event) {
                    var progress = event.lengthComputable ? event.loaded / event.total : 0;

                    scope.percent = progress;
                    var dd = new Date();
                    var currentTime = dd.getTime();
                    var interval = currentTime - lastTime;
                    var transferred = (event.lengthComputable ? event.loaded : 0);
                    var transferredBytes = transferred - lastTransferred;
                    lastTransferred = transferred;
                    if (interval >= (1000)) {
                        lastTime = currentTime;
                        scope.transferRate = transferredBytes * 1000 / interval;
                        scope.transferDuration = Math.floor((currentTime - startTime) / 1000);
                        scope.$digest();
                    }
                };

                scope.currentUploader.onload = function() {

                    var dd = new Date();
                    var currentTime = dd.getTime();
                    var secondsLeft = (currentTime - startTime) / 1000;

                    var fileInfo = JSON.parse(scope.currentUploader.response);
                    addNewFile(fileInfo);

                    messageBox.show(
                        'Transfer complete',
                        'Size: ' + filter('bytes')(fileInfo.Size, 1)  + '<br/>' +
                        'Duration: ' + secondsLeft + ' sec.' + '<br/>' +
                        'Rate: ' + filter('bytes')((fileInfo.Size / secondsLeft), 1) + ' / sec'
                    );

                    scope.currentUploader = null;
                    scope.isUploading = false;
                };

                scope.currentUploader.onerror = function(error) {
                    messageBox.show('Exception occured', error);
                    scope.currentUploader = null;
                    scope.isUploading = false;
                };

                scope.currentUploader.onabort = function() {
                    messageBox.show('Transfer aborted');
                    scope.currentUploader = null;
                    scope.isUploading = false;
                };

                // notice that the event handler is on xhr and not xhr.upload
                scope.currentUploader.addEventListener('readystatechange', function(e) {
                    if( this.readyState === 4 ) {
                        //scope.currentUploader = null;
                    }
                });

                scope.currentUploader.open("POST", "/explorer/UploadFile", true);

                scope.currentUploader.withCredentials = false;

                scope.currentUploader.send(form);

            });

        };

        var newTask = function(totalSize) {

            var taskInfo = {
                step: 20480,
                start: 0,
                end: 0,
                total: 0,
                left: 0,
                index: 0,
                percent: -1.0,

                refreshState: function() {
                    if (this.left > this.step)
                        this.end = this.start + this.step;
                    else
                        this.end = this.start + this.left;

                    if (this.total > 0)
                        this.percent = ((this.total - this.left) / this.total);
                    else
                        this.percent = 1.0;
                },

                init: function (theTotalSize) {
                    this.total = theTotalSize;
                    this.start = 0;
                    this.left = this.total;
                    this.index = 0;
                    this.refreshState();
                },

                applyNewData: function(size) {
                    this.left = this.left - size;
                    this.start = this.start + size;
                    this.index = this.index + 1;
                    this.refreshState();
                }
            };

            taskInfo.init(totalSize);

            return taskInfo;
        };

        var addNewFile = function(fileInfo){
            if (scope.nodeId != fileInfo.Parent)
                return;
            var newFile = fileInfoToLocalFile(fileInfo);
            scope.files.push(newFile);
            scope.files.sort(compareChildren);
            newFile.select();

            //scope.gridOptions.selectItem(3, true);
        }

        var onHandleNodeIdChange = function(newValue, oldValue){
            if (newValue){
                getFolder(newValue)
            }
            else{
                scope.files.splice(0,scope.files.length);
            }
        }

        var getFolder = function (id, handler) {
            scope.isAsynqOperation = true;
            dataService.getFolder(id)
                .then(function (folderData) {
                    scope.isAsynqOperation = false;
                    applyScopeFolder({
                            id: folderData.Id,
                            name: folderData.Name,
                            children: folderData.Children},
                        handler);
                },
                function (error) {
                    scope.isAsynqOperation = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
                }
            );
        };

        var deleteFile = function (id, handler) {

            scope.isAsynqOperation = true;
            dataService.delete(id)
                .then(function(data) {
                    scope.isAsynqOperation = false;
                    if (data) {
                        var targetIndex = null;
                        enumerateArray(scope.files, function(file, index){
                            if (file.id == id)
                                targetIndex = index;
                        });

                        if (targetIndex !== null)
                            scope.files.splice(targetIndex, 1);
                    }
                },
                function (error) {
                    scope.isNavigating = false;
                    messageBox.show(
                        'Deleting file exception',
                        error
                    );
                }
            );
        };

        var renameFile = function (id, handler) {

            var currentFile = null;
            enumerateArray(scope.files, function(file, index){
                if (file.id == id) {
                    currentFile = file;
                }
            });
            if (!currentFile)
                return;

            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/rename.client.view.html',
                controller: 'renameController',
                resolve: {
                    currentName: function () {
                        return currentFile.name;
                    },
                    target: function(){
                        return 'file';
                    },
                    neighbours: function () {
                        return scope.files;
                    }
                }
            });

            modalInstance.result.then(function (newFileName) {
                saveNewFileName(currentFile, newFileName);
            }, function(reason){
            });
        };

        var saveNewFileName = function(currentFile, newFileName){
            scope.isAsynqOperation = true;
            var promise = q.defer();
            dataService.rename(currentFile.id, newFileName)
                .then(function(data) {
                    scope.isAsynqOperation = false;
                    if (data)
                        currentFile.name =
                            newFileName;
                    promise.resolve();
                },
                function (error) {
                    scope.isNavigating = false;
                    messageBox.show(
                        'Renaming file exception',
                        error
                    );
                    promise.reject();
                }
            );
            return promise;
        };

        var enumerateArray = function(array, handler/*void function(child, index)*/){
            if (array){
                var length = array.length;
                for (var i = 0; i < length; i++) {
                    var child = array[i];
                    handler && handler(child, i);
                }
            }
        }

        var applySelection = function (id) {
            var isChangeRequired = false;
            var targetFile = null;
            enumerateArray(scope.files, function(file, index){
                var newState = (file.id == id);
                if (file.isSelected != newState){
                    file.isSelected = newState;
                    isChangeRequired = true;
                }
                if (file.isSelected)
                    targetFile = file;
            });
            if (isChangeRequired && targetFile) {
                interval( function() {scope.gridApi.selection.selectRow(targetFile);}, 0, 1);
            }
        };

        var applyScopeFolder = function (newFolder, handler) {

            var dataChildren = new Array();
            if (newFolder.children){
                var index = -1;
                var length = newFolder.children.length;
                for (var i = 0; i < length; i++) {
                    var child = newFolder.children[i];
                    if (child.IsContainer)
                        continue;
                    dataChildren.push(
                        fileInfoToLocalFile(child));
                }
                dataChildren.sort(compareChildren);
                scope.files = dataChildren;
            }
            else
                scope.files = new Array();

            handler && handler();
        };

        var fileInfoToLocalFile = function(fileInfo){
            return {
                id: fileInfo.Id,
                name: fileInfo.Name,
                size: fileInfo.Size,
                href: dataService.getDownloadUrl(fileInfo.Id),
                isSelected: false,
                select: function () {
                    applySelection(this.id);
                },
                delete: function () {
                    deleteFile(this.id);
                },
                rename: function () {
                    renameFile(this.id);
                }
            };
        }

        var compareChildren = function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase())
                return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase())
                return 1;
            return 0;
        }
	}
]);