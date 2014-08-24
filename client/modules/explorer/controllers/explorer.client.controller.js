'use strict';

angular.module('explorer').controller('ExplorerController', ['$scope', 'DataService', '$modal', '$filter',
	function(scope, dataService, modal, filter) {
		
		
		scope.currentFolder = null;
		scope.canBack = false;
		scope.path = [];
		scope.isNavigating = false;
		scope.percent = 0.0;
        scope.transferRate = 0;
		scope.currentBlob = null;

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
					alert(error);
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
					alert(error);
				}
			);
		};

		scope.applyScopeFolder = function (newFolder) {
            if (newFolder.Children !== null)
                newFolder.Children.sort(compareChildren);
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
					alert(error);
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
					alert(error);
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
						alert(error);
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
			if (scope.currentBlob !== null) {
				dataService.releaseBlob(scope.currentBlob);
				scope.currentBlob = null;
				scope.$digest();
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
					alert('File API не поддерживается данным браузером');
					return;
				}
				
				//alert('Source: ' + fileInfo.source + '  Name: ' + fileInfo.name);

				var taskInfo = scope.newTask(fileInfo.source.size);

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


									var data = evt.target.result;
									data = data.substr(data.lastIndexOf(',') + 1);
									dataService.addBlobChunk(scope.currentBlob, taskInfo.index, data)
										.then(function(result) {

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
                                                if (interval >= (1000)){
                                                    lastTime = currentTime;
                                                    var currentLeft = taskInfo.left;
                                                    var transferredBytes = lastLeft - currentLeft;
                                                    lastLeft = currentLeft;
                                                    scope.transferRate = transferredBytes;
                                                }

												if (taskInfo.left > 0) {
													blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
													reader.readAsDataURL(blob);
												} else {
													scope.currentBlob = null;
                                                    var dd = new Date();
                                                    var currentTime = dd.getTime();
                                                    var secondsLeft = (currentTime - startTime) / 1000;

                                                    alert('Size: ' + filter('bytes')(taskInfo.total, 1)  + '\n' +
                                                        'Duration: ' + secondsLeft + ' sec.' + '\n' +
                                                        'Rate: ' + filter('bytes')((taskInfo.total / secondsLeft), 1) + ' / sec');
												}

												scope.percent = prcent;
												scope.$digest();
											},
											function(result) {
                                                dataService.releaseBlob(scope.currentBlob);
												scope.currentBlob = null;
                                                alert(result);
                                                scope.$digest();
											});


								} else {
									var q = 99;
								}
							} else {
								var qq = 99;
							}
						};

						reader.readAsDataURL(blob);
					});
			}, function (exc) {
				var w = 0;
			});
		};

		scope.onUploadFolder = function() {
			alert('onUploadFolder');
		};
		
		scope.getData();

	}
]);