'use strict';

angular.module('explorer').directive('fileList', [
    function() {
        return {
            scope: {
                nodeId: '=nodeId',
                contentsChanged: '&onContentsChanged'
            },
            restrict: 'EA',

            templateUrl: 'modules/explorer/views/file-list.client.view.html',
            replace: true,
            controller: 'fileListController',
            transclude: true,
            link: function(theScope, theElement, theAttrs) {
                theScope.init && theScope.init();
            }
        };
    }
]);