angular
    .module('explorer')
    .directive('cellInput', [function() {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ngModel) {
            var oldCellValue;
            var dereg = scope.$watch('ngModel', function() {
                oldCellValue = ngModel.$modelValue;
                dereg();
            });

            function keydown (evt) {
                switch (evt.keyCode) {
                    case 37:
                    case 38:
                    case 39:
                    case 40:
                        evt.stopPropagation();
                        break;
                    case 27:
                        scope.$apply(function() {
                            ngModel.$modelValue = oldCellValue;
                            ngModel.$setViewValue(oldCellValue);
                            elm.blur();
                        });
                        break;
                    case 13:
                        if(scope.totalFilteredItemsLength() - 1 > scope.row.rowIndex) {
                            elm.blur();
                        }
                        break;
                }

                return true;
            }
            elm.bind('keydown', keydown);

            function click (evt) {
                evt.stopPropagation();
            }

            elm.bind('click', click);
            function mousedown (evt) {
                evt.stopPropagation();
            }

            elm.bind('mousedown', mousedown);

            elm.bind('focus', function(){
                oldCellValue = ngModel.$modelValue;
            });

            elm.on('$destroy', function() {
                elm.off('keydown', keydown);
                elm.off('click', click);
                elm.off('mousedown', mousedown);
            });

            scope.$on('$destroy', scope.$on('ngGridEventStartCellEdit', function () {
                elm.focus();
                elm.select();
            }));

            angular.element(elm).bind('blur', function () {
                scope.$emit('ngGridEventEndCellEdit');
            });
        }
    };
}]);
