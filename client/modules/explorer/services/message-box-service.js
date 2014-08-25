/**
 * Created by Andrey on 25.08.2014.
 */
'use strict';
angular.module('explorer').service('messageBoxService', ['$modal',
    function (modal) {

        var dialogDefaults = {
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            dialogFade: true,
            templateUrl: '/app/partials/dialog.html'
        };

        var dialogOptions = {
            closeButtonText: 'Close',
            actionButtonText: 'OK',
            headerText: 'Proceed?',
            bodyText: 'Perform this action?'
        };

        this.show = function (title, message, buttons) {
            var defaultButtons = [
                {result: 'ok', label: 'OK', cssClass: 'btn-primary'}
            ];

            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/message-box-view.html',
                controller: 'MessageBoxController',
                windowClass: 'css-center-modal',
                resolve: {
                    model: function () {
                        return {
                            title: title,
                            message: message
                        };
                    }
                }

            });

            return modalInstance;
        }
    }]);