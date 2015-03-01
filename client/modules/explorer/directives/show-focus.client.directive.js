angular
    .module('explorer')
        .directive('showFocus',
        function($timeout) {
        return function(scope, element, attrs) {
            scope.$watch(attrs.showFocus,
                function (newValue) {
                    $timeout(function() {
                        newValue && element[0].focus();
                    });
                },true);
        };
    });
