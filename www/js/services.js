var starter = angular.module('starter.services',['ngCordova']);

starter.factory('Memory', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    get: function(key) {
      return JSON.parse($window.localStorage[key] || "0");
    }
  }
}]);
starter.factory('RAM', function(){
    var RAM = null;
    return{
        get: function(){
            return RAM;
        },
        set: function(data){ 
            RAM  = data;
        }
    };
});

starter.factory('JustDo', function($http){
    //var collections = [];
    return{
         url: function(url){
            $http.get(url)
                .then(function(resp){
                    return resp.data;
                });
            },
        ItIf: function(url,success,fail){
            $http.get(url)
                .then(function(resp){
                    if(resp.data)
                        success(resp.data);
                    else
                        fail(resp);
                }, function(err) {
                    fail(err);
                });
            },
        aPost: function(url,data,success,fail){
            $http.post(url,data)
                .then(function(resp){

                        success(resp.data);
                    
                }, function(err) {
                    fail(err);
                });
            }

      };
});

starter.factory('file', function($cordovaFileTransfer){
    //var collections = [];
    return{
        upload: function(filePath,options,success,fail,progress){
          $cordovaFileTransfer.upload('http://bastidor.com.br/vibesetal/json/upload/post', filePath, options)
            .then(function(result) {
                success(result);
            }, function(err) {
                fail(err);
            }, function (data) {
              progress(data);
            });
        }
      };
});


