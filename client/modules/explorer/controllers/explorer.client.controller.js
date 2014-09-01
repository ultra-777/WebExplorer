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
                                                    var secondsLeft = (currentTime - startTime) / 1000;

                                                    messageBox.show(
                                                        'Transfer complete',
                                                        'Size: ' + filter('bytes')(taskInfo.total, 1)  + '<br/>' +
                                                        'Chunks count: ' + taskInfo.index + '<br/>' +
                                                        'Duration: ' + secondsLeft + ' sec.' + '<br/>' +
                                                        'Rate: ' + filter('bytes')((taskInfo.total / secondsLeft), 1) + ' / sec'
                                                    );
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
                    alert('File API не поддерживается данным браузером');
                    return;
                }


                var xhr = new XMLHttpRequest();
                var form = new FormData();
                form.append("some", "mydata");
                form.append("file", file, file.name);

                xhr.upload.onprogress = function(event) {
                    var q = 1;
                    //var progress = Math.round(event.lengthComputable ? event.loaded * 100 / event.total : 0);
                    //that._onProgressItem(item, progress);
                };

                xhr.onload = function() {
                    var q = 1;

                    messageBox.show(
                        'Transfer Ok',
                            'Response:' + xhr.response + '<br/>' +
                            'Headers: ' + xhr.getAllResponseHeaders()  + '<br/>' +
                            'Status: ' + xhr.status + '<br/>'
                    );

                    //var headers = that._parseHeaders(xhr.getAllResponseHeaders());
                    //var response = that._transformResponse(xhr.response);
                    //var gist = that._isSuccessCode(xhr.status) ? 'Success' : 'Error';
                    //var method = '_on' + gist + 'Item';
                    //that[method](item, response, xhr.status, headers);
                    //that._onCompleteItem(item, response, xhr.status, headers);
                };

                xhr.onerror = function() {
                    var q = 1;
                    //var headers = that._parseHeaders(xhr.getAllResponseHeaders());
                    //var response = that._transformResponse(xhr.response);
                    //that._onErrorItem(item, response, xhr.status, headers);
                    //that._onCompleteItem(item, response, xhr.status, headers);
                };

                xhr.onabort = function() {
                    var q = 1;
                    //var headers = that._parseHeaders(xhr.getAllResponseHeaders());
                    //var response = that._transformResponse(xhr.response);
                    //that._onCancelItem(item, response, xhr.status, headers);
                    //that._onCompleteItem(item, response, xhr.status, headers);
                };

                xhr.open("POST", "/explorer/UploadFile", true);

                xhr.withCredentials = false;

                xhr.send(form);

/*

                var reader = new FileReader();

                reader.onload = function() {
                    var xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", function (e) {
                        if (e.lengthComputable) {
                            var progress = (e.loaded * 100) / e.total;
                        }
                    }, false);


                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            if (this.status == 200) {
                                // ... все ок! смотрим в this.responseText ...
                            } else {
                                // ... ошибка!
                            }
                        }
                    };
                };

*/









                /*
                var uploadUrl = "/explorer/UploadFile";
                var fileReader = new FileReader();
                fileReader.onload = function(e) {
                    $scope.upload[index] = uploadService.http({
                        url: uploadUrl,
                        headers: {'Content-Type': $scope.selectedFiles[index].type},
                        data: e.target.result
                    }).then(function(response) {
                        $scope.uploadResult.push(response.data);
                    }, function(response) {
                        if (response.status > 0) $scope.errorMsg = response.status + ': ' + response.data;
                    }, function(evt) {
                        // Math.min is to fix IE which reports 200% sometimes
                        $scope.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });
                }
                fileReader.readAsArrayBuffer(file);

                */

/*
                var reader = new FileReader();

                reader.onload = function() {
                    var xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", function (e) {
                        if (e.lengthComputable) {
                            var progress = (e.loaded * 100) / e.total;
                        }
                    }, false);


                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            if(this.status == 200) {
                                // ... все ок! смотрим в this.responseText ...
                            } else {
                                // ... ошибка!
                            }
                        }
                    };


                    xhr.open("POST", "/explorer/UploadFile");
                    var boundary = "xxxxxxxxx";
                    // Устанавливаем заголовки
                    xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary="+boundary);
                    xhr.setRequestHeader("Cache-Control", "no-cache");
                    xhr.setRequestHeader("Connection", "keep-alive");
                    xhr.setRequestHeader("Keep-Alive", "300");

                    // Формируем тело запроса
                    var body = "--" + boundary + "\r\n";
                    body += "Content-Disposition: form-data; name='myFile1'; filename='" + file.name + "'\r\n";
                    body += "Content-Type: application/octet-stream\r\n\r\n";
                    body += reader.result + "\r\n";
                    body += "--" + boundary + "\r\n";
                    body += "Content-Disposition: form-data; name='myFile2'; filename='" + file.name + "_2" + "'\r\n";
                    body += "Content-Type: application/octet-stream\r\n\r\n";
                    body += reader.result + "\r\n";
                    body += "--" + boundary + "\r\n";
                    body += "Content-Disposition: form-data; name='myFile3'; filename='" + file.name + "_3" + "'\r\n";
                    body += "Content-Type: application/octet-stream\r\n\r\n";
                    body += reader.result + "\r\n";
                    body += "--" + boundary + "--";
                    body += + "\r\n";
                    body += + "\r\n";

                    if(xhr.sendAsBinary) {
                        // только для firefox
                        xhr.sendAsBinary(body);
                    } else {
                        // chrome (так гласит спецификация W3C)
                        xhr.send(body);
                    }
                }

                // Читаем файл
                reader.readAsBinaryString(file);
                */
            });







        };

		scope.onUploadFolder = function() {
			alert('onUploadFolder');
		};
		
		scope.getData();

	}
]);