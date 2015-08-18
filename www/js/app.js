// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('starter', ['ionic','ionic.service.core','ngCordova','ionic.service.push', 'starter.controllers'])

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
.config(['$ionicAppProvider', function($ionicAppProvider) {
  // Identify app
  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: '37e4e273',
    // The public API key all services will use for this app
    api_key: 'a0bdfb1719cdee83ec835e0549d3f8d03f3fdf6bd9a37bb8',
    // If true, will attempt to send development pushes
    dev_push: true
  });
}])
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.foto', {
    url: '/foto',
    views: {
      'menuContent': {
        templateUrl: 'templates/foto.html',
          controller: 'FotoCtrl'
      }
    }
  })

  .state('app.video', {
    url: '/video',
    views: {
      'menuContent': {
        templateUrl: 'templates/video.html',
          controller: 'VideoCtrl'
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
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl'
        }
      }
    })

  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
