'use strict';

angular.module('explorer').directive('uploaderButton', [function() {

    return {
        //require:'ngModel',
        link:function(scope,elem,attrs,ngModel){
            //change event is fired when file is selected
            elem.bind('click',function(){
                $('#source').click();
            });
        }
    }
}]);

/*
    return {
        restrict: 'E',
        scope: {

            // scope
            // define a new isolate scope

        },
        controller: ['$scope', function ($scope) {

            // controller:
            // here you should define properties and methods
            // used in the directive's scope

        }],
        link: function(scope, elem, attrs, ctrl) {
            $("#btnUpload").click(function()
            {
                elem.find('.fake-uploader').click(function() {
                elem.find('input[type="file"]').click();
            });


        }//,
        //replace: false,
        //templateUrl: 'uploader.html'
    };

}]);
*/
