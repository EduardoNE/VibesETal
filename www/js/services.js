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

starter.factory('Calc', function($window) {
    return {
        proportional: {
            width: function(width,remove) {
                return ($window.innerWidth - remove)/width;
            },
            height: function(height,remove) {
                return ($window.innerHeight - remove)/height;
            }
        }
    }
});

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
    //http://bastidor.com.br/vibesetal/json/upload/post

    return {
        upload: function(filePath,options,success,fail,progress){
          $cordovaFileTransfer.upload('http://bastidor.com.br/vibesetal/json/upload/post', filePath, options)
            .then(function(result) {
                success(JSON.parse(result.response));
            }, function(err) {
                fail(err);
            }, function (data) {
              progress(data);
            });
        }
    };
});

starter.factory('Vimeo', function($http,$cordovaFileTransfer){
    /*** Change ***/
    var _AccessToken      = 'f61ab97596447fa339ec2366b7cfc6ea';
    var _ClientIdentifier = '09b8566319a71227e1ef51de2656122867b795bb';
    var _ClientSecrets    = 'f61ab97596447fa339ec2366b7cfc6ea';

    /*** Do Not Change ***/
    var _Headers          = { 'Authorization': 'bearer '+_AccessToken} ;
    var _GotToken         = null;
    var _GotUser          = null;


    return{
        GetToken: function(){
            var requestData = {};
            $http.post("https://api.vimeo.com", requestData, { headers: _Headers })
            .success(function(responseData) {
                _GotToken = responseData;
                console.log('GetToken.ResponseData',responseData)
            })
            .error(function(err) {
                console.error(err)
            })
        },
        GetUser: function(){
            var requestData = {};
            $http.post("https://api.vimeo.com/me", requestData, { headers: _Headers })
            .success(function(responseData) {
                _GotUser = responseData;
                console.log('GetUser.ResponseData',responseData)
            })
            .error(function(err) {
                console.error(err)
            })
        },
        GetUploadTicket: function(success,error){
            var requestData = {};
            $http.post("https://api.vimeo.com/me/videos", requestData, { headers: _Headers })
            .success(function(responseData) {
                return success(responseData);
            })
            .error(function(err) {
                return error(err)
            })
        },
        upload: function(video, success, error){
            video = 'http://bastidor.com.br/vibesetal/content/' + video;
            console.log('videoUrl',video);
            var requestData = {
                'type': 'pull',
                'link': video
            };

            $http.post("https://api.vimeo.com/me/videos", requestData, { headers: _Headers })
            .success(function(responseData) {
                return success(responseData);
            })
            .error(function(err) {
                return error(err)
            })
        },
        Data: function(){
            return {
                'AccessToken'      : _AccessToken,
                'ClientIdentifier' : _ClientIdentifier,
                'ClientSecrets'    : _ClientSecrets,
                'Headers'          : _Headers,
                'GotToken'         : _GotToken,
                'GotUser'          : _GotUser
            }
        }
    };
});


