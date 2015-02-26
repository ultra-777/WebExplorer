
'use strict';

angular.module('explorer').directive('treeNode', ['$compile', '$parse', 'recursionHelper',
    function(compile, parse, recursionHelper) {
        return {
            scope: {
                folderInfo: '=folderInfo',
                parentNode: '=parentNode',
                selectionChangeHandler: '&onSelectionChanged'
            },
            restrict: 'EA',

            templateUrl: 'modules/explorer/views/tree-node-view.client.view.html',
            replace: true,
            controller: 'TreeNodeController',
            transclude: true,
            compile: function(element) {
                return recursionHelper.compile(element, function(theScope, theElement, theAttrs, theController){
                    theScope.data = theScope.folderInfo;
                    theScope.parent = theScope.parentNode;
                    theScope.init && theScope.init();
                })
            }

        };
    }
]);