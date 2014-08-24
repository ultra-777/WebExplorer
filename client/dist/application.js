'use strict';
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = function () {
    // Init module configuration options
    var applicationModuleName = 'xmen';
    var applicationModuleVendorDependencies = [
        'ngResource',
        'ngCookies',
        'ngAnimate',
        'ngTouch',
        'ngSanitize',
        'ui.router',
        'ui.bootstrap',
        'ui.utils'
      ];
    // Add a new vertical module
    var registerModule = function (moduleName) {
      // Create angular module
      angular.module(moduleName, []);
      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
    };
    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule
    };
  }();'use strict';
//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);
// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config([
  '$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]);
//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash === '#_=_')
    window.location.hash = '#!';
  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('explorer');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');'use strict';
// Setting up route
angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');
    // Home state routing
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'modules/core/views/home.client.view.html'
    });
  }
]);'use strict';
angular.module('core').controller('HeaderController', [
  '$scope',
  'Authentication',
  'Menus',
  function ($scope, Authentication, Menus) {
    $scope.authentication = Authentication;
    $scope.isCollapsed = false;
    $scope.menu = Menus.getMenu('topbar');
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };
    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);'use strict';
angular.module('core').controller('HomeController', [
  '$scope',
  'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);'use strict';
//Menu service used for managing  menus
angular.module('core').service('Menus', [function () {
    // Define a set of default roles
    this.defaultRoles = ['user'];
    // Define the menus object
    this.menus = {};
    // A private function for rendering decision 
    var shouldRender = function (user) {
      if (user) {
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      } else {
        return this.isPublic;
      }
      return false;
    };
    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exists');
        }
      } else {
        throw new Error('MenuId was not provided');
      }
      return false;
    };
    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      return this.menus[menuId];
    };
    // Add new menu object by menu id
    this.addMenu = function (menuId, isPublic, roles) {
      // Create the new menu
      this.menus[menuId] = {
        isPublic: isPublic || false,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      };
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      delete this.menus[menuId];
    };
    // Add menu item object
    this.addMenuItem = function (menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Push new menu item
      this.menus[menuId].items.push({
        title: menuItemTitle,
        link: menuItemURL,
        menuItemType: menuItemType || 'item',
        menuItemClass: menuItemType,
        uiRoute: menuItemUIRoute || '/' + menuItemURL,
        isPublic: isPublic || this.menus[menuId].isPublic,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      });
      // Return the menu object
      return this.menus[menuId];
    };
    // Add submenu item object
    this.addSubMenuItem = function (menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: menuItemTitle,
            link: menuItemURL,
            uiRoute: menuItemUIRoute || '/' + menuItemURL,
            isPublic: isPublic || this.menus[menuId].isPublic,
            roles: roles || this.defaultRoles,
            shouldRender: shouldRender
          });
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    //Adding the topbar menu
    this.addMenu('topbar');
  }]);'use strict';
(function () {
  describe('HeaderController', function () {
    //Initialize global variables
    var scope, HeaderController;
    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));
    beforeEach(inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      HeaderController = $controller('HeaderController', { $scope: scope });
    }));
    it('should expose the authentication service', function () {
      expect(scope.authentication).toBeTruthy();
    });
  });
}());'use strict';
(function () {
  describe('HomeController', function () {
    //Initialize global variables
    var scope, HomeController;
    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));
    beforeEach(inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      HomeController = $controller('HomeController', { $scope: scope });
    }));
    it('should expose the authentication service', function () {
      expect(scope.authentication).toBeTruthy();
    });
  });
}());'use strict';
// Setting up route
angular.module('explorer').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');
    // Home state routing
    $stateProvider.state('explorer', {
      url: '/explorer',
      templateUrl: 'modules/explorer/views/home.client.view.html'
    });
  }
]);'use strict';
angular.module('explorer').controller('ExplorerController', [
  '$scope',
  'DataService',
  '$modal',
  function (scope, dataService, modal) {
    scope.currentFolder = null;
    scope.canBack = false;
    scope.path = [];
    scope.isNavigating = false;
    scope.percent = 0;
    scope.transferRate = 0;
    scope.currentBlob = null;
    scope.upload = function () {
      alert('cheers');
    };
    scope.getCurrentFolderId = function () {
      if (scope.currentFolder === null)
        return null;
      return scope.currentFolder.Id;
    };
    scope.getParentFolderId = function () {
      if (scope.currentFolder === null)
        return null;
      return scope.currentFolder.Parent;
    };
    scope.init = function () {
      scope.getData();
    };
    scope.getData = function () {
      dataService.getData().then(function (data) {
        scope.applyScopeFolder(data);
      }, function (error) {
        alert(error);
      });
    };
    scope.getFolder = function (id) {
      scope.isNavigating = true;
      dataService.getFolder(id).then(function (data) {
        scope.isNavigating = false;
        scope.applyScopeFolder(data);
      }, function (error) {
        scope.isNavigating = false;
        alert(error);
      });
    };
    scope.applyScopeFolder = function (newFolder) {
      if (newFolder.Children !== null)
        newFolder.Children.sort(compareChildren);
      scope.currentFolder = newFolder;
      scope.path.push(newFolder);
      scope.canBack = scope.path.length > 1;
    };
    scope.moveBack = function () {
      if (scope.path.length < 2)
        return;
      var prevoiusItem = scope.path[scope.path.length - 2];
      if (prevoiusItem !== undefined && prevoiusItem !== null) {
        scope.navigate(prevoiusItem.Id);
      }
    };
    scope.navigate = function (id) {
      var length = scope.path.length;
      var target = null;
      for (var i = 0; i < length; i++) {
        var candidate = scope.path[i];
        if (candidate.Id === id) {
          target = candidate;
          scope.path.splice(i, length - i);
          scope.applyScopeFolder(target);
          return;
        }
      }
      scope.getFolder(id);
    };
    scope.download = function (item) {
      scope.isDownloading = true;
      dataService.download(item.Id).then(function (data) {
        scope.isDownloading = false;
        scope.saveFile(item.Name, data);
      }, function (error) {
        scope.isDownloading = false;
        alert(error);
      });
    };
    scope.getDownloadUrl = function (treeItemData) {
      return dataService.getDownloadUrl(treeItemData.Id);
    };
    scope.onDelete = function (node) {
      scope.isNavigating = true;
      dataService.delete(node.Id).then(function (data) {
        scope.isNavigating = false;
        if (data) {
          var index = -1;
          var length = scope.currentFolder.Children.length;
          for (var i = 0; i < length; i++) {
            var candidate = scope.currentFolder.Children[i];
            if (node.Id === candidate.Id) {
              index = i;
              break;
            }
          }
          if (index > -1)
            scope.currentFolder.Children.splice(index, 1);
        }
      }, function (error) {
        scope.isNavigating = false;
        alert(error);
      });
    };
    scope.saveFile = function (sourcePath, sourceData) {
      var modalInstance = modal.open({
          templateUrl: 'fileLoadedView.html',
          controller: 'fileLoadedController',
          resolve: {
            fileInfo: function () {
              var data = {
                  name: sourcePath,
                  size: sourceData.length
                };
              return data;
            }
          }
        });
      modalInstance.result.then(function () {
        var q = 0;
      }, function () {
        var w = 0;
      });
    };
    function compareChildren(a, b) {
      if (a.IsContainer != b.IsContainer) {
        return a.IsContainer === true ? -1 : 1;
      }
      if (a.Name < b.Name)
        return -1;
      if (a.Name > b.Name)
        return 1;
      return 0;
    }
    scope.onNewFolder = function () {
      var modalInstance = modal.open({
          templateUrl: 'modules/explorer/views/new-folder-view.client.view.html',
          controller: 'NewFolderController',
          resolve: {
            children: function () {
              return scope.currentFolder.Children;
            }
          }
        });
      modalInstance.result.then(function (newFolderName) {
        dataService.newFolder(scope.currentFolder.Id, newFolderName).then(function (newFolder) {
          scope.currentFolder.Children.push(newFolder);
          scope.currentFolder.Children.sort(compareChildren);
        }, function (error) {
          alert(error);
        });
      }, function () {
        var w = 0;
      });
    };
    scope.newTask = function (totalSize) {
      var taskInfo = {
          step: 20480,
          start: 0,
          end: 0,
          total: 0,
          left: 0,
          index: 0,
          percent: -1,
          refreshState: function () {
            if (this.left > this.step)
              this.end = this.start + this.step;
            else
              this.end = this.start + this.left;
            if (this.total > 0)
              this.percent = (this.total - this.left) / this.total;
            else
              this.percent = 1;
          },
          init: function (theTotalSize) {
            this.total = theTotalSize;
            this.start = 0;
            this.left = this.total;
            this.index = 0;
            this.refreshState();
          },
          applyNewData: function (size) {
            this.left = this.left - size;
            this.start = this.start + size;
            this.index = this.index + 1;
            this.refreshState();
          }
        };
      taskInfo.init(totalSize);
      return taskInfo;
    };
    scope.onStopUploading = function () {
      if (scope.currentBlob !== null) {
        dataService.releaseBlob(scope.currentBlob);
        scope.currentBlob = null;
        scope.$digest();
      }
    };
    scope.onUploadFile = function () {
      var modalInstance = modal.open({
          templateUrl: 'modules/explorer/views/upload-file-view.client.view.html',
          controller: 'UploadFileController',
          resolve: {
            children: function () {
              return scope.currentFolder.Children;
            }
          }
        });
      modalInstance.result.then(function (fileInfo) {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
          alert('File API \u043d\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u043c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043e\u043c');
          return;
        }
        //alert('Source: ' + fileInfo.source + '  Name: ' + fileInfo.name);
        var taskInfo = scope.newTask(fileInfo.source.size);
        dataService.initBlob(scope.currentFolder.Id, fileInfo.name, fileInfo.source.size, taskInfo.step).then(function (blobIdObject) {
          var d = new Date();
          var lastTime = d.getTime();
          var lastLeft = taskInfo.left;
          scope.currentBlob = blobIdObject.id;
          var blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
          var reader = new FileReader();
          reader.onloadend = function (evt) {
            if (scope.currentBlob !== null) {
              if (evt.target.readyState === FileReader.DONE) {
                // DONE == 2
                var data = evt.target.result;
                data = data.substr(data.lastIndexOf(',') + 1);
                dataService.addBlobChunk(scope.currentBlob, taskInfo.index, data).then(function (result) {
                  scope.currentBlob = result.id;
                  var prcent = result.percent;
                  var isComplete = result.isComplete;
                  if (isComplete) {
                    scope.currentFolder.Children.push(result.file);
                  }
                  taskInfo.applyNewData(evt.loaded);
                  var dd = new Date();
                  var currentTime = dd.getTime();
                  var interval = currentTime - lastTime;
                  if (interval >= 1000) {
                    lastTime = currentTime;
                    var currentLeft = taskInfo.left;
                    var transferredBytes = lastLeft - currentLeft;
                    lastLeft = currentLeft;
                    scope.transferRate = transferredBytes;
                  }
                  if (taskInfo.left > 0) {
                    blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
                    reader.readAsDataURL(blob);
                  } else {
                    scope.currentBlob = null;
                  }
                  scope.percent = prcent;
                  scope.$digest();
                }, function (result) {
                  dataService.releaseBlob(scope.currentBlob);
                  scope.currentBlob = null;
                  alert(result);
                  scope.$digest();
                });
              } else {
                var q = 99;
              }
            } else {
              var qq = 99;
            }
          };
          reader.readAsDataURL(blob);
        });
      }, function (exc) {
        var w = 0;
      });
    };
    scope.onUploadFolder = function () {
      alert('onUploadFolder');
    };
    scope.getData();
  }
]);'use strict';
angular.module('explorer').controller('FileInstanceController', [
  '$scope',
  '$modalInstance',
  function (scope, modalInstance, items) {
    scope.items = items;
    scope.selected = { item: scope.items[0] };
    scope.ok = function () {
      modalInstance.close(scope.selected.item);
    };
    scope.cancel = function () {
      modalInstance.dismiss('cancel');
    };
  }
]);'use strict';
angular.module('explorer').controller('FileLoadedController', [
  '$scope',
  '$modalInstance',
  'fileInfo',
  function (scope, modalInstance, fileInfo) {
    scope.name = fileInfo.name;
    scope.size = fileInfo.size;
    scope.ok = function () {
      modalInstance.close('Cheers');
    };
    scope.cancel = function () {
      modalInstance.dismiss('cancel');
    };
  }
]);'use strict';
angular.module('explorer').controller('ItemOptionsController', [
  '$scope',
  '$timeout',
  function (scope, timeout) {
    scope.folderItems = [{
        Title: 'Delete',
        Action: '2'
      }];
    scope.fileItems = [{
        Title: 'Delete',
        Action: '2'
      }];
    scope.getItems = function () {
      if (scope.itemData.IsContainer) {
        return scope.folderItems;
      } else
        return scope.fileItems;
    };
    scope.onAction = function (argument) {
      if ('1' === argument) {
        scope.download(scope.path);
      }
      if ('2' === argument) {
        scope.delete(scope.itemData);
      }
    };
  }
]);'use strict';
angular.module('explorer').controller('NewFolderController', [
  '$scope',
  '$modalInstance',
  'children',
  function (scope, modalInstance, children) {
    scope.current = { name: 'Not Defined' };
    scope.getProposedName = function () {
      var result = false;
      var index = -1;
      var template = 'New Folder';
      var candidate = '';
      while (!result) {
        index = index + 1;
        candidate = template;
        if (0 < index)
          candidate = candidate + ' ' + index;
        result = scope.checkName(candidate);
      }
      scope.current.name = candidate;
    };
    scope.checkName = function (candidate) {
      var result = true;
      var length = children.length;
      for (var i = 0; i < length; i++) {
        var child = children[i];
        if (child.Name === candidate) {
          result = false;
          break;
        }
      }
      return result;
    };
    scope.ok = function () {
      if (!scope.checkName(scope.current.name))
        alert('The name ' + scope.current.name + ' already exists');
      else
        modalInstance.close(scope.current.name);
    };
    scope.cancel = function () {
      modalInstance.dismiss('cancel');
    };
    scope.getProposedName();
  }
]);'use strict';
angular.module('explorer').controller('TestController', [
  '$scope',
  'dataService',
  '$modal',
  function (scope, dataService, modal) {
    scope.currentFolder = null;
    scope.canBack = false;
    scope.path = [];
    scope.isNavigating = false;
    scope.percent = 0;
    scope.currentBlob = null;
    scope.upload = function () {
      alert('cheers');
    };
    scope.getCurrentFolderId = function () {
      if (scope.currentFolder === null)
        return null;
      return scope.currentFolder.Id;
    };
    scope.getParentFolderId = function () {
      if (scope.currentFolder === null)
        return null;
      return scope.currentFolder.Parent;
    };
    scope.init = function () {
      scope.getData();
    };
    scope.getData = function () {
      alert('cheers');  /*
			dataService.getData()
				.then(function (data) {
					scope.applyScopeFolder(data);
				},
				function (error) {
					alert(error);
				}
			);
            */
    };
    scope.getFolder = function (id) {
      scope.isNavigating = true;
      dataService.getFolder(id).then(function (data) {
        scope.isNavigating = false;
        scope.applyScopeFolder(data);
      }, function (error) {
        scope.isNavigating = false;
        alert(error);
      });
    };
    scope.applyScopeFolder = function (newFolder) {
      scope.currentFolder = newFolder;
      scope.path.push(newFolder);
      scope.canBack = scope.path.length > 1;
    };
    scope.moveBack = function () {
      if (scope.path.length < 2)
        return;
      var prevoiusItem = scope.path[scope.path.length - 2];
      if (prevoiusItem !== undefined && prevoiusItem !== null) {
        scope.navigate(prevoiusItem.Id);
      }
    };
    scope.navigate = function (id) {
      var length = scope.path.length;
      var target = null;
      for (var i = 0; i < length; i++) {
        var candidate = scope.path[i];
        if (candidate.Id === id) {
          target = candidate;
          scope.path.splice(i, length - i);
          scope.applyScopeFolder(target);
          return;
        }
      }
      scope.getFolder(id);
    };
    scope.download = function (item) {
      scope.isDownloading = true;
      dataService.download(item.Id).then(function (data) {
        scope.isDownloading = false;
        scope.saveFile(item.Name, data);
      }, function (error) {
        scope.isDownloading = false;
        alert(error);
      });
    };
    scope.getDownloadUrl = function (treeItemData) {
      return dataService.getDownloadUrl(treeItemData.Id);
    };
    scope.onDelete = function (node) {
      scope.isNavigating = true;
      dataService.delete(node.Id).then(function (data) {
        scope.isNavigating = false;
        if (data) {
          var index = -1;
          var length = scope.currentFolder.Children.length;
          for (var i = 0; i < length; i++) {
            var candidate = scope.currentFolder.Children[i];
            if (node.Id === candidate.Id) {
              index = i;
              break;
            }
          }
          if (index > -1)
            scope.currentFolder.Children.splice(index, 1);
        }
      }, function (error) {
        scope.isNavigating = false;
        alert(error);
      });
    };
    scope.saveFile = function (sourcePath, sourceData) {
      var modalInstance = modal.open({
          templateUrl: 'fileLoadedView.html',
          controller: 'fileLoadedController',
          resolve: {
            fileInfo: function () {
              var data = {
                  name: sourcePath,
                  size: sourceData.length
                };
              return data;
            }
          }
        });
      modalInstance.result.then(function () {
        var q = 0;
      }, function () {
        var w = 0;
      });
    };
    scope.onNewFolder = function () {
      var modalInstance = modal.open({
          templateUrl: 'newFolderView.html',
          controller: 'newFolderController',
          resolve: {
            children: function () {
              return scope.currentFolder.Children;
            }
          }
        });
      modalInstance.result.then(function (newFolderName) {
        dataService.newFolder(scope.currentFolder.Id, newFolderName).then(function (newFolder) {
          scope.currentFolder.Children.push(newFolder);
        }, function (error) {
          alert(error);
        });
      }, function () {
        var w = 0;
      });
    };
    scope.newTask = function (totalSize) {
      var taskInfo = {
          step: 20480,
          start: 0,
          end: 0,
          total: 0,
          left: 0,
          index: 0,
          percent: -1,
          refreshState: function () {
            if (this.left > this.step)
              this.end = this.start + this.step;
            else
              this.end = this.start + this.left;
            if (this.total > 0)
              this.percent = (this.total - this.left) / this.total;
            else
              this.percent = 1;
          },
          init: function (theTotalSize) {
            this.total = theTotalSize;
            this.start = 0;
            this.left = this.total;
            this.index = 0;
            this.refreshState();
          },
          applyNewData: function (size) {
            this.left = this.left - size;
            this.start = this.start + size;
            this.index = this.index + 1;
            this.refreshState();
          }
        };
      taskInfo.init(totalSize);
      return taskInfo;
    };
    scope.onStopUploading = function () {
      if (scope.currentBlob !== null) {
        dataService.releaseBlob(scope.currentBlob);
        scope.currentBlob = null;
        scope.$digest();
      }
    };
    scope.onUploadFile = function () {
      var modalInstance = modal.open({
          templateUrl: 'uploadFileView.html',
          controller: 'uploadFileController',
          resolve: {
            children: function () {
              return scope.currentFolder.Children;
            }
          }
        });
      modalInstance.result.then(function (fileInfo) {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
          alert('File API \u043d\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u043c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043e\u043c');
          return;
        }
        //alert('Source: ' + fileInfo.source + '  Name: ' + fileInfo.name);
        var taskInfo = scope.newTask(fileInfo.source.size);
        dataService.initBlob(scope.currentFolder.Id, fileInfo.name, fileInfo.source.size, taskInfo.step).then(function (blobIdObject) {
          scope.currentBlob = blobIdObject.id;
          var blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
          var reader = new FileReader();
          reader.onloadend = function (evt) {
            if (scope.currentBlob !== null) {
              if (evt.target.readyState === FileReader.DONE) {
                // DONE == 2
                var data = evt.target.result;
                data = data.substr(data.lastIndexOf(',') + 1);
                dataService.addBlobChunk(scope.currentBlob, taskInfo.index, data).then(function (result) {
                  scope.currentBlob = result.id;
                  var prcent = result.percent;
                  var isComplete = result.isComplete;
                  if (isComplete) {
                    scope.currentFolder.Children.push(result.file);
                  }
                  taskInfo.applyNewData(evt.loaded);
                  if (taskInfo.left > 0) {
                    blob = fileInfo.source.slice(taskInfo.start, taskInfo.end);
                    reader.readAsDataURL(blob);
                  } else {
                    scope.currentBlob = null;
                  }
                  scope.percent = prcent;
                  scope.$digest();
                }, function (result) {
                  scope.currentBlob = null;
                  scope.$digest();
                });
              } else {
                var q = 99;
              }
            } else {
              var qq = 99;
            }
          };
          reader.readAsDataURL(blob);
        });
      }, function () {
        var w = 0;
      });
    };
    scope.onUploadFolder = function () {
      alert('onUploadFolder');
    };
    scope.getData();
  }
]);'use strict';
angular.module('explorer').controller('TreeFolderController', [
  '$scope',
  function (scope) {
    scope.name = 'No Name';
    scope.init = function () {
      var prefix = '';
      if (0 < scope.index)
        prefix = '/';
      scope.name = scope.itemData.Name;
    };
    scope.select = function () {
      scope.navigate(scope.itemData.Id);
    };
  }
]);'use strict';
angular.module('explorer').controller('TreeItemController', [
  '$scope',
  function (scope) {
    scope.name = 'No Name';
    scope.path = [];
    scope.id = null;
    scope.isFolder = null;
    scope.size = 0;
    var path = {};
    scope.init = function () {
      var node = scope.itemData;
      if (undefined !== node && null !== node) {
        scope.name = node.Name;
        scope.id = node.Id;
        var path = [];
        if (undefined !== node.ParentAbsolutePath && null !== node.ParentAbsolutePath)
          path = path.concat(node.ParentAbsolutePath);
        path.push(node.Name);
        scope.path = path;
        scope.isFolder = node.IsContainer;
        var iconName = 'modules/explorer/img/file.png';
        if (scope.isFolder) {
          iconName = 'modules/explorer/img/folder.png';
        } else {
          scope.href = scope.getDownloadUrl(scope.itemData);
          scope.size = node.Size;
        }
        scope.iconName = iconName;
      }
    };
    scope.select = function () {
      if (scope.isFolder)
        scope.navigate(scope.id);
    };
    scope.delete = function () {
      scope.onDelete(scope.itemData);
    };
  }
]);'use strict';
angular.module('explorer').controller('UploadFileController', [
  '$scope',
  '$modalInstance',
  'children',
  function (scope, modalInstance, children) {
    scope.current = {
      name: 'Not Defined',
      size: 0,
      path: {},
      file: undefined
    };
    scope.$watch('current.path', function () {
      if (scope.current.path === null || scope.current.path === undefined)
        scope.current.name = '';
      else {
        var fileInfo = document.getElementById('source').files[0];
        if (fileInfo !== undefined) {
          var r = new FileReader();
          scope.current.size = fileInfo.size;
          scope.current.name = fileInfo.name;
          scope.current.file = fileInfo;
        }
      }
      scope.$digest();
    });
    scope.check = function () {
      var fileInfo = document.getElementById('source').files[0];
      var q = 0;
    };
    scope.getProposedName = function () {
      var result = false;
      var index = -1;
      var template = 'New Folder';
      var candidate = '';
      while (!result) {
        index = index + 1;
        candidate = template;
        if (0 < index)
          candidate = candidate + ' ' + index;
        result = scope.checkName(candidate);
      }
      scope.current.name = candidate;
    };
    scope.checkName = function (candidate) {
      var result = true;
      if (children !== null) {
        var length = children.length;
        for (var i = 0; i < length; i++) {
          var child = children[i];
          if (child.Name === candidate) {
            result = false;
            break;
          }
        }
      }
      return result;
    };
    scope.ok = function () {
      if (!scope.checkName(scope.current.name))
        alert('The name ' + scope.current.name + ' already exists');
      else {
        var fileInfo = {
            source: scope.current.file,
            name: scope.current.name
          };
        modalInstance.close(fileInfo);
      }
    };
    scope.cancel = function () {
      modalInstance.dismiss('cancel');
    };
  }
]);'use strict';
angular.module('explorer').directive('inputFileFix', function () {
  return {
    require: 'ngModel',
    link: function (scope, el, attrs, ngModel) {
      //change event is fired when file is selected
      el.bind('change', function () {
        scope.$apply(function () {
          ngModel.$setViewValue(el.val());
          ngModel.$render();
        });
      });
    }
  };
});'use strict';
angular.module('explorer').directive('showOnRowHover', [function () {
    return {
      link: function (scope, element, attrs) {
        element.closest('tr').bind('mouseenter', function () {
          element.show();
        });
        element.closest('tr').bind('mouseleave', function () {
          element.hide();
          var contextmenu = element.find('#contextmenu');
          contextmenu.click();
          element.parent().removeClass('open');
        });
      }
    };
  }]);'use strict';
angular.module('explorer').directive('treeFolderData', [function () {
    return {
      restrict: 'EA',
      templateUrl: 'modules/explorer/views/tree-folder-view.client.view.html',
      replace: false,
      controller: 'TreeFolderController',
      link: function (scope, elem, attr, ctrl) {
        scope.init();
      }
    };
  }]);'use strict';
angular.module('explorer').directive('treeItemData', [
  '$compile',
  function (compile) {
    return {
      restrict: 'EA',
      templateUrl: 'modules/explorer/views/tree-item-view.client.view.html',
      replace: true,
      controller: 'TreeItemController',
      link: function (scope, elem, attr, ctrl) {
        scope.init();
      }
    };
  }
]);'use strict';
angular.module('explorer').directive('uploaderButton', [function () {
    return {
      link: function (scope, elem, attrs, ngModel) {
        //change event is fired when file is selected
        elem.bind('click', function () {
          $('#source').click();
        });
      }
    };
  }]);  /*
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
*/'use strict';
angular.module('explorer').filter('bytes', [function () {
    return function (bytes, precision) {
      if (0 === bytes || isNaN(parseFloat(bytes)) || !isFinite(bytes))
        return '-';
      if (typeof precision === 'undefined')
        precision = 1;
      var units = [
          'bytes',
          'KB',
          'MB',
          'GB',
          'TB',
          'PB'
        ], number = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    };
  }]);'use strict';
angular.module('explorer').filter('percentage', [
  '$filter',
  function ($filter) {
    return function (input, decimals) {
      return $filter('number')(input * 100, decimals) + '%';
    };
  }
]);'use strict';
angular.module('explorer').service('DataService', [
  '$http',
  '$q',
  '$location',
  function (http, q, location) {
    // Dataservice service logic
    // ...
    var serverController = '/explorer';
    this.httpRequest = function (method, url, data) {
      var defer = q.defer();
      var promise = defer.promise;
      var header = {
          method: method,
          url: serverController + url,
          contentType: 'application/json'
        };
      if (data !== null && data !== undefined) {
        var dataObject = {};
        for (var key in data) {
          dataObject[key] = data[key];
        }
        header.data = dataObject;
      }
      http(header).then(function (response) {
        defer.resolve(response.data);
      }, function (response) {
        defer.reject('Exception occured: ' + response.status);
      });
      return promise;
    };
    this.getData = function () {
      return this.httpRequest('GET', '/Root', null);
    };
    this.getFolder = function (id) {
      return this.httpRequest('POST', '/Folder', { 'id': id });
    };
    this.download = function (id) {
      return this.httpRequest('POST', '/Download', { 'id': id });
    };
    this.delete = function (id) {
      return this.httpRequest('POST', '/Delete', { 'id': id });
    };
    this.newFolder = function (id, name) {
      return this.httpRequest('POST', '/NewFolder', {
        'id': id,
        name: name
      });
    };
    this.getDownloadUrl = function (id) {
      var url = serverController + '/Download' + '?' + 'id=' + id;
      return url;
    };
    this.initBlob = function (parentId, name, totalSize, chunkSize) {
      return this.httpRequest('POST', '/InitBlob', {
        'folderId': parentId,
        'fileName': name,
        'totalSize': totalSize,
        'chunkSize': chunkSize
      });
    };
    this.addBlobChunk = function (blobId, chunkIndex, data) {
      return this.httpRequest('POST', '/AddBlobChunk', {
        'blobId': blobId,
        'chunkIndex': chunkIndex,
        'data': data
      });
    };
    this.releaseBlob = function (blobId, chunkIndex, data) {
      return this.httpRequest('POST', '/ReleaseBlob', { 'blobId': blobId });
    };
  }
]);'use strict';
// Config HTTP Error Handling
angular.module('users').config([
  '$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push([
      '$q',
      '$location',
      'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
            case 401:
              // Deauthenticate the global user
              Authentication.user = null;
              // Redirect to signin page
              $location.path('signin');
              break;
            case 403:
              // Add unauthorized behaviour 
              break;
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);'use strict';
// Setting up route
angular.module('users').config([
  '$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider.state('profile', {
      url: '/settings/profile',
      templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
    }).state('password', {
      url: '/settings/password',
      templateUrl: 'modules/users/views/settings/change-password.client.view.html'
    }).state('accounts', {
      url: '/settings/accounts',
      templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
    }).state('signup', {
      url: '/signup',
      templateUrl: 'modules/users/views/signup.client.view.html'
    }).state('signin', {
      url: '/signin',
      templateUrl: 'modules/users/views/signin.client.view.html'
    });
  }
]);'use strict';
angular.module('users').controller('AuthenticationController', [
  '$scope',
  '$http',
  '$location',
  'Authentication',
  function ($scope, $http, $location, Authentication) {
    $scope.authentication = Authentication;
    //If user is signed in then redirect back home
    if ($scope.authentication.user)
      $location.path('/');
    $scope.signup = function () {
      $http.post('/auth/signup', $scope.credentials).success(function (response) {
        //If successful we assign the response to the global user model
        $scope.authentication.user = response;
        //And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
    $scope.signin = function () {
      $http.post('/auth/signin', $scope.credentials).success(function (response) {
        //If successful we assign the response to the global user model
        $scope.authentication.user = response;
        //And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('SettingsController', [
  '$scope',
  '$http',
  '$location',
  'Users',
  'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;
    // If user is not signed in then redirect back home
    if (!$scope.user)
      $location.path('/');
    // Check if there are additional accounts 
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }
      return false;
    };
    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || $scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider];
    };
    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;
      $http.delete('/users/accounts', { params: { provider: provider } }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
    // Update a user profile
    $scope.updateUserProfile = function () {
      $scope.success = $scope.error = null;
      var user = new Users($scope.user);
      user.$update(function (response) {
        $scope.success = true;
        Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
    };
    // Change user password
    $scope.changeUserPassword = function () {
      $scope.success = $scope.error = null;
      $http.post('/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
// Authentication service for user variables
angular.module('users').factory('Authentication', [function () {
    var _this = this;
    _this._data = { user: window.user };
    return _this._data;
  }]);'use strict';
// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', [
  '$resource',
  function ($resource) {
    return $resource('users', {}, { update: { method: 'PUT' } });
  }
]);'use strict';
(function () {
  // Authentication controller Spec
  describe('AuthenticationController', function () {
    // Initialize global variables
    var AuthenticationController, scope, $httpBackend, $stateParams, $location;
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return { pass: angular.equals(actual, expected) };
            }
          };
        }
      });
    });
    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));
    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
      // Set a new global scope
      scope = $rootScope.$new();
      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      // Initialize the Authentication controller
      AuthenticationController = $controller('AuthenticationController', { $scope: scope });
    }));
    it('$scope.signin() should login with a correct user and password', function () {
      // test expected GET request
      $httpBackend.when('POST', '/auth/signin').respond(200, 'Fred');
      scope.signin();
      $httpBackend.flush();
      // test scope value
      expect(scope.authentication.user).toEqual('Fred');
      expect($location.url()).toEqual('/');
    });
    it('$scope.signin() should fail to log in with nothing', function () {
      $httpBackend.expectPOST('/auth/signin').respond(400, { 'message': 'Missing credentials' });
      scope.signin();
      $httpBackend.flush();
      // test scope value
      expect(scope.error).toEqual('Missing credentials');
    });
    it('$scope.signin() should fail to log in with wrong credentials', function () {
      // Foo/Bar combo assumed to not exist
      scope.authentication.user = 'Foo';
      scope.credentials = 'Bar';
      $httpBackend.expectPOST('/auth/signin').respond(400, { 'message': 'Unknown user' });
      scope.signin();
      $httpBackend.flush();
      // test scope value
      expect(scope.error).toEqual('Unknown user');
    });
    it('$scope.signup() should register with correct data', function () {
      // test expected GET request
      scope.authentication.user = 'Fred';
      $httpBackend.when('POST', '/auth/signup').respond(200, 'Fred');
      scope.signup();
      $httpBackend.flush();
      // test scope value
      expect(scope.authentication.user).toBe('Fred');
      expect(scope.error).toEqual(undefined);
      expect($location.url()).toBe('/');
    });
    it('$scope.signup() should fail to register with duplicate Username', function () {
      $httpBackend.when('POST', '/auth/signup').respond(400, { 'message': 'Username already exists' });
      scope.signup();
      $httpBackend.flush();
      // test scope value
      expect(scope.error).toBe('Username already exists');
    });
  });
}());