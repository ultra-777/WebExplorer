'use strict';

angular.module('explorer')
    .directive('splitter', function() {

        var getTemplate = function(orientation){
            var isVertical = (orientation === 'vertical');
            var template = '';

            switch(orientation){
                case 'vertical':
                    template = '<table class="split-panes {{orientation}}" style="height: 100%; width: 100%" ng-transclude/>';
                    break;
                case 'horizontal':
                    template = '<table style="height: 100%; width: 100%"><tr class="split-panes {{orientation}}" ng-transclude/></table>';
                    break;
                default:
                    template = '<div ng-transclude></div>';
                    break;
            }
            return template;
        };

        function findStyle(selector) {
            for(var s in document.styleSheets){
                var sheet = document.styleSheets[s];
                if (!sheet)
                    continue;
                var rules = sheet.cssRules;
                for(var r in rules) {
                    var rule = rules[r];
                    if (!rule)
                        continue;
                    if(rule.selectorText == selector)
                        return rule.style;
                }
            }
            return null;
        };

        function applyDefaultSize(pane, isVertical){
            if (pane.defaultSize && !pane.defaultSizeApplied){
                pane.elem.css((isVertical ? 'height' : 'width'), pane.defaultSize + 'px');
                pane.defaultSizeApplied = true;
            }
        };

        var handlerContent = '<table width="100%" height="100%"><tr ><td class="handler-content"></td></tr></table>';


        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                orientation: '@',
                handlerSize: '@',
                isFixed: '='
            },
            template: function(element){
                var orientation = element.attr('orientation');
                return getTemplate(orientation);
            },
            controller: function ($scope) {
                $scope.panes = [];

                this.addPane = function(pane){
                    if ($scope.panes.length > 1)
                        throw 'splitters can only have two panes';
                    $scope.panes.push(pane);
                    return $scope.panes.length;
                };
            },
            link: function(scope, element, attrs) {
                var vertical = scope.orientation == 'vertical';
                var extraSize = null;
                var handlerSize = 0;
                var handler = null;
                if (!scope.isFixed) {
                    handlerSize = scope.handlerSize;
                    if (handlerSize) {
                        handlerSize = parseInt(handlerSize);
                        extraSize = handlerSize;
                    }
                    else {
                        var style =
                            findStyle(
                                vertical ?
                                    '.split-panes.vertical > .split-handler'
                                    : '.split-panes.horizontal > .split-handler');
                        if (style) {
                            handlerSize =
                                parseInt(
                                    vertical ?
                                        style.height
                                        : style.width);
                        }
                    }
                    if (!handlerSize)
                        handlerSize = 5;
                    handler =
                        vertical ?
                            angular.element(
                                '<tr class="split-handler"' +
                                (extraSize ? (' style="height: ' + extraSize + 'px;"') : '') +
                                '>' +
                                handlerContent +
                                '<td/></tr>')
                            : angular.element(
                                '<td class="split-handler"' +
                                (extraSize ? (' style="width: ' + extraSize + 'px;"') : '') +
                                '>' +
                                handlerContent +
                                '</td>');
                }

                var pane1 = scope.panes[0];
                var pane2 = scope.panes[1];
                var pane1Min = pane1.minSize || 0;
                var pane2Min = pane2.minSize || 0;

                applyDefaultSize(pane1, vertical);
                applyDefaultSize(pane2, vertical);

                var drag = false;

                if (handler)
                    pane1.elem.after(handler);

                var div1 = pane1.elem.find('div:first');
                var div2 = pane2.elem.find('div:first');

                var handlerOffset = 0;

                element.bind('mousemove', function (ev) {
                    if (!drag) return;

                    var bounds = element[0].getBoundingClientRect();
                    var pos = 0;

                    if (vertical) {

                        var height = bounds.bottom - bounds.top;
                        pos = ev.clientY - bounds.top - handlerOffset;
                        scope.pos = pos;

                        if (pos < pane1Min) return;
                        if (height - pos < pane2Min) return;

                        var pane2Height = height - pos - handlerSize;
                        if (pane2Height < pane2Min)  return;

                        div1.css('height', pos + 'px');
                        pane1.elem.css('height', pos + 'px');
                        div2.css('height', pane2Height + 'px');
                        pane2.elem.css('height', pane2Height + 'px');
                        //console.log('vertical(' + height + '): ' + pos + ' x ' + pane2Height);

                    } else {

                        var width = bounds.right - bounds.left;
                        pos = ev.clientX - bounds.left - handlerOffset;
                        scope.pos = pos;

                        var pane2Width = width - pos - handlerSize;

                        if (pane2Width < pane2Min)  return;

                        if (pos < pane1Min) return;
                        if (width - pos < pane2Min) return;

                        pane1.elem.css('width', pos + 'px');
                        div1.css('width', pos + 'px');
                        pane2.elem.css('width', pane2Width + 'px');
                        div2.css('width', pane2Width + 'px');
                        //console.log('horizontal(' + width + '): ' + pos + ' x ' + pane2Width);
                    }
                    div1.toggle().toggle();
                    div2.toggle().toggle();
                });

                if (handler) {
                    handler.bind('mousedown', function (ev) {

                        var bounds = element[0].getBoundingClientRect();
                        if (vertical) {

                            var height = bounds.bottom - bounds.top;
                            var pos = ev.clientY - bounds.top;
                            var pane1Height = parseInt(pane1.elem.css('height'));
                            if (pane1Height < pos)
                                handlerOffset = pos - pane1Height;
                        }
                        else {
                            var width = bounds.right - bounds.left;
                            var pos = ev.clientX - bounds.left;
                            var pane1Width = parseInt(pane1.elem.css('width'));
                            if (pane1Width < pos)
                                handlerOffset = pos - pane1Width;
                        }

                        ev.preventDefault();
                        drag = true;
                    });
                }

                angular.element(document).bind('mouseup', function (ev) {
                    drag = false;
                    $(window).trigger('resize');
                });

                var owners = $(element).parent(); //.not("[class^='split']");
                if (owners.length > 0){
                    scope.owner = owners[0];
                    scope.getOwnerDimensions = function () {
                        return {
                            'h': scope.owner.clientHeight,
                            'w': scope.owner.clientWidth
                        };
                    };
                    scope.$watch(scope.getOwnerDimensions, function (newValue, oldValue) {
                        element.css('width', newValue.w + 'px');
                        element.css('height', newValue.h + 'px');

                        var height = newValue.h;
                        var width = newValue.w;
                        var panelOne = pane1.elem[0];
                        var panelTwo = pane2.elem[0];
                        var handlerFloatSize = parseFloat(handlerSize);

                        if (vertical) {

                            var pane1Height = 0;
                            if (panelOne.style && panelOne.style.height) {
                                var currentPane1Height = parseFloat(panelOne.style.height);
                                if (height < (currentPane1Height + handlerFloatSize)) {
                                    var oldHeight = currentPane1Height + parseFloat(panelTwo.style.height) + handlerFloatSize;
                                    var ratio = panelOne.clientHeight / oldHeight;
                                    pane1Height = Math.ceil(height * ratio);
                                }
                                else
                                    pane1Height = currentPane1Height;
                            }
                            else
                                pane1Height = Math.ceil(height / 2);

                            var pane2Height = (height - pane1Height - handlerFloatSize);

                            pane1.elem.css('height', pane1Height + 'px');
                            div1.css('height', pane1Height + 'px');
                            pane2.elem.css('height', pane2Height + 'px');
                            div2.css('height', pane2Height + 'px');

                            pane1.elem.css('width', width + 'px');
                            div1.css('width', width + 'px');
                            pane2.elem.css('width', width + 'px');
                            div2.css('width', width + 'px');


                        } else {

                            var pane1Width = 0;
                            if (panelOne.style && panelOne.style.width) {
                                var currentPane1Width = parseFloat(panelOne.style.width);
                                if (width < (currentPane1Width + handlerFloatSize)) {
                                    var oldWidth = currentPane1Width + parseFloat(panelTwo.style.width) + handlerFloatSize;
                                    var ratio = panelOne.clientWidth / oldWidth;
                                    pane1Width = Math.ceil(width * ratio);
                                }
                                else
                                    pane1Width = currentPane1Width;
                            }
                            else
                                pane1Width = Math.ceil(width / 2);

                            var pane2Width = (width - pane1Width - handlerFloatSize);

                            pane1.elem.css('width', pane1Width + 'px');
                            div1.css('width', pane1Width + 'px');
                            pane2.elem.css('width', pane2Width + 'px');
                            div2.css('width', pane2Width + 'px');

                            pane1.elem.css('height', height + 'px');
                            div1.css('height', height + 'px');
                            pane2.elem.css('height', height + 'px');
                            div2.css('height', height + 'px');
                        }


                    }, true);
                }
            }
        };
    })
    .directive('splitterPane', function () {
        var getTemplate = function(orientation, scrollability){
            var isVertical = (orientation === 'vertical');
            var isScrollable = (scrollability === 'true');
            var template = '';

            switch(orientation){
                case 'vertical':
                    template = '<tr><td><div class="split-pane{{index}}" ng-transclude style="height: 100%; overflow: ' +
                    (isScrollable ? 'auto' : 'hidden') +
                    ';"/></td></tr>';
                    break;
                case 'horizontal':
                    template = '<td><div  class="split-pane{{index}}" ng-transclude style="height: 100%; overflow: ' +
                    (isScrollable ? 'auto' : 'hidden') +
                    ';"/>';
                    break;
                default:
                    template = '<div ng-transclude></div>';
                    break;
            }
            return template;
        };

        return {
            restrict: "E",
            require: '^splitter',
            replace: true,
            transclude: true,
            scope: {
                minSize: '=',
                defaultSize: '=',
                isScrollable: '='
            },
            template: function(element){
                var splitter = element.closest('splitter');
                var orientation = splitter.attr('orientation');
                var isScrollable = element.attr('is-scrollable');
                return getTemplate(orientation, isScrollable);
            },
            link: function(scope, element, attrs, bgSplitterCtrl) {
                scope.elem = element;
                scope.index = bgSplitterCtrl.addPane(scope);
            }
        };
    });