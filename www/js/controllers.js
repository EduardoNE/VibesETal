angular.module('starter.controllers', ['ngCordova', 'ionic.service.core', 'ionic.service.push', 'starter.services'])
	.controller('AppCtrl', function($scope, $ionicModal, $timeout,
		$rootScope, $ionicUser, $ionicPush, $ionicPlatform,
		$cordovaFacebook, Memory) {
		$ionicPlatform.ready(function() {
			$scope.voltar = false;
			// Form data for the login modal
			$scope.loginData = {};
			// Create the login modal that we will use later
			$ionicModal.fromTemplateUrl('templates/login.html', {
				scope: $scope
			}).then(function(modal) {
				$scope.modal = modal;
				console.log(Memory.get('login'));
				if (Memory.get('login') == "0")
					modal.show();
				else {
					$scope.User = Memory.get('login');
					$scope.voltar = true;
				}
			});
			var identifyUser = function(callback, TheName) {
				console.log('Ionic User: Identifying with Ionic User service');
				var user = $ionicUser.get();
				if (!user.user_id) {
					// Set your user_id here, or generate a random one.
					user.user_id = $ionicUser.generateGUID();
				};

				// Add some metadata to your user object.
				angular.extend(user, {
					name: TheName,
					bio: '*'
				});
				// Identify your user with the Ionic User Service
				$ionicUser.identify(user).then(function() {
					$scope.identified = true;
					console.log('Identified user ' + user.name, ' ID ' + user.user_id);
				});
				callback();
			};
			var pushRegister = function() {
				console.log('Ionic Push: Registering user');
				// Register with the Ionic Push service.  All parameters are optional.
				$ionicPush.register({
					canShowAlert: true, //Can pushes show an alert on your screen?
					canSetBadge: true, //Can pushes update app icon badges?
					canPlaySound: true, //Can notifications play a sound?
					canRunActionsOnWake: true, //Can run actions outside the app,
					onNotification: function(notification) {
						// Handle new push notifications here
						return true;
					}
				});
			};
			$rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
				//alert("Successfully registered token " + data.token);
				console.log('Ionic Push: Got token ', data.token, data);
				$scope.token = data.token;
			});
			// Triggered in the login modal to close it
			var closeLogin = function() {
				$scope.modal.hide();
			};
			var change = function(data) {
				$scope.user = data;
				Memory.set('login', data);
				identifyUser(pushRegister, data.name);
				closeLogin();
			}
			$scope.closeLogin = closeLogin;
			// Open the login modal
			$scope.login = function() {
				$scope.modal.show();
			};
			$scope.logout = function() {
				Memory.set('login', "0");
				$scope.voltar = false;
			};

			// Perform the login action when the user submits the login form
			$scope.doLogin = function() {
				$cordovaFacebook.login(["public_profile", "email", "user_friends"])
					.then(function(success) {
						console.log(success.authResponse.userID);
						$cordovaFacebook.api(success.authResponse.userID + "/?fields=id,email,name,picture", ["public_profile"])
							.then(function(userdata) {
								console.log(userdata);
								change(userdata);
							}, function(error) {
								console.error(error);
							});
					}, function(error) {
						console.error(error);
					});
			};
		})
	})
	.controller('HomeCtrl', function($scope, $ionicPlatform, $cordovaCapture, $cordovaCamera, $cordovaSocialSharing, $cordovaToast, JustDo, file) {
		$scope.list = [];
		$ionicPlatform.ready(function() {
			var carregar = function() {
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/posts",
					function(data) {
						$scope.list = data.records;
						console.log(data.records);
						$scope.$broadcast('scroll.refreshComplete');
						$scope.$apply()
					},
					function(err) {

					})
			}
			$scope.share = function(msg, file) {
				$cordovaSocialSharing
					.share(msg, msg, file, "http://linkdoprojeto.com.br") // Share via native share sheet
					.then(function(result) {
						console.log(result);
						$cordovaToast.show('Feito!', 'short', 'center');
					}, function(err) {
						$cordovaToast.show('Erro ao compartilhar...', 'short',
							'center');
					});
			};
			$scope.getFormattedDate = function(timestamp) {
				var date = new Date(timestamp);
				var months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL',
					'AGO', 'SET', 'OUT', 'NOV', 'DEC'
				];
				var result = "";
				if (date.getDay() < 10)
					result += "0";
				result += date.getDay() + " ";
				result += months[date.getMonth()] + " ";
				if (date.getHours() < 10)
					result += "0";
				result += date.getHours() + ":";
				if (date.getMinutes() < 10)
					result += "0";
				result += date.getMinutes();
				return result;
			}
			var upload = function(address, name, type) {
				var options = {
					fileKey: "post",
					fileName: name,
					chunkedMode: false,
					mimeType: type
				};
				file.upload(address, options, function(sucesso) {
					console.log('s', sucesso)
					var infos = {
						post: {
							post_description: "haushuasu uash uashuhaush",
							post_deleted: 0
						},
						where: {
							post_id: sucesso.response
						}
					};
					JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
						function(data) {
							console.log(data);
							carregar();
						},
						function(err) {

						});
				}, function(err) {
					console.log('e', err)
				});
			}
			var addToList = function(address, name, template, time, type) {
				var options = {
					fileKey: "post",
					fileName: name,
					chunkedMode: false,
					mimeType: type
				};
				file.upload(address, options, function(sucesso) {
					console.log('s', sucesso)
					var infos = {
						post: {
							post_description: "haushuasu uash uashuhaush",
							post_deleted: 0
						},
						where: {
							post_id: sucesso.response
						}
					};
					JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
						function(data) {
							console.log(data);
							carregar();
						},
						function(err) {

						});
				}, function(err) {
					console.log('e', err)
				});
			}
			$scope.getRoll = function() {
				var options = {
					sourceType: 0,
					quality: 20,
					destinationType: Camera.DestinationType.FILE_URI,
					allowEdit: true,
					mediaType: 0
				};
				$cordovaCamera.getPicture(options).then(function(data) {
					console.log("getRoll", data);
					addToList(data, data, "image", new Date().getTime(), '');
				}, function(err) {
					// error
				});
			}
			$scope.getVidRoll = function() {
				var options = {
					sourceType: 0,
					quality: 20,
					destinationType: Camera.DestinationType.FILE_URI,
					allowEdit: true,
					mediaType: 1
				};

				$cordovaCamera.getPicture(options).then(function(data) {
					console.log("getRoll", data);
					addToList(data, data, "video", new Date().getTime(), '');
				}, function(err) {
					// error
				});
			}
			$scope.captureImage = function() {
				var options = {
					quality: 0,
					limit: 3
				};

				$cordovaCapture.captureImage(options).then(function(data) {
					console.log("getRoll", data);
					addToList(data[0].fullPath, data[0].name, "image", new Date().getTime(), data[0].type);
				}, function(err) {
					// error
				});
			}
			$scope.captureVideo = function() {
				var options = { limit: 3, duration: 15 };

				$cordovaCapture.captureVideo(options).then(function(data) {
					console.log("Video", data);
					addToList(data[0].fullPath, data[0].name, "video", new Date().getTime(), data[0].type);
				}, function(err) {
					// error
				});
			}
			$scope.refresh = carregar;
			carregar();
		});
	})

	.controller('FotoCtrl', function($scope, $stateParams) {})

	.controller('VideoCtrl', function($scope, $stateParams) {})

	.controller('PostarCtrl', function($scope, $stateParams) {})





	