'use strict';

angular
    .module('explorer')
    .controller(
        'TreeNodeController', [
            '$scope',
            'explorerDataService',
            '$modal',
            'messageBoxService',
    function(scope, dataService, modal, messageBox) {
        scope.parent = null;
        scope.isAsynqOperation = false;
        scope.dataChildren = null;
        scope.children = new Array();
        if ((scope.data === null) || (scope.data === undefined))
            scope.data = null;
        if ((scope.isExpanded === null) || (scope.isExpanded === undefined))
            scope.isExpanded = false;
        if ((scope.isSelected === null) || (scope.isSelected === undefined))
            scope.isSelected = false;

        scope.init = function () {
            if (!scope.data)
                registerFolderInfoWatch();
            if (scope.parent) {
                scope.parent.children.push(scope);
                registerParentExpandedWatch();
            }
        };

        scope.hasChildren = function(){
            return scope.dataChildren ? (scope.dataChildren.length > 0) : false;
        };

        scope.select = function () {
            if (scope.data)
                applySelection(scope.data.id, scope, false);
        };

        scope.expand = function () {
            if (scope.dataChildren)
                onExpand();
            else
                getFolder(scope.data.id, onExpand);
        };

        scope.delete = function(operationTitle) {
            if (!operationTitle)
                operationTitle = 'delete';
            if (!scope.canDelete()){
                messageBox.show(
                    operationTitle,
                    'The root node cannot be removed' + (scope.data ? (': ' + scope.data.name) : '')
                );
                return;
            }

            scope.isAsynqOperation = true;
            dataService.delete(scope.data.id)
                .then(function(data) {
                    scope.isAsynqOperation = false;
                    if (data) {
                        if (scope.parent){

                            if (scope.parent.children) {
                                var index =
                                    getItemIndexInArray(
                                        scope.parent.children,
                                        function (candidate) {
                                            return (scope === candidate);
                                        });

                                if (index > -1)
                                    scope.parent.children.splice(index, 1);
                            }

                            if (scope.parent.dataChildren) {
                                var index =
                                    getItemIndexInArray(
                                        scope.parent.dataChildren,
                                        function (candidate) {
                                            return (scope.data.id === candidate.id);
                                        });

                                if (index > -1)
                                    scope.parent.dataChildren.splice(index, 1);
                            }
                        }
                    }
                },
                function (error) {
                    scope.isAsynqOperation = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
                }
            );
        };

        scope.canDelete = function(){
            return scope.parent ? true : false;
        };

        scope.rename = function(operationTitle, target) {
            if (!operationTitle)
                operationTitle = 'rename';
            if (!target)
                target = 'node';
            if (!scope.canRename()){
                messageBox.show(
                    operationTitle,
                    'The root node cannot be renamed' + (scope.data ? (': ' + scope.data.name) : '')
                );
                return;
            }

            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/rename.client.view.html',
                controller: 'renameController',
                resolve: {
                    currentName: function () {
                        return scope.data.name;
                    },
                    target: function(){
                        return target;
                    },
                    neighbours: function () {
                        var neighbours = [];
                        var currentName = null;
                        enumerateArray(scope.parent.children, function(neighbour, index){
                            neighbours.push({name: neighbour.data.name});
                        });
                        return neighbours;
                    }
                }
            });

            modalInstance.result.then(function (newName) {
                scope.isAsynqOperation = true;
                dataService.rename(scope.data.id, newName)
                    .then(function(result) {
                        scope.isAsynqOperation = false;
                        if (result) {
                            scope.data.name = newName;
                            scope.parent.dataChildren.sort(compareChildren);
                        }
                    },
                    function (error) {
                        scope.isNavigating = false;
                        messageBox.show(
                            'Deleting ' + target + ' exception',
                            error
                        );
                    }
                );
            }, function(reason){
            });
        };

        scope.canRename = function(){
            return scope.parent ? true : false;
        };

        scope.newNode = function() {

            var modalInstance = modal.open({
                templateUrl: 'modules/explorer/views/new-folder.client.view.html',
                controller: 'NewFolderController',
                resolve: {
                    children: function() {
                        return scope.children;
                    },
                    dataChildren: function() {
                        return scope.dataChildren;
                    }
                }
            });

            modalInstance.result.then(function (newFolderName) {
                dataService.newFolder(scope.data.id, newFolderName)
                    .then(function (newFolder) {
                        scope.dataChildren.push({
                            id: newFolder.Id,
                            name: newFolder.Name,
                            needSelection: true});
                        scope.dataChildren.sort(compareChildren);
                        if (!scope.isExpanded)
                            scope.expand();
                    },
                    function (error) {
                        messageBox.show(
                            'Exception',
                            error
                        );
                    });
            }, function (dismissReason) {
                // no need to do anything
            });
        };

        var applySelection = function (id, node, recursive) {

            node.isSelected = (node.data.id == id);

            if (recursive || !node.parent){
                enumerateArray(node.children, function(child, index){
                    applySelection(id, child, true);
                });
                if (!node.parent){
                    node.selectionChangeHandler({id: id});
                }
            }
            else
                applySelection(id, node.parent, false);
        };

        var onExpand = function(){
            scope.isExpanded = !scope.isExpanded;
        }

        var compareChildren = function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase())
                return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase())
                return 1;
            return 0;
        }

        var applyScopeFolder = function (newFolder, handler) {

            var dataChildren = new Array();
            if (newFolder.children){
                var index = -1;
                var length = newFolder.children.length;
                for (var i = 0; i < length; i++) {
                    var child = newFolder.children[i];
                    if (child.IsContainer)
                        dataChildren.push({id: child.Id, name: child.Name});
                }
                dataChildren.sort(compareChildren);
                scope.dataChildren = dataChildren;
            }
            else
                scope.dataChildren = new Array();

            handler && handler();
        };

        var getFolder = function (id, handler) {
            scope.isAsynqOperation = true;
            dataService.getFolder(id)
                .then(function (folderData) {
                    scope.isAsynqOperation = false;
                    applyScopeFolder({
                        id: folderData.Id,
                        name: folderData.Name,
                        children: folderData.Children},
                        handler);
                },
                function (error) {
                    scope.isAsynqOperation = false;
                    messageBox.show(
                        'Exception',
                        error
                    );
                }
            );
        };

        var getItemIndexInArray = function(array, comparer/*boolean function(candidate)*/){
            if (array){

                var index = -1;
                var length = array.length;
                for (var i = 0; i < length; i++) {
                    var candidate = array[i];
                    if (comparer(candidate)){
                        index = i;
                        break;
                    }
                }
                return index;
            }
        }

        var enumerateArray = function(array, handler/*void function(child, index)*/){
            if (array){
                var length = array.length;
                for (var i = 0; i < length; i++) {
                    var child = array[i];
                    handler && handler(child, i);
                }
            }
        }

        var unregisterParentExpandedWatch = null;
        var registerParentExpandedWatch = function() {
            unregisterParentExpandedWatch =
                scope.$watch('parent.isExpanded', onHandleParentExpandData);
        };

        var unregisterFolderInfoWatch = null;
        var registerFolderInfoWatch = function(){
            unregisterFolderInfoWatch = scope.$watch('folderInfo', onHandleFolderData);
        }

        var onHandleFolderData = function(newValue, oldValue){
            if (newValue) {
                scope.data = newValue;

                if (unregisterFolderInfoWatch) {
                    unregisterFolderInfoWatch();
                    unregisterFolderInfoWatch = null;
                }
                if (!scope.parent){
                    getFolder(scope.data.id);
                }
            }
            else
                scope.data = null;
        }

        var onHandleParentExpandData = function(newValue, oldValue) {
            if (newValue) {
                var needSelection = scope.data.needSelection;
                if (unregisterParentExpandedWatch) {
                    unregisterParentExpandedWatch();
                    unregisterParentExpandedWatch = null;

                    getFolder(scope.data.id);
                }
                if (needSelection){
                    delete scope.data['needSelection'];
                    scope.select();
                }
            }
        }
    }
]);
