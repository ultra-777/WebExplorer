'use strict';

angular.module('home').service('dataService', ['$http', '$q', '$location',
	function(http , q, location) {

        var serverController = '/home';

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

        this.getUserInfo = function () {
            return this.httpRequest('GET', '/userInfo', null);
        };
    }
]);