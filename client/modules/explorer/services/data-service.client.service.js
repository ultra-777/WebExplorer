'use strict';

angular.module('explorer').service('explorerDataService', ['$http', '$q', '$location',
	function(http , q, location) {

        var serverController = '/explorer';

	    this.httpRequest = function (method, url, data) {
            var defer = q.defer();
            var promise = defer.promise;

            var header = {
                method: method,
                url: serverController + url,
                contentType: 'application/json'
            };

            if ((data !== null) && (data !== undefined)) {
                var dataObject = {};
                for (var key in data) {
                    dataObject[key] = data[key];
                }
                header.data = dataObject;
            }



            http(header)
                .then(function (response) {
                    defer.resolve(response.data);
                },
                function (response) {
                    defer.reject('Exception occured: ' + response.status);
                });
            return promise;

        };

        this.getData = function () {
            return this.httpRequest('GET', '/Root', null);
        };

        this.getFolder = function (id) {
            return this.httpRequest('POST', '/Folder', { 'id': id });
        };

        this.download = function (id) {
            return this.httpRequest('POST', '/Download', { 'id': id });
        };

        this.delete = function (id) {
            return this.httpRequest('POST', '/Delete', { 'id': id });
        };

        this.newFolder = function (id, name) {
            return this.httpRequest('POST', '/NewFolder', { 'id': id, name: name });
        };

        this.getDownloadUrl = function(id) {
            var url = serverController + '/Download' + '?' + 'id=' + id;
            return url;
        };

        this.initBlob = function (parentId, name, totalSize, chunkSize) {
            return this.httpRequest('POST', '/InitBlob', { 'folderId': parentId, 'fileName': name, 'totalSize': totalSize, 'chunkSize': chunkSize });
        };

        this.addBlobChunk = function (blobId, chunkIndex, data) {
            return this.httpRequest('POST', '/AddBlobChunk', { 'blobId': blobId, 'chunkIndex': chunkIndex, 'data': data });
        };

        this.releaseBlob = function (blobId, chunkIndex, data) {
            return this.httpRequest('POST', '/ReleaseBlob', { 'blobId': blobId });
        };

        this.rename = function (nodeId, newName) {
            return this.httpRequest('POST', '/Rename', { 'id': nodeId, newName: newName });
        };

    }
]);