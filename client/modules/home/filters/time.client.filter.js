'use strict';

angular.module('home').filter('timeFilter',['$filter',  function(filter) {
    return function(theDate, formatTemplate) {
        return filter('date')(theDate, formatTemplate);
    };
}])