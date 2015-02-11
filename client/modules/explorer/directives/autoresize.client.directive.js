/**
 * Created by Andrey on 11.02.2015.
 */
angular.module('explorer').directive('autoresize', function ($window) {
    return function (scope, element, attrs) {
        var w = angular.element($window);

        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };

        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            var elementHeight = newValue.h - element.position().top;

            var offset =  attrs.resizeOffset;
            if (offset)
                elementHeight = elementHeight - offset;

            $(element).attr('style',   'max-height:' + elementHeight + 'px; overflow-y: auto;' );
            $(element).toggle().toggle();

        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
})
