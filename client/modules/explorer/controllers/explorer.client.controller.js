'use strict';

angular.module('explorer').controller('ExplorerController', [
    '$scope', 'DataService', '$modal', '$filter', 'messageBoxService', 'uploadService',
	function(scope, dataService, modal, filter, messageBox, uploadService) {
		
		
		scope.currentFolder = null;
		scope.canBack = false;
		scope.path = [];
		scope.isNavigating = false;
		scope.percent = 0.0;
        scope.transferRate = 0;
		scope.currentBlob = null;
        scope.currentUploader = null;
        scope.isUploading = false;

		scope.upload = function() {
			alert('cheers');
		};

		scope.getCurrentFolderId = function() {
			if (scope.currentFolder === null)
				return null;
			return scope.currentFolder.Id;
		};

		scope.getParentFolderId = function () {
			if (scope.currentFolder === null)
				return null;
			return scope.currentFolder.Parent;
		};

		scope.init = function() {
			scope.getData();
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

		scope.getFolder = function (id) {
			scope.isNavigating = true;
			dataService.getFolder(id)
				.then(function (data) {
					scope.isNavigating = false;
					scope.applyScopeFolder(data);
				},
				function (error) {
					scope.isNavigating = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
				}
			);
		};

		scope.applyScopeFolder = function (newFolder) {
            if (newFolder.Children)
                newFolder.Children.sort(compareChildren);
            else
                newFolder.Children = new Array();
			scope.currentFolder = newFolder;
			scope.path.push(newFolder);
			scope.canBack = (scope.path.length > 1);
		};

		scope.moveBack = function () {
			if (scope.path.length < 2)
				return;

			var prevoiusItem = scope.path[scope.path.length - 2];
			if ((prevoiusItem !== undefined) && (prevoiusItem !== null)) {
				scope.navigate(prevoiusItem.Id);
			}
		};

		scope.navigate = function (id) {
			var length = scope.path.length;
			var target = null;
			for (var i = 0; i < length; i++) {
				var candidate = scope.path[i];
				if (candidate.Id === id) {
					target = candidate;
					scope.path.splice(i, (length - i));
					scope.applyScopeFolder(target);
					return;
				}
			}

			scope.getFolder(id);
		};

		scope.download = function (item) {
			scope.isDownloading = true;
			dataService.download(item.Id)
				.then(function (data) {
					scope.isDownloading = false;
					scope.saveFile(item.Name, data);
				},
				function (error) {
					scope.isDownloading = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
				}
			);
		};


		scope.getDownloadUrl = function (treeItemData) {
			return dataService.getDownloadUrl(treeItemData.Id);
		};

		scope.onDelete = function (node) {
			scope.isNavigating = true;
			dataService.delete(node.Id)
				.then(function(data) {
					scope.isNavigating = false;
					if (data) {
						var index = -1;
						var length = scope.currentFolder.Children.length;
						for (var i = 0; i < length; i++) {
							var candidate = scope.currentFolder.Children[i];
							if (node.Id === candidate.Id) {
								index = i;
								break;
							}
						}
						if (index > -1)
							scope.currentFolder.Children.splice(index, 1);
					}
				},
				function (error) {
					scope.isNavigating = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
				}
			);
		};

		scope.saveFile = function (sourcePath, sourceData) {

			var modalInstance = modal.open({
				templateUrl: 'fileLoadedView.html',
				controller: 'fileLoadedController',
				resolve: {
					fileInfo: function () {
						var data = {
							name: sourcePath,
							size: sourceData.length
						};
						return data;
					}
				}

			});

			modalInstance.result.then(function () {
				var q = 0;
			}, function () {
				var w = 0;
			});
		};

        function compareChildren(a, b) {
            if (a.IsContainer !== b.IsContainer){
                return (a.IsContainer === true) ? -1 : 1;
            }
            if (a.Name < b.Name)
                return -1;
            if (a.Name > b.Name)
                return 1;
            return 0;
        }

		scope.onNewFolder = function() {

			var modalInstance = modal.open({
				templateUrl: 'modules/explorer/views/new-folder-view.client.view.html',
				controller: 'NewFolderController',
				resolve: {
					children: function() {
						return scope.currentFolder.Children;
					}
				}
			});

			modalInstance.result.then(function (newFolderName) {
				dataService.newFolder(scope.currentFolder.Id, newFolderName)
					.then(function (newFolder) {
						scope.currentFolder.Children.push(newFolder);
                        scope.currentFolder.Children.sort(compareChildren);
					},
					function (error) {
                        messageBox.show(
                            'Exception',
                            error
                        );
					});
			}, function () {
				var w = 0;
			});

		};

		scope.newTask = function(totalSize) {

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

		scope.onStopUploading = function() {
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

		scope.onUploadFile = function () {
			var modalInstance = modal.open({
				templateUrl: 'modules/explorer/views/upload-file-view.client.view.html',
				controller: 'UploadFileController',
				resolve: {
					children: function () {
						return scope.currentFolder.Children;
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
				var taskInfo = scope.newTask(fileInfo.source.size);

                var interruptLoading = function(){
                    scope.currentBlob = null;
                    scope.$digest();
                };

				dataService.initBlob(scope.currentFolder.Id, fileInfo.name, fileInfo.source.size, taskInfo.step)
					.then(function(blobIdObject) {

                        var d = new Date();
                        var startTime = d.getTime();
                        var lastTime = startTime;
                        var lastLeft = taskInfo.left;

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
													scope.currentFolder.Children.push(result.file);
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
												}

												if (taskInfo.left > 0) {
                                                    if (!scope.isUploading){
                                                        interruptLoading();
                                                        return;
                                                    }
													blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
													reader.readAsDataURL(blob);
												} else {
													scope.currentBlob = null;
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

        scope.onUploadFile2 = function (){
            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/upload-file-view.client.view.html',
                controller: 'UploadFileController',
                resolve: {
                    children: function () {
                        return scope.currentFolder.Children;
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

                scope.currentUploader = new XMLHttpRequest();
                var form = new FormData();
                form.append(scope.currentFolder.Id, '');
                form.append("file", file, file.name);

                scope.currentUploader.upload.onprogress = function(event) {
                    var progress = event.lengthComputable ? event.loaded / event.total : 0;

                    scope.percent = progress;
                    var dd = new Date();
                    var currentTime = dd.getTime();
                    var interval = currentTime - lastTime;
                    lastTime = currentTime;
                    var transferred = (event.lengthComputable ? event.loaded : 0);
                    var transferredBytes = transferred - lastTransferred;
                    lastTransferred = transferred;
                    scope.transferRate = transferredBytes * 1000 / interval;

                    scope.$digest();
                    //that._onProgressItem(item, progress);
                };

                scope.currentUploader.onload = function() {

                    var dd = new Date();
                    var currentTime = dd.getTime();
                    var secondsLeft = (currentTime - startTime) / 1000;

                    var fileInfo = JSON.parse(scope.currentUploader.response);
                    scope.currentFolder.Children.push(fileInfo);
                    scope.$digest();

                    scope.currentUploader = null;

                    messageBox.show(
                        'Transfer complete',
                            'Size: ' + filter('bytes')(fileInfo.Size, 1)  + '<br/>' +
                            'Duration: ' + secondsLeft + ' sec.' + '<br/>' +
                            'Rate: ' + filter('bytes')((fileInfo.Size / secondsLeft), 1) + ' / sec'
                    );
                };

                scope.currentUploader.onerror = function() {
                    messageBox.show('Exception occured');
                    scope.currentUploader = null;
                };

                scope.currentUploader.onabort = function() {
                    messageBox.show('Transfer aborted');
                    scope.currentUploader = null;
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

		scope.onUploadFolder = function() {
            messageBox.show(
                'Wow',
                'onUploadFolder'
            );
		};
		
		scope.getData();

	}
]);