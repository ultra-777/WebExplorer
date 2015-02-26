'use strict';

angular.module('explorer').directive('uploaderButton', [function() {

    return {
        link:function(scope,elem,attrs,ngModel){
            //change event is fired when file is selected
            elem.bind('click',function(){
                $('#source').click();
            });
        }
    }
}]);

