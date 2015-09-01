angular.module('starter.controllers', ['ngCordova', 'ngSanitize', 'ionic.service.core', 'ionic.service.push', 'starter.services'])
	.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicUser, $ionicPush, $ionicPlatform, $cordovaFacebook, Memory, JustDo) {
		$ionicPlatform.ready(function() {
			$scope.voltar = false;
			// Form data for the login modal
			$scope.loginData = {};
			$scope.subheader = "";
			$scope.uploadProgress = 0;
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
				console.log("data", data);
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/user/login", data,
					function(user) {
						console.log(user[0]);
						Memory.set('login', user[0]);
						identifyUser(pushRegister, data.name);
						closeLogin();
						$scope.User = Memory.get('login');
						$scope.voltar = true;
					},
					function(err) {

					});
			}
			$scope.closeLogin = closeLogin;
			// Open the login modal
			$scope.login = function() {
				$scope.modal.show();
			};
			$scope.logout = function() {
				$scope.User = {};
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
	.controller('HomeCtrl', function($scope, $state, $ionicPlatform, $cordovaCapture, $cordovaCamera, $cordovaSocialSharing, $cordovaToast, $cordovaFileTransfer, $cordovaFile, $sce, JustDo, file, Memory, RAM, $ionicActionSheet, $timeout, $ionicModal, $ionicScrollDelegate, $ionicLoading) {

		$scope.list = [];
		var pageforscroll = 1;
		var hasscroll = true;
		$scope.fields = [];
		$scope.noMoreItemsAvailable = false;
		$scope.noMoreCommentsAvailable = true;
		$scope.commentforscroll = 1;
		$ionicModal.fromTemplateUrl('templates/comment-m.html', {
		    scope: $scope,
		    animation: 'slide-in-up'
		  }).then(function(modal) {
		    $scope.comment = modal;
		  });
		$ionicPlatform.ready(function() {

			var carregar = function() {
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/posts",
					function(data) {
						$timeout(function() {
							pageforscroll = 1;
							var hasscroll = true;
							$scope.list = checkVideo(data.records);
							console.log(data.records);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.noMoreItemsAvailable = true;
							//$scope.$apply()
						})
					},
					function(err) {

					})
			}

			$scope.likePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};

				for (var i = 0; i < $scope.list.length; i++) {
					if ($scope.list[i].post_id == post_id) {
						$scope.list[i].likes = $scope.list[i].likes +1;
						$scope.list[i].liked = true;
						break;
					}
				}
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/like", data,
					function(records) {
						var user = Memory.get('login');
						user.user_diamonds = records.diamonds;
						Memory.set('login', user);

						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].likes = records.like;
								$scope.list[i].liked = true;
								break;
							}
						}

						var likes = Memory.get('likes');
						likes.push(post_id);
						Memory.set('likes', likes);

					},
					function(err) {

						$cordovaToast.show('Erro ao curtir...', 'short', 'center');
						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].likes = $scope.list[i].likes - 1;
								$scope.list[i].liked = false;
								break;
							}
						}

					});
			}

			$scope.caninfinitescroll = function() {
				return true
			}

			var checkVideo = function(data) {
				var likes = Memory.get('likes');
				if (likes == 0) {
					likes = [];
					Memory.set('likes', likes);
				}

				for (var i = 0; i < data.length; i++) {

					if (likes.indexOf(data[i].post_id) > -1)
						data[i].liked = true;
					else
						data[i].liked = false;

					if (data[i].post_type == "video") {
						if (data[i].post_file.indexOf("https://") == -1 && data[i].post_file.indexOf("http://") == -1)
							var url = "http://bastidor.com.br/vibesetal/content/" + data[i].post_file;
						else
							var url = data[i].post_file;
						$sce.trustAsResourceUrl(url);
						data[i].post_file = url;
						console.log("video found", data[i].post_file);
					}
				}
				console.log("tudo", data);
				return data;
			}

			$scope.sharePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/share", data,
					function(likes) {
						likes = JSON.parse(likes);
						console.log(likes);
						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].likes = likes;
								break;
							}
						}
					},
					function(err) {

					});
			}

			$scope.share = function(msg, file) {
				$cordovaSocialSharing
					.share(msg, msg, file, "http://linkdoprojeto.com.br") // Share via native share sheet
					.then(function(result) {
						console.log(result);
						$cordovaToast.show('Feito!', 'short', 'center');
					}, function(err) {
						$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
					});
			};

			$scope.getFormattedDate = function(timestamp) {
				var date = new Date(timestamp);
				var months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEC'];
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

			var addToList = function(address, name, template, time, type) {
				var options = {
					fileKey: "post",
					fileName: name,
					chunkedMode: false,
					mimeType: type
				};
				$scope.subheader = "has-subheader";
				file.upload(address, options, function(sucesso) {

					console.log('s', sucesso);
					$scope.subheader = "";
					$scope.uploadProgress = 0;
					var infos = {
						post: {
							post_user_id: $scope.User.user_id,
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
				}, function(prog) {
					$scope.uploadProgress = ((prog.loaded / prog.total * 100));
					//$scope.uploadProgress = 0;
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
					RAM.set({
						'data': data,
						'type': 'image'
					});
					$state.go("app.upload");
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
					RAM.set({
						'data': data,
						'type': 'video'
					});
					$state.go("app.upload");
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
					RAM.set({
						'data': data[0].fullPath,
						'type': 'image'
					});
					$state.go("app.upload");
					//addToList(data[0].fullPath, data[0].name, "image", new Date().getTime(), data[0].type);
				}, function(err) {
					// error
				});
			}

			$scope.captureVideo = function() {
				var options = {
					limit: 3,
					duration: 15
				};

				$cordovaCapture.captureVideo(options).then(function(data) {
					console.log("Video", data);
					RAM.set({
						'data': data[0].fullPath,
						'type': 'video'
					});
					$state.go("app.upload");
					//addToList(data[0].fullPath, data[0].name, "video", new Date().getTime(), data[0].type);
				}, function(err) {
					// error
				});
			}

			$scope.options = function(item) {
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						console.log("cancel", item);
						return true;
					},
					destructiveButtonClicked: function() {

						console.log("destructiveButtonClicked", item);
						var infos = {
							post: {
								post_deleted: 1
							},
							where: {
								post_id: item.post_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
							function(data) {
								console.log(data);
								$cordovaToast.show('Feito!', 'long', 'center');
								carregar();
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						console.log("buttonClicked", item);
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);

			};

			$scope.closeComment = function(){
				$scope.comment.hide();
			}

			$scope.loadMore = function() {

			  	pageforscroll = pageforscroll + 1;

			  	console.log("http://bastidor.com.br/vibesetal/json/posts?p=" + pageforscroll);
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/posts?p=" + pageforscroll,
					function(data) {
						$timeout(function() {
							if(data.records){
								console.log("infinite scroll")
								$scope.list = $scope.list.concat(checkVideo(data.records));
								$scope.$broadcast('scroll.infiniteScrollComplete');
							}else{
								$scope.noMoreItemsAvailable = false;
							}
						})
					},
					function(err) {

					})

			  };

			$scope.commentPost = function(post){
				$ionicLoading.show({
					template: 'Carregando...'
				});
				$scope.comment_post = [];
				var infos = {comment_post_id: post};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment", infos,
					function(data) {

							$scope.post = data.post;
							$scope.comment_post = data.comment;
							for(var i in $scope.comment_post)
								$scope.comment_post[i].comment_date = moment($scope.comment_post[i].comment_date).fromNow();
							$scope.post[0].post_time = moment($scope.post[0].post_time).fromNow();
							$scope.comment.show();
							$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
								shouldAnimate: true
							});
							$scope.commentforscroll = 1;
							$ionicLoading.hide();

						if(data.comment.length > 0){
							$scope.noMoreCommentsAvailable = true;
						}else{
							$scope.noMoreCommentsAvailable = false;
						}

					},
					function(err) {
						console.error(err);
					});

			}

			$scope.commentContextual = function(){
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						console.log("cancel", item);
						return true;
					},
					destructiveButtonClicked: function() {

						console.log("destructiveButtonClicked", item);
						var infos = {
							post: {
								post_deleted: 1
							},
							where: {
								post_id: item.post_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
							function(data) {
								console.log(data);
								$cordovaToast.show('Feito!', 'long', 'center');
								carregar();
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						console.log("buttonClicked", item);
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);
			}

			$scope.saveComment = function(post){

				if($scope.fields.insertComment != ""){
					$ionicLoading.show({
						template: 'Enviando...'
					});
					var data = {
						comment_post_id: post,
						comment_user_id: $scope.User.user_id,
						comment_text: $scope.fields.insertComment
					};
					JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/comment", data,
						function(data) {
							data.comment[0].comment_date = moment(data.comment[0].comment_date).fromNow();
							$scope.comment_post.unshift(data.comment[0]);
							$scope.fields.insertComment = "";
							$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
								shouldAnimate: true
							});
							var user = Memory.get('login');
							user.user_diamonds = data.diamonds;
							Memory.set('login', user);
							$ionicLoading.hide();
						},
						function(err) {
							console.error(err);

						});
				}

			}

			$scope.loadMoreComment = function(post){

				console.log("infinite scroll", $scope.noMoreCommentsAvailable);
				$scope.commentforscroll++;
				var infos = {comment_post_id: post};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment?p="+$scope.commentforscroll, infos,
					function(data) {
						$timeout(function() {
							if(data.comment.length > 0){
								for(var i in data.comment){
									data.comment[i].comment_date = moment(data.comment[i].comment_date).fromNow();
								}
								$scope.comment_post = $scope.comment_post.concat(data.comment);
							}else{
								$scope.noMoreCommentsAvailable = false;
							}
							$scope.$broadcast('scroll.infiniteScrollComplete');
						})

					},
					function(err) {
						console.error(err);

					});
			}

			$scope.refresh = carregar;
			$scope.selectedTab = "timeline";
			carregar();
		});
	})

.controller('UploadCtrl', function($scope, $stateParams, RAM, file, JustDo, $state, $cordovaToast, $ionicLoading) {
	var image = null;
	var start = function() {
		image = (RAM.get());
		RAM.set([]);
		$scope.desc = {};
		$scope.desc.str = "";
		$scope.image = image;
	}
	var carregar = function() {
		$ionicLoading.hide();
		$cordovaToast.showShortCenter('Enviado com Sucesso!')
			.then(function(success) {

				$state.go("app.home", {}, {reload: true});

			}, function(error) {
				// error
			});
	}

	$scope.addToList = function() {
		$ionicLoading.show({
			template: 'Enviando...'
		});
		var options = {
			fileKey: "post",
			fileName: image.data,
			chunkedMode: false,
			mimeType: null
		};
		$scope.subheader = "has-subheader";
		file.upload(image.data, options, function(sucesso) {

			console.log('s', sucesso);
			$scope.subheader = "";
			$scope.uploadProgress = 0;
			var infos = {
				post: {
					post_user_id: $scope.User.user_id,
					post_description: $scope.desc.str,
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
					console.error(err);

				});
		}, function(err) {
			console.log('e', err)
		}, function(prog) {
			$scope.uploadProgress = ((prog.loaded / prog.total * 100));
		});
	}
	start();

})

.controller('VideoCtrl', function($scope, $stateParams) {

})

.controller('TopPostCtrl', function($scope, $stateParams, $ionicPlatform, JustDo, $sce) {
	$ionicPlatform.ready(function() {
		var checkVideo = function(data) {
			if (data.post_type == "video") {
				if (data.post_file.indexOf("https://") == -1 && data.post_file.indexOf("http://") == -1)
					var url = "http://bastidor.com.br/vibesetal/content/" + data.post_file;
				else
					var url = data.post_file;
				$sce.trustAsResourceUrl(url);
				data.post_file = url;
			}
			return data;
		}
		var carregar = function() {
			JustDo.ItIf("http://bastidor.com.br/vibesetal/json/posts/best",
				function(data) {
					var records = [];
					for (var i = 0; i < data.records.length; i++) {
						records[i] = checkVideo(data.records[i]);
						records[i]['position'] = i;
						records[i]['time'] = moment(data.records[i].post_time).fromNow();
					}
					$scope.list = records;
				},
				function(err) {

				})
		}
		$scope.selectedTab = "posts";
		carregar();
	})
})

.controller('TopUsersCtrl', function($scope, $stateParams, $ionicPlatform, JustDo) {
		$ionicPlatform.ready(function() {
			var carregar = function() {
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/user/best",
					function(data) {
						$scope.list = data.records;
					},
					function(err) {

					})
			}
			$scope.selectedTab = "users";
			carregar();
		})
	})
	.controller('SobreCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser) {
		$ionicPlatform.ready(function() {
			$scope.Open = function(url) {;
				var options = {
					location: 'no',
					clearcache: 'yes',
					toolbar: 'yes'
				};

				$cordovaInAppBrowser.open(url, '_blank', options)
					.then(function(event) {
						// success
					})
					.catch(function(event) {
						// error
					});

			};
		})
	})