// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('starter', ['ionic','ionic.service.core','ngCordova','ionic.service.push', 'starter.controllers', 'ionic.contrib.ui.cards'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
.config(function($ionicAppProvider,$sceProvider,$ionicConfigProvider) {
  $sceProvider.enabled(false);

  $ionicConfigProvider.backButton.text('');
  // Identify app
  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: '37e4e273',
    // The public API key all services will use for this app
    api_key: 'a0bdfb1719cdee83ec835e0549d3f8d03f3fdf6bd9a37bb8',
    // If true, will attempt to send development pushes
    dev_push: true
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.upload', {
    url: '/upload',
    views: {
      'menuContent': {
        cache: false,
        templateUrl: 'templates/photo.html',
        controller: 'UploadCtrl'
      }
    }
  })

  .state('app.postar', {
    url: '/postar',
    views: {
      'menuContent': {
        templateUrl: 'templates/postar.html',
          controller: 'PostarCtrl'
      }
    }
  })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        cache: false,
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl'
      }
    }
  })

    .state('app.UserPosts', {
      url: '/UserPosts/:id',
      views: {
        'menuContent': {
          cache: false,
          templateUrl: 'templates/UserPosts.html',
          controller: 'UserPostsCtrl'
        }
      }
    })


    .state('app.TopPost', {
      url: '/TopPost',
      views: {
        'menuContent': {
          templateUrl: 'templates/TopPost.html',
          controller: 'TopPostCtrl'
        }
      }
    })

    .state('app.TopUsers', {
      url: '/TopUsers',
      views: {
        'menuContent': {
          templateUrl: 'templates/TopUsers.html',
          controller: 'TopUsersCtrl'
        }
      }
    })
    .state('app.code', {
      url: '/code',
      views: {
        'menuContent': {
          templateUrl: 'templates/code.html',
          controller: 'CodeCtrl'
        }
      }
    })
    .state('app.sobre', {
      url: '/sobre',
      views: {
        'menuContent': {
          templateUrl: 'templates/sobre.html',
          controller: 'SobreCtrl'
        }
      }
    })
    .state('app.brothers', {
      url: '/brothers',
      views: {
        'menuContent': {
          templateUrl: 'templates/brothers.html',
          controller: 'BrothersCtrl'
        }
      }
    })
    .state('app.brotherPage', {
      url: '/brotherPage/:id',
      views: {
        'menuContent': {
          templateUrl: 'templates/brotherPage.html',
          controller: 'BrotherPageCtrl'
        }
      }
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
