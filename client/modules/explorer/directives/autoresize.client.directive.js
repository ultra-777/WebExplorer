'use strict';

angular.module('explorer').directive('autoresize', function ($window) {
    return function (scope, element, attrs) {
        var w = angular.element($window);

        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };

        scope.getElementPosition = function () {
            return {
                'top': element.position().top,
                'left': element.position().left
            };
        };

        var recalculateLayout = function(){
            var newValue = scope.getWindowDimensions();
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            var elementHeight = newValue.h - scope.getElementPosition().top;

            var offset =  attrs.resizeOffset;
            if (offset)
                elementHeight = elementHeight - offset;

            $(element).attr('style',   'max-height:' + elementHeight + 'px;height:' + elementHeight + 'px; overflow-y: auto;' );
            $(element).toggle().toggle();
        };

        scope.$watch(scope.getElementPosition, function (newValue, oldValue) {
                recalculateLayout();
        }, true);

        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            recalculateLayout();
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
})
