(function ContextMenu($angular) {

    "use strict";

    /**
     * @module ngContextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    var module = $angular.module('ngContextMenu', []);

    /**
     * @module ngContextMenu
     * @service ContextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    module.factory('contextMenu', function contextMenuService() {

        var factory = {};

        /**
         * @property cancelIteration
         * @type {Number}
         * @default 0
         */
        factory.cancelIteration = 1;

        /**
         * @property isOpening
         * @type {Boolean}
         */
        factory.isOpening = false;

        /**
         * @property attachedClick
         * @type {Boolean}
         */
        factory.attachedClick = false;

        /**
         * Responsible for closing all of the visible context menus.
         *
         * @method cancelAll
         * @return {void}
         */
        factory.cancelAll = function cancelAll() {
            factory.cancelIteration++;
        };

        return factory;

    });

    /**
     * @module ngContextMenu
     * @directive contextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    module.directive('contextMenu', ['$window', '$http', '$compile', '$templateCache', 'contextMenu',

    function contextMenuDirective($window, $http, $compile, $templateCache, contextMenu) {

        return {

            /**
             * @property restrict
             * @type {String}
             */
            restrict: 'EA',

            /**
             * @property scope
             * @type {Object}
             */
            scope: {
                include: '@contextMenu',
            },

            /**
             * @method controller
             * @param $scope {Object}
             * @return {void}
             */
            controller: ['$scope', function ($scope) {

                /**
                 * @property template
                 * @type {String}
                 */
                $scope.template = '';

                /**
                 * @property event
                 * @type {Object|null}
                 */
                $scope.event = null;

                /**
                 * @property menu
                 * @type {Object|null}
                 */
                $scope.menu = null;

                /**
                 * @method throwException
                 * @throw Exception
                 * @param message {String}
                 * @return {void}
                 */
                $scope.throwException = function throwException(message) {
                    throw "ngContextMenu: " + message + ".";
                };

                /**
                 * @method cacheTemplate
                 * @param templatePath {String}
                 * @return {void}
                 */
                $scope.cacheTemplate = function cacheTemplate(templatePath) {

                    $http.get(templatePath, { cache: $templateCache }).then(function then(response) {

                        // Define the template with expressions.
                        $scope.template = response.data;

                    }).catch(function catchError() {

                        // Unable to find the supplied template path.
                        $scope.throwException('Invalid context menu path: "' + templatePath + '"');

                    });

                };

                /**
                 * @method cancelOne
                 * @return {void}
                 */
                $scope.cancelOne = function cancelOne() {

                    if ($scope.menu) {
                        $scope.menu.remove();
                        $scope.event = null;
                    }

                };

            }],

            /**
             * @method link
             * @param scope {Object}
             * @param element {Object}
             * @return {void}
             */
            link: function link(scope, element, attributes) {

                if (!contextMenu.attachedClick) {

                    // Subscribe to the onClick event of the HTML node to remove any context menus
                    // that may be open.
                    var htmlElement = $angular.element($window.document.getElementsByTagName('html'));
                    contextMenu.attachedClick = true;

                    htmlElement.bind('click', function onClick() {

                        if (attributes.contextEvent === 'click' && contextMenu.isOpening) {
                            contextMenu.isOpening = false;
                            return;
                        }

                        // Remove all of the open context menus.
                        scope.$apply(contextMenu.cancelAll);

                    });

                }

                // Prefetch the supplied template.
                scope.cacheTemplate(scope.include);

                // Listen for any attempts to cancel the current context menu.
                scope.$watch(function setupObserver() {
                    return contextMenu.cancelIteration;
                }, scope.cancelOne);

                /**
                 * @method render
                 * @param event {Object}
                 * @return {void}
                 */
                scope.render = function render(event) {

                    if (!event) {
                        return;
                    }

                    // Prevent the default context menu from opening, and make the user
                    // defined context menu appear instead.
                    event.preventDefault();

                    scope.menu = $compile(scope.template)(scope.$parent);

                    if (scope.menu.length > 1) {

                        // Throw exception when the compiled template is adding more than one child node.
                        scope.throwException('Context menu is adding ' + scope.menu.length + ' child nodes');

                    }
                    
                    scope.$apply(function () {
                        element.append(scope.menu);
                    });

                    scope.menu.css({ 
                        display: 'block',
			position: 'fixed',
			left: event.clientX + 'px',
			top: event.clientY + 'px'
                    });

                    // Memorise the event for re-rendering.
                    scope.event = event;

                };

                // Bind to the context menu event.
                element.on('contextmenu', function (event) {

                    scope.$apply(function apply() {

                        // Remove any existing context menus for this element and other elements.
                        contextMenu.cancelAll();

                    });

                    scope.render(event);
                    contextMenu.isOpening = true;

                });

            }

        }

    }]);

})(window.angular);
