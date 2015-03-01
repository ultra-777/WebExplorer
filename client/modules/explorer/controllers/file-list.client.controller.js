'use strict';

angular
    .module('explorer')
    .controller(
        'fileListController', [
            '$scope',
            '$filter',
            'explorerDataService',
            '$modal',
            'messageBoxService',
	function(scope, filter, dataService, modal, messageBox) {

        scope.files = [];
        scope.isAsynqOperation = false;
        scope.transferDuration = null;
        scope.percent = 0.0;
        scope.transferRate = 0;
        scope.currentBlob = null;
        scope.currentUploader = null;
        scope.isUploading = false;




        /*
         DoubleClick row plugin
         */

        function pluginGridDoubleClick() {
            var self = this;
            self.$scope = null;
            self.myGrid = null;

            // The init method gets called during the ng-grid directive execution.
            self.init = function(scope, grid, services) {
                // The directive passes in the grid scope and the grid object which
                // we will want to save for manipulation later.
                self.$scope = scope;
                self.myGrid = grid;
                // In this example we want to assign grid events.
                self.assignEvents();
            };
            self.assignEvents = function() {
                // Here we set the double-click event handler to the header container.
                self.myGrid.$viewport.on('dblclick', self.onDoubleClick);
            };
            // double-click function
            self.onDoubleClick = function(event) {
                var lastRow = self.$scope.selectionProvider.lastClickedRow;
                self.myGrid.config.dblClickFn(lastRow, event);
            };
        };

        scope.myDblClickHandler = function(rowItem, event) {
            //alert(rowItem.name);
            rowItem.entity.edit = true;
            //event.target.focus();
            var q = 0;
        }

        scope.updateEntity = function(row){
            row.entity.edit = false;
        };

        scope.gridSelections = [];
        scope.gridOptions = {
            data: 'files',
            enableColumnResize : true,
            enableCellSelection: false,
            enableRowSelection: true,
            selectedItems: scope.gridSelections,
            multiSelect: false,
            enableCellEditOnFocus: true,

            columnDefs: [
                {
                    field: 'name',
                    displayName: 'Name',
                    width: 250,
                    resize: true,
                    enableCellEdit: false/*,
                    editableCellTemplate: 'modules/explorer/views/file-list/cell-name-editable.html'
                    ,cellTemplate: 'modules/explorer/views/file-list/cell-name-editable.html'*/
                },
                {
                    field:'size',
                    displayName:'Size',
                    width: 100,
                    resize: true,
                    enableCellEdit: false,
                    cellTemplate: 'modules/explorer/views/file-list/cell-size.html'
                },
                {
                    field:'actions',
                    displayName:'',
                    resize: true,
                    enableCellEdit: false,
                    cellTemplate: 'modules/explorer/views/file-list/cell-actions.html'
                }
            ],
            afterSelectionChange: function (rowItem) {
                if (rowItem.selected)  {  // I don't know if this is true or just truey
                    //write code to execute only when selected.
                    //rowItem.entity is the "data" here
                    rowItem.entity.select();
                } else {
                    //write code on deselection.
                }
            },
            dblClickFn: scope.myDblClickHandler,
            plugins: [pluginGridDoubleClick]


        };

        scope.$on('ngGridEventEndCellEdit', function(event) {
            var field = event.targetScope.col.field;
            var file = event.targetScope.row.entity.name;
            var newData = event.targetScope.row.entity[event.targetScope.col.field];
            console.log(field + ' x ' + file);
            // console.log($scope.contact );
        });

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

            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/rename.client.view.html',
                controller: 'renameController',
                resolve: {
                    currentName: function () {
                        var currentName = null;
                        enumerateArray(scope.files, function(file, index){
                            if (file.id == id)
                                currentName = file.name;
                        });
                        return currentName;
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
                scope.isAsynqOperation = true;
                dataService.rename(id, newFileName)
                    .then(function(data) {
                        scope.isAsynqOperation = false;
                        if (data) {
                            var targetFile = null;
                            enumerateArray(scope.files, function(file, index){
                                if (file.id == id)
                                    targetFile = file;
                            });

                            if (targetFile)
                                targetFile.name = newFileName;
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
            }, function(reason){
            });
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
                scope.gridSelections.length = 0;
                scope.gridSelections.push(targetFile);
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