'use strict';

angular
    .module('explorer')
    .directive(
        'sizeKeeper',
    function () {
    return function (scope, element, attrs) {
        var parent = angular.element(element.parent());

        scope.getParentDimensions = function () {
            return {
                'h': parent.height(),
                'w': parent.width()
            };
        };

        var recalculateLayout = function(newDimensions){
            //console.log('--new size keeper dimensions: ' + newDimensions.w + ' x ' + newDimensions.h);
            if ((newDimensions.w < 0) || (newDimensions.h < 0)){
                return;
            }
            if ($(element).width() != newDimensions.w)
                $(element).width(newDimensions.w);
            if ($(element).height() != newDimensions.h)
                $(element).height(newDimensions.h);
            scope.currentWidth = newDimensions.w;
            scope.currentHeight = newDimensions.h;
            $(element).toggle().toggle();
        };

        scope.$watch(scope.getParentDimensions, function (newValue, oldValue) {
            newValue.w = newValue.w - 2;
            newValue.h = newValue.h - 2;
            recalculateLayout(newValue);
        }, true);
    }
});
