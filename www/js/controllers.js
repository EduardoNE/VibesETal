angular.module('starter.controllers', ['ngCordova', 'ngSanitize', 'ionic.service.core', 'ionic.service.push', 'starter.services', "ionicLazyLoad"])
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
			$scope.updateUser = function() {
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/user", {
						user_id: $scope.User.user_id
					},
					function(user) {
						console.log(user[0]);
						Memory.set('login', user[0]);
						//identifyUser(pushRegister, data.name);
						closeLogin();
						$scope.User = Memory.get('login');
						$scope.voltar = true;
					},
					function(err) {

					});
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
	.controller('HomeCtrl', function($scope, $state, $ionicPlatform, $cordovaCapture, $cordovaCamera, $cordovaSocialSharing, $cordovaToast, $cordovaFileTransfer, $cordovaFile, $sce, JustDo, file, Memory, RAM, $ionicActionSheet, $timeout, $ionicModal, $ionicScrollDelegate, $ionicLoading, $ionicPopup, $ionicHistory) {

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
							for (var i in data.records) {
								data.records[i].post_time = moment(data.records[i].post_time).fromNow();
							}
							$scope.list = checkVideo(data.records);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.noMoreItemsAvailable = true;
							//$scope.$apply()
						})
					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.refreshComplete');
					})
			}

			$scope.likePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};

				$("#post_" + post_id + " .btn_like").removeClass('button-royal');
				$("#post_" + post_id + " .btn_like").addClass('button-positive');
				var likes = $("#post_" + post_id + " .btn_like span").html();
				$("#post_" + post_id + " .btn_like span").html(parseInt(likes) + 1);
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
						$("#post_" + post_id + " .btn_like").removeClass('button-positive')
						$("#post_" + post_id + " .btn_like").addClass('button-royal')
						var likes = $("#post_" + post + " .btn_like span").html();
						$("#post_" + post + " .btn_like span").html(parseInt(likes) - 1);
						$cordovaToast.show('Erro ao curtir...', 'short', 'center');

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
				return data;
			}

			var sharePost = function(post_id) {
				var data = {
					share_post_id: post_id,
					share_user_id: $scope.User.user_id
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/share", data,
					function(share) {
						//likes = JSON.parse(share);
						console.log(share);
						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].share = share;
								break;
							}
						}
					},
					function(err) {

					});
			}

			$scope.share = function(msg, file, id) {
				var link = "http://vibesetal.com.br";

				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Facebook</b>'
					}, {
						text: '<b>Twitter</b>'
					}, {
						text: '<b>Whatsapp</b>'
					}, {
						text: '<b>Email</b>'
					}, {
						text: '<b>Outros</b>'
					}],
					//destructiveText: 'Deletar',
					titleText: 'Compartilhar',
					cancelText: 'Cancelar',
					cancel: function() {
						// add cancel code..
					},
					buttonClicked: function(index) {
						switch (index) {
							case 0:
								//Facebook
								$cordovaSocialSharing
									.shareViaFacebook(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 1:
								//Twitter
								$cordovaSocialSharing
									.shareViaTwitter(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 2:
								//Whatsapp
								$cordovaSocialSharing
									.shareViaWhatsApp(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 3:
								//Email
								$cordovaSocialSharing
									.shareViaEmail(msg, "Vibes&Tal", null, null, null, file)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							default:
								//default code block
								$cordovaSocialSharing
									.share(msg, msg, file, null) // Share via native share sheet
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});
						}
						return true;
					}
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
					$ionicHistory.nextViewOptions({
						disableBack: true
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
					duration: 60
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
						$scope.post = {}
						$scope.post.post_description = item.post_description;
						// An elaborate, custom popup
						var myPopup = $ionicPopup.show({
							template: '<input type="text" ng-model="post.post_description" ng-value="' + item.post_description + '">',
							title: 'Editar descrição',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {

									return $scope.post.post_description;

								}
							}]
						});

						myPopup.then(function(description) {
							var infos = {
								post: {
									post_description: description
								},
								where: {
									post_id: item.post_id
								}
							};
							console.log('Tapped!', infos);

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
								function(data) {
									console.log(data);
									$cordovaToast.show('Feito!', 'long', 'center');
									carregar();
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});
			};

			$scope.closeComment = function() {
				$scope.comment.hide();
			}

			$scope.openVideoPlayer = function(video, id) {
				$("#post_" + id + " .midia-post").html("<video style='width:100%;height:100%' autoplay='autoplay' controls src='" + video + "'></video>");
			}

			$scope.loadMore = function() {

				pageforscroll = pageforscroll + 1;
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/posts?p=" + pageforscroll,
					function(data) {
						$timeout(function() {
							if (data.records) {
								console.log("infinite scroll")
								for (var i in data.records) {
									data.records[i].post_time = moment(data.records[i].post_time).fromNow();
								}
								$scope.list = $scope.list.concat(checkVideo(data.records));
								$scope.$broadcast('scroll.infiniteScrollComplete');
							} else {
								$scope.noMoreItemsAvailable = false;
							}
						})
					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					})

			};

			$scope.commentPost = function(post) {
				$ionicLoading.show({
					template: 'Carregando...'
				});
				$scope.comment_post = [];
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment", infos,
					function(data) {
						$scope.post = data.post;
						$scope.comment_post = data.comment;
						for (var i in $scope.comment_post)
							$scope.comment_post[i].comment_date = moment($scope.comment_post[i].comment_date).fromNow();
						$scope.post[0].post_time = moment($scope.post[0].post_time).fromNow();
						$scope.comment.show();
						$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
							shouldAnimate: true
						});
						$scope.commentforscroll = 1;
						$ionicLoading.hide();

						if (data.comment.length > 0) {
							if (data.comment.length == 9) {
								$scope.noMoreCommentsAvailable = true;
							} else {
								$scope.noMoreCommentsAvailable = false;
							}

						} else {
							$scope.noMoreCommentsAvailable = false;
						}

					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}

			$scope.commentContextual = function(item) {
				$scope.commentEdit = item;
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						return true;
					},
					destructiveButtonClicked: function() {

						var infos = {
							comment: {
								comment_deleted: 1
							},
							where: {
								comment_id: item.comment_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
							function(data) {
								$cordovaToast.show('Comentário excluido com sucesso!', 'long', 'center');
								$("#comment_" + item.comment_id).parent().fadeOut()
								var comments = $("#post_" + item.comment_post_id + " .btn_comment span").html();
								$("#post_" + item.comment_post_id + " .btn_comment span").html(parseInt(comments) - 1);
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						// An elaborate, custom popup
						var commentPopUp = $ionicPopup.show({
							template: '<input type="text" ng-model="commentEdit.comment_text" value="' + item.comment_text + '">',
							title: 'Editar comentário',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {
									return $scope.commentEdit.comment_text;
								}
							}]
						});

						commentPopUp.then(function(text) {
							var infos = {
								comment: {
									comment_text: text
								},
								where: {
									comment_id: item.comment_id
								}
							};

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
								function(data) {
									$cordovaToast.show('Comentário editado com sucesso!', 'long', 'center');
									$("#comment_" + item.comment_id + " .comment_desc").html($scope.commentPost.comment_text)
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);
			}

			$scope.saveComment = function(post) {

				if ($scope.fields.insertComment != "") {
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
							var comments = $("#post_" + post + " .btn_comment span").html();
							$("#post_" + post + " .btn_comment span").html(parseInt(comments) + 1);
						},
						function(err) {
							console.error(err);
							$ionicLoading.hide();
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						});
				}

			}

			$scope.loadMoreComment = function(post) {

				console.log("infinite scroll", $scope.noMoreCommentsAvailable);
				$scope.commentforscroll++;
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment?p=" + $scope.commentforscroll, infos,
					function(data) {
						$timeout(function() {
							if (data.comment.length > 0) {
								for (var i in data.comment) {
									data.comment[i].comment_date = moment(data.comment[i].comment_date).fromNow();
								}
								$scope.comment_post = $scope.comment_post.concat(data.comment);
							} else {
								$scope.noMoreCommentsAvailable = false;
							}
							$scope.$broadcast('scroll.infiniteScrollComplete');
						})

					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			}

			$scope.refresh = carregar;
			$scope.selectedTab = "timeline";
			carregar();
		});
	})

	.controller('UploadCtrl', function($scope, $stateParams, RAM, file, JustDo, $state, $cordovaToast, $ionicLoading, $ionicHistory) {
		/*var signaturePad = null;
		var increase = 10;

		function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

		    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

		    return { width: srcWidth*ratio, height: srcHeight*ratio };
		 }


		function convertImgToBase64(url, callback, outputFormat) {
		    var img = new Image();
		    img.crossOrigin = 'Anonymous';
		    var increase = 10;
		    var TO_RADIANS = Math.PI/180;
		    img.onload = function() {
		        var canvas = document.getElementById("myCanvas");
		        signaturePad = new SignaturePad(canvas);
		        signaturePad.minWidth = increase;
		        signaturePad.maxWidth = increase;
		        var ctx = canvas.getContext('2d');
		        canvas.height = this.width;
		        canvas.width = this.height;
		        ctx.save();
		        ctx.translate((canvas.width / 2), (canvas.height / 2));
				ctx.rotate(90 * TO_RADIANS);
				ctx.drawImage(this, -(this.width/2), -(this.height/2));
				ctx.restore();
		        var dataURL = canvas.toDataURL(outputFormat || 'image/png');
		        callback(dataURL);
		        canvas = null;
		    };
		    img.src = url;
		}

		$scope.changeColor = function(r, g, b){
			signaturePad.penColor = "rgb("+r+", "+g+", "+b+")";
		}
		$scope.increaseRadius = function(){
			increase += 5;
			signaturePad.minWidth = increase;
		}

		$scope.decreaseRadius = function(){
			increase -= 5;
			if(increase <= 5)
				increase = 5;
			signaturePad.minWidth = increase;
		}*/

		function scaleSize(maxW, maxH, currW, currH){

			var ratio = currH / currW;

			if(currW >= maxW && ratio <= 1){
				currW = maxW;
				currH = currW * ratio;
			} else if(currH >= maxH){
				currH = maxH;
				currW = currH / ratio;
			}

			return [currW, currH];
		}

		var start = function() {
			image = (RAM.get());
			RAM.set([]);
			$scope.desc = {};
			$scope.desc.str = "";
			$scope.image = image;


			if(image.type == "image"){
				var maxWidth = $(window).width();
				var maxHeight = $(window).height;
				var currW = $("#photo img").width();
				var currH = $("#photo img").height() - 30;
				var newSize = scaleSize(currW, currH, maxWidth, maxHeight);
				$("#photo img").css({width: newSize[0]+"px", height: newSize[1]+"px"});
				/*
				convertImgToBase64(image.data, function(base64Img){
					image.data = base64Img;
					$scope.image = image;
			    });*/
			}

		}

		var carregar = function() {
			$ionicLoading.hide();
			$cordovaToast.showShortCenter('Enviado com Sucesso!')
				.then(function(success) {
					$ionicHistory.nextViewOptions({
						disableBack: true
					});
					$state.go("app.home", {}, {
						reload: true
					});

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
			file.upload($scope.image.data, options, function(sucesso) {

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
						carregar();
					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}, function(err) {
				console.log('e', err)
				$ionicLoading.hide();
				$cordovaToast.showShortCenter('Sem conexão com a internet.');
			}, function(prog) {
				$scope.uploadProgress = ((prog.loaded / prog.total * 100));
			});


			/*if($scope.image.type == "image"){
				var data = {
					post_file: signaturePad.toDataURL(),
					post_user_id: $scope.User.user_id,
					post_description: $scope.desc.str,
					post_deleted: 0,
					post_type: "image"
				}

				JustDo.aPost('http://bastidor.com.br/vibesetal/json/upload/post', data,
					function(data) {
						console.log("finish", data)
						carregar();
					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}else{
				var options = {
					fileKey: "post",
					fileName: image.data,
					chunkedMode: false,
					mimeType: null
				};
				$scope.subheader = "has-subheader";
				file.upload($scope.image.data, options, function(sucesso) {

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
							carregar();
						},
						function(err) {
							console.error(err);
							$ionicLoading.hide();
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						});
				}, function(err) {
					console.log('e', err)
					$ionicLoading.hide();
					$cordovaToast.showShortCenter('Sem conexão com a internet.');
				}, function(prog) {
					$scope.uploadProgress = ((prog.loaded / prog.total * 100));
				});
			}*/

		}
		start();

	})

	.controller('VideoCtrl', function($scope, $stateParams) {

	})

	.controller('TopPostCtrl', function($scope, $stateParams, $ionicPlatform, JustDo, $sce, $cordovaToast, $ionicModal, $ionicLoading, $ionicScrollDelegate, $ionicActionSheet) {
		$scope.fields = [];
		$scope.noMoreItemsAvailable = false;
		$scope.noMoreCommentsAvailable = true;
		$scope.commentforscroll = 1;
		$ionicPlatform.ready(function() {

			$ionicModal.fromTemplateUrl('templates/openPost.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.post_m = modal;
			});


			$scope.openVideoPlayer = function(id) {
				$("#post_" + id + " .open_image").hide();
				$("#post_" + id + " .open_video").show();
			}

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
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.refreshComplete');
					})
			}

			$scope.openPost = function(post){
				post.post_time = moment(post.post_time).fromNow();
				$scope.item = post;
				$scope.post_m.show();
			}

			$scope.closePost = function() {
				$scope.post_m.hide();
			}

			$scope.likePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};

				$("#post_" + post_id + " .btn_like").removeClass('button-royal');
				$("#post_" + post_id + " .btn_like").addClass('button-positive');
				var likes = $("#post_" + post_id + " .btn_like span").html();
				$("#post_" + post_id + " .btn_like span").html(parseInt(likes) + 1);
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
						$("#post_" + post_id + " .btn_like").removeClass('button-positive')
						$("#post_" + post_id + " .btn_like").addClass('button-royal')
						var likes = $("#post_" + post + " .btn_like span").html();
						$("#post_" + post + " .btn_like span").html(parseInt(likes) - 1);
						$cordovaToast.show('Erro ao curtir...', 'short', 'center');

					});
			}

			$scope.commentPost = function(post) {
				console.log(post);
				$ionicLoading.show({
					template: 'Carregando...'
				});
				$scope.comment_post = [];
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment", infos,
					function(data) {
						$scope.post = data.post;
						$scope.comment_post = data.comment;
						for (var i in $scope.comment_post)
							$scope.comment_post[i].comment_date = moment($scope.comment_post[i].comment_date).fromNow();
						$scope.post[0].post_time = moment($scope.post[0].post_time).fromNow();
						$scope.comment.show();
						$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
							shouldAnimate: true
						});
						$scope.commentforscroll = 1;
						$ionicLoading.hide();

						if (data.comment.length > 0) {
							if (data.comment.length == 9) {
								$scope.noMoreCommentsAvailable = true;
							} else {
								$scope.noMoreCommentsAvailable = false;
							}

						} else {
							$scope.noMoreCommentsAvailable = false;
						}

					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}

			$scope.commentContextual = function(item) {
				$scope.commentEdit = item;
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						return true;
					},
					destructiveButtonClicked: function() {

						var infos = {
							comment: {
								comment_deleted: 1
							},
							where: {
								comment_id: item.comment_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
							function(data) {
								$cordovaToast.show('Comentário excluido com sucesso!', 'long', 'center');
								$("#comment_" + item.comment_id).parent().fadeOut()
								var comments = $("#post_" + item.comment_post_id + " .btn_comment span").html();
								$("#post_" + item.comment_post_id + " .btn_comment span").html(parseInt(comments) - 1);
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						// An elaborate, custom popup
						var commentPopUp = $ionicPopup.show({
							template: '<input type="text" ng-model="commentEdit.comment_text" value="' + item.comment_text + '">',
							title: 'Editar comentário',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {
									return $scope.commentEdit.comment_text;
								}
							}]
						});

						commentPopUp.then(function(text) {
							var infos = {
								comment: {
									comment_text: text
								},
								where: {
									comment_id: item.comment_id
								}
							};

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
								function(data) {
									$cordovaToast.show('Comentário editado com sucesso!', 'long', 'center');
									$("#comment_" + item.comment_id + " .comment_desc").html($scope.commentPost.comment_text)
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);
			}

			$scope.saveComment = function(post) {

				if ($scope.fields.insertComment != "") {
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
							var comments = $("#post_" + post + " .btn_comment span").html();
							$("#post_" + post + " .btn_comment span").html(parseInt(comments) + 1);
						},
						function(err) {
							console.error(err);
							$ionicLoading.hide();
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						});
				}

			}

			$scope.loadMoreComment = function(post) {

				console.log("infinite scroll", $scope.noMoreCommentsAvailable);
				$scope.commentforscroll++;
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment?p=" + $scope.commentforscroll, infos,
					function(data) {
						$timeout(function() {
							if (data.comment.length > 0) {
								for (var i in data.comment) {
									data.comment[i].comment_date = moment(data.comment[i].comment_date).fromNow();
								}
								$scope.comment_post = $scope.comment_post.concat(data.comment);
							} else {
								$scope.noMoreCommentsAvailable = false;
							}
							$scope.$broadcast('scroll.infiniteScrollComplete');
						})

					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			}

			carregar();
		})
	})

	.controller('TopUsersCtrl', function($scope, $stateParams, $ionicPlatform, JustDo, $cordovaToast) {
			$ionicPlatform.ready(function() {
				var carregar = function() {
					JustDo.ItIf("http://bastidor.com.br/vibesetal/json/user/best",
						function(data) {
							$scope.list = data.records;
						},
						function(err) {
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
							$scope.$broadcast('scroll.refreshComplete');
						})
				}

				carregar();
			})
		})
	.controller('BrothersCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser, $cordovaToast, JustDo) {
		$ionicPlatform.ready(function() {
			JustDo.ItIf("http://bastidor.com.br/vibesetal/json/brothers", function(data){
				$scope.brothers = data;
			},
			function(err){
				$cordovaToast.showShortCenter('Sem conexão com a internet.');
			})
		})
	})

	.controller('BrotherPageCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser, $cordovaToast, JustDo, $ionicLoading, $ionicPopup, $ionicHistory, $ionicSwipeCardDelegate, $ionicModal, file, Memory, RAM, $ionicActionSheet, $cordovaSocialSharing, $ionicScrollDelegate) {

		$ionicPlatform.ready(function() {
			$ionicLoading.show({
				content: 'Loading',
				animation: 'fade-in',
				showBackdrop: true,
				maxWidth: 200,
				showDelay: 500
			});
			$scope.fields = [];
			$scope.noMoreCommentsAvailable = true;
			$scope.commentforscroll = 1;
			$ionicModal.fromTemplateUrl('templates/comment-m.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.comment = modal;
			});
			$scope.hasPost = false;
			var countCards = 0;
			var total = new Array();
			$scope.list = new Array();
			var position = 1;
			var canSwipe = false;

			var likes = Memory.get('likes');
			if (likes == 0) {
				likes = [];
				Memory.set('likes', likes);
			}

			var data = {
				post_user_id: $stateParams.id
			}

			JustDo.aPost("http://bastidor.com.br/vibesetal/json/brothers/select", data,
				function(data){
					console.log("inicio", data)
					if(data[0]){
						$scope.hasPost = true;
						for(var i in data){
							if(data[i]){
								data[i].post_time = moment(data[i].post_time).fromNow();

								if (likes.indexOf(data[i].post_id) > -1)
									data[i].liked = true;
								else
									data[i].liked = false;

								total.push(data[i]);
							}
						}
						var first = total.shift();
						$scope.list.push(first);
						$ionicLoading.hide();
					}else{
						$ionicLoading.hide();
						var alertPopup = $ionicPopup.alert({
							title: 'Oops!',
							template: 'Parace que esse brother não tem nenhum post!'
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});

					}

				},
				function(err){
					$cordovaToast.showShortCenter('Sem conexão com a internet.');
				}
				)

			$scope.openVideoPlayer = function(video, id) {
				$("#brothersPage #post_" + id + " .midia-post").html("<video style='width:100%;height:100%' autoplay='autoplay' controls src='http://bastidor.com.br/vibesetal/content/" + video + "'></video>");
			}

			$scope.cardSwiped = function(index) {

				var first = total.shift();
				$scope.list.push(first);
				position++;

				if(position == 5){
					position = 1;
					var last = total[total.length-1]
					if(last){
						$scope.hasPost = true;
						var data = {
							post_user_id: $stateParams.id,
							post_id: last.post_id
						}
						JustDo.aPost("http://bastidor.com.br/vibesetal/json/brothers/select", data, function(data){
							if(data[0]){
								for(var i in data){
									data[i].post_time = moment(data[i].post_time).fromNow();
									if (likes.indexOf(data[i].post_id) > -1)
										data[i].liked = true;
									else
										data[i].liked = false;
									total.push(data[i]);
								}
							}
						},
						function(err){
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						})
					}else{
						$scope.hasPost = false;
					}

				}


			};

			$scope.cardDestroyed = function(index) {
				$scope.list.splice(index, 1);
			};


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
						$scope.post = {}
						$scope.post.post_description = item.post_description;
						// An elaborate, custom popup
						var myPopup = $ionicPopup.show({
							template: '<input type="text" ng-model="post.post_description" ng-value="' + item.post_description + '">',
							title: 'Editar descrição',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {

									return $scope.post.post_description;

								}
							}]
						});

						myPopup.then(function(description) {
							var infos = {
								post: {
									post_description: description
								},
								where: {
									post_id: item.post_id
								}
							};
							console.log('Tapped!', infos);

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
								function(data) {
									console.log(data);
									$cordovaToast.show('Feito!', 'long', 'center');
									carregar();
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});
			};

			$scope.closeComment = function() {
				$scope.comment.hide();
			}

			$scope.commentPost = function(post) {
				$ionicLoading.show({
					template: 'Carregando...'
				});
				$scope.comment_post = [];
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment", infos,
					function(data) {
						$scope.post = data.post;
						$scope.comment_post = data.comment;
						for (var i in $scope.comment_post)
							$scope.comment_post[i].comment_date = moment($scope.comment_post[i].comment_date).fromNow();
						$scope.post[0].post_time = moment($scope.post[0].post_time).fromNow();
						$scope.comment.show();
						$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
							shouldAnimate: true
						});
						$scope.commentforscroll = 1;
						$ionicLoading.hide();

						if (data.comment.length > 0) {
							if (data.comment.length == 9) {
								$scope.noMoreCommentsAvailable = true;
							} else {
								$scope.noMoreCommentsAvailable = false;
							}

						} else {
							$scope.noMoreCommentsAvailable = false;
						}

					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}

			$scope.commentContextual = function(item) {
				$scope.commentEdit = item;
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						return true;
					},
					destructiveButtonClicked: function() {

						var infos = {
							comment: {
								comment_deleted: 1
							},
							where: {
								comment_id: item.comment_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
							function(data) {
								$cordovaToast.show('Comentário excluido com sucesso!', 'long', 'center');
								$("#comment_" + item.comment_id).parent().fadeOut()
								var comments = $("#post_" + item.comment_post_id + " .btn_comment span").html();
								$("#post_" + item.comment_post_id + " .btn_comment span").html(parseInt(comments) - 1);
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						// An elaborate, custom popup
						var commentPopUp = $ionicPopup.show({
							template: '<input type="text" ng-model="commentEdit.comment_text" value="' + item.comment_text + '">',
							title: 'Editar comentário',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {
									return $scope.commentEdit.comment_text;
								}
							}]
						});

						commentPopUp.then(function(text) {
							var infos = {
								comment: {
									comment_text: text
								},
								where: {
									comment_id: item.comment_id
								}
							};

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
								function(data) {
									$cordovaToast.show('Comentário editado com sucesso!', 'long', 'center');
									$("#comment_" + item.comment_id + " .comment_desc").html($scope.commentPost.comment_text)
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);
			}

			$scope.saveComment = function(post) {

				if ($scope.fields.insertComment != "") {
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
							var comments = $("#post_" + post + " .btn_comment span").html();
							$("#post_" + post + " .btn_comment span").html(parseInt(comments) + 1);
						},
						function(err) {
							console.error(err);
							$ionicLoading.hide();
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						});
				}

			}

			$scope.loadMoreComment = function(post) {

				console.log("infinite scroll", $scope.noMoreCommentsAvailable);
				$scope.commentforscroll++;
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment?p=" + $scope.commentforscroll, infos,
					function(data) {
						$timeout(function() {
							if (data.comment.length > 0) {
								for (var i in data.comment) {
									data.comment[i].comment_date = moment(data.comment[i].comment_date).fromNow();
								}
								$scope.comment_post = $scope.comment_post.concat(data.comment);
							} else {
								$scope.noMoreCommentsAvailable = false;
							}
							$scope.$broadcast('scroll.infiniteScrollComplete');
						})

					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			}

			var sharePost = function(post_id) {
				var data = {
					share_post_id: post_id,
					share_user_id: $scope.User.user_id
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/share", data,
					function(share) {
						//likes = JSON.parse(share);
						console.log(share);
						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].share = share;
								break;
							}
						}
					},
					function(err) {

					});
			}

			$scope.share = function(msg, file, id) {
				var link = "http://vibesetal.com.br";

				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Facebook</b>'
					}, {
						text: '<b>Twitter</b>'
					}, {
						text: '<b>Whatsapp</b>'
					}, {
						text: '<b>Email</b>'
					}, {
						text: '<b>Outros</b>'
					}],
					//destructiveText: 'Deletar',
					titleText: 'Compartilhar',
					cancelText: 'Cancelar',
					cancel: function() {
						// add cancel code..
					},
					buttonClicked: function(index) {
						switch (index) {
							case 0:
								//Facebook
								$cordovaSocialSharing
									.shareViaFacebook(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 1:
								//Twitter
								$cordovaSocialSharing
									.shareViaTwitter(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 2:
								//Whatsapp
								$cordovaSocialSharing
									.shareViaWhatsApp(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 3:
								//Email
								$cordovaSocialSharing
									.shareViaEmail(msg, "Vibes&Tal", null, null, null, file)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							default:
								//default code block
								$cordovaSocialSharing
									.share(msg, msg, file, null) // Share via native share sheet
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});
						}
						return true;
					}
				});
			};

			$scope.likePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};

				$("#post_" + post_id + " .btn_like").removeClass('button-royal');
				$("#post_" + post_id + " .btn_like").addClass('button-positive');
				var likes = $("#post_" + post_id + " .btn_like span").html();
				$("#post_" + post_id + " .btn_like span").html(parseInt(likes) + 1);
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
						$("#post_" + post_id + " .btn_like").removeClass('button-positive')
						$("#post_" + post_id + " .btn_like").addClass('button-royal')
						var likes = $("#post_" + post + " .btn_like span").html();
						$("#post_" + post + " .btn_like span").html(parseInt(likes) - 1);
						$cordovaToast.show('Erro ao curtir...', 'short', 'center');

					});
			}



		})
	})
	.controller('EnqueteCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser, $cordovaToast, JustDo) {
		$ionicPlatform.ready(function() {
			var carregar = function() {
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/enquetes",
					function(data) {
						data[0].enquete_time = moment(data[0].enquete_time).fromNow();
						$scope.enq = data[0];
					},
					function(err) {
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.refreshComplete');
					})
			}

			carregar();


		})
	})
	.controller('CodeCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser, $cordovaToast, JustDo) {
		$ionicPlatform.ready(function() {
			var qrcode = new QRCode("qrcode");

			function makeCode () {
			    var elText = $("#qrcode").html()

			    qrcode.makeCode(elText);

			    $("#qrcode img").css("margin", "auto");
			}

			makeCode();


		})
	})
	.controller('SobreCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaInAppBrowser, $cordovaToast, JustDo) {
		$ionicPlatform.ready(function() {
			var carregar = function() {
				JustDo.ItIf("http://bastidor.com.br/vibesetal/json/sobre",
					function(data) {
						console.log('sobre', data)
						$scope.items = data;
					},
					function(err) {
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.refreshComplete');
					})
			}

			$scope.Open = function(url) {
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

			carregar();
		})
	})
	.controller('UserPostsCtrl', function($stateParams, $scope, $state, $ionicPlatform, $cordovaCapture, $cordovaCamera, $cordovaSocialSharing, $cordovaToast, $cordovaFileTransfer, $cordovaFile, $sce, JustDo, file, Memory, RAM, $ionicActionSheet, $timeout, $ionicModal, $ionicScrollDelegate, $ionicLoading, $ionicPopup, $ionicHistory) {

		$scope.list = [];
		var pageforscroll = 1;
		var hasscroll = true;
		$scope.fields = [];
		$scope.noMoreItemsAvailable = false;
		$scope.noMoreCommentsAvailable = true;
		$scope.forscroll = 1;
		$ionicModal.fromTemplateUrl('templates/comment-m.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.comment = modal;
		});
		$ionicPlatform.ready(function() {

			var carregar = function() {
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/user/posts",{"user_id": $stateParams.id},
					function(data) { console.log('userposts '+$stateParams.id,data)
						$timeout(function() {
							$scope.forscroll = 1;
							var hasscroll = true;
							for (var i in data.records) {
								data.records[i].post_time = moment(data.records[i].post_time).fromNow();
							}
							$scope.list = checkVideo(data.records);
							$scope.$broadcast('scroll.refreshComplete');
							$scope.noMoreItemsAvailable = true;
							//$scope.$apply()
						})
					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.refreshComplete');
					})
			}

			$scope.likePost = function(post_id) {
				var data = {
					like_post_id: post_id,
					like_user_id: $scope.User.user_id
				};

				$("#post_" + post_id + " .btn_like").removeClass('button-royal');
				$("#post_" + post_id + " .btn_like").addClass('button-positive');
				var likes = $("#post_" + post_id + " .btn_like span").html();
				$("#post_" + post_id + " .btn_like span").html(parseInt(likes) + 1);
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
						$("#post_" + post_id + " .btn_like").removeClass('button-positive')
						$("#post_" + post_id + " .btn_like").addClass('button-royal')
						var likes = $("#post_" + post + " .btn_like span").html();
						$("#post_" + post + " .btn_like span").html(parseInt(likes) - 1);
						$cordovaToast.show('Erro ao curtir...', 'short', 'center');

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
				return data;
			}

			var sharePost = function(post_id) {
				var data = {
					share_post_id: post_id,
					share_user_id: $scope.User.user_id
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/share", data,
					function(share) {
						//likes = JSON.parse(share);
						console.log(share);
						for (var i = 0; i < $scope.list.length; i++) {
							if ($scope.list[i].post_id == post_id) {
								$scope.list[i].share = share;
								break;
							}
						}
					},
					function(err) {

					});
			}

			$scope.share = function(msg, file, id) {
				var link = "http://vibesetal.com.br";

				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Facebook</b>'
					}, {
						text: '<b>Twitter</b>'
					}, {
						text: '<b>Whatsapp</b>'
					}, {
						text: '<b>Email</b>'
					}, {
						text: '<b>Outros</b>'
					}],
					//destructiveText: 'Deletar',
					titleText: 'Compartilhar',
					cancelText: 'Cancelar',
					cancel: function() {
						// add cancel code..
					},
					buttonClicked: function(index) {
						switch (index) {
							case 0:
								//Facebook
								$cordovaSocialSharing
									.shareViaFacebook(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 1:
								//Twitter
								$cordovaSocialSharing
									.shareViaTwitter(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 2:
								//Whatsapp
								$cordovaSocialSharing
									.shareViaWhatsApp(msg, file, link)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							case 3:
								//Email
								$cordovaSocialSharing
									.shareViaEmail(msg, "Vibes&Tal", null, null, null, file)
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});

								break;
							default:
								//default code block
								$cordovaSocialSharing
									.share(msg, msg, file, null) // Share via native share sheet
									.then(function(result) {
										console.log(result);
										$cordovaToast.show('Feito!', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										$("#post_" + id + " .btn_share span").html(parseInt(shares) + 1);
										sharePost(id);
									}, function(err) {
										console.log(err);
										$cordovaToast.show('Erro ao compartilhar...', 'short', 'center');
										var shares = $("#post_" + id + " .btn_share span").html();
										//$("#post_"+id+" .btn_share span").html(parseInt(shares) - 1);
									});
						}
						return true;
					}
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
					$ionicHistory.nextViewOptions({
						disableBack: true
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
						$scope.post = {}
						$scope.post.post_description = item.post_description;
						// An elaborate, custom popup
						var myPopup = $ionicPopup.show({
							template: '<input type="text" ng-model="post.post_description" ng-value="' + item.post_description + '">',
							title: 'Editar descrição',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {

									return $scope.post.post_description;

								}
							}]
						});

						myPopup.then(function(description) {
							var infos = {
								post: {
									post_description: description
								},
								where: {
									post_id: item.post_id
								}
							};
							console.log('Tapped!', infos);

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/post", infos,
								function(data) {
									console.log(data);
									$cordovaToast.show('Feito!', 'long', 'center');
									carregar();
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});
			};

			$scope.closeComment = function() {
				$scope.comment.hide();
			}

			$scope.openVideoPlayer = function(video, id) {
				$("#post_" + id + " .midia-post").html("<video style='width:100%;height:100%' autoplay='autoplay' src='" + video + "'></video>");
			}

			$scope.loadMore = function() {

				pageforscroll = pageforscroll + 1;
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/user/posts?p=" + pageforscroll,{'user_id': $stateParams.id},
					function(data) {
						$timeout(function() {
							if (data.records) {
								console.log("infinite scroll")
								for (var i in data.records) {
									data.records[i].post_time = moment(data.records[i].post_time).fromNow();
								}
								$scope.list = $scope.list.concat(checkVideo(data.records));
								$scope.$broadcast('scroll.infiniteScrollComplete');
							} else {
								$scope.noMoreItemsAvailable = false;
							}
						})
					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					})

			};

			$scope.commentPost = function(post) {
				$ionicLoading.show({
					template: 'Carregando...'
				});
				$scope.comment_post = [];
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment", infos,
					function(data) {
						$scope.post = data.post;
						$scope.comment_post = data.comment;
						for (var i in $scope.comment_post)
							$scope.comment_post[i].comment_date = moment($scope.comment_post[i].comment_date).fromNow();
						$scope.post[0].post_time = moment($scope.post[0].post_time).fromNow();
						$scope.comment.show();
						$ionicScrollDelegate.$getByHandle("commentMain").scrollTop({
							shouldAnimate: true
						});
						$scope.forscroll = 1;
						$ionicLoading.hide();

						if (data.comment.length > 0) {
							if (data.comment.length == 9) {
								$scope.noMoreCommentsAvailable = true;
							} else {
								$scope.noMoreCommentsAvailable = false;
							}

						} else {
							$scope.noMoreCommentsAvailable = false;
						}

					},
					function(err) {
						console.error(err);
						$ionicLoading.hide();
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
					});
			}

			$scope.commentContextual = function(item) {
				$scope.commentEdit = item;
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '<b>Editar</b>'
					}],
					destructiveText: '<b>Excluir</b>',
					titleText: 'O que deseja fazer?',
					cancelText: 'Cancelar',
					cancel: function() {
						return true;
					},
					destructiveButtonClicked: function() {

						var infos = {
							comment: {
								comment_deleted: 1
							},
							where: {
								comment_id: item.comment_id
							}
						};

						JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
							function(data) {
								$cordovaToast.show('Comentário excluido com sucesso!', 'long', 'center');
								$("#comment_" + item.comment_id).parent().fadeOut()
								var comments = $("#post_" + item.comment_post_id + " .btn_comment span").html();
								$("#post_" + item.comment_post_id + " .btn_comment span").html(parseInt(comments) - 1);
							},
							function(err) {
								console.error(err);
							});
						return true;
					},
					buttonClicked: function(index) {
						// An elaborate, custom popup
						var commentPopUp = $ionicPopup.show({
							template: '<input type="text" ng-model="commentEdit.comment_text" value="' + item.comment_text + '">',
							title: 'Editar comentário',
							//subTitle: 'Please use normal things',
							scope: $scope,
							buttons: [{
								text: 'Cancelar'
							}, {
								text: '<b>Salvar</b>',
								type: 'button-positive',
								onTap: function(e) {
									return $scope.commentEdit.comment_text;
								}
							}]
						});

						commentPopUp.then(function(text) {
							var infos = {
								comment: {
									comment_text: text
								},
								where: {
									comment_id: item.comment_id
								}
							};

							JustDo.aPost("http://bastidor.com.br/vibesetal/json/update/comment", infos,
								function(data) {
									$cordovaToast.show('Comentário editado com sucesso!', 'long', 'center');
									$("#comment_" + item.comment_id + " .comment_desc").html($scope.commentPost.comment_text)
								},
								function(err) {
									console.error(err);
								});
						});
						return true;
					}
				});

				// hide the sheet after 5 seconds
				$timeout(function() {
					hideSheet();
				}, 5000);
			}

			$scope.saveComment = function(post) {

				if ($scope.fields.insertComment != "") {
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
							var comments = $("#post_" + post + " .btn_comment span").html();
							$("#post_" + post + " .btn_comment span").html(parseInt(comments) + 1);
						},
						function(err) {
							console.error(err);
							$ionicLoading.hide();
							$cordovaToast.showShortCenter('Sem conexão com a internet.');
						});
				}

			}

			$scope.loadMoreComment = function(post) {

				console.log("infinite scroll", $scope.noMoreCommentsAvailable);
				$scope.forscroll++;
				var infos = {
					comment_post_id: post
				};
				JustDo.aPost("http://bastidor.com.br/vibesetal/json/post/open_comment?p=" + $scope.forscroll, infos,
					function(data) {
						$timeout(function() {
							if (data.comment.length > 0) {
								for (var i in data.comment) {
									data.comment[i].comment_date = moment(data.comment[i].comment_date).fromNow();
								}
								$scope.comment_post = $scope.comment_post.concat(data.comment);
							} else {
								$scope.noMoreCommentsAvailable = false;
							}
							$scope.$broadcast('scroll.infiniteScrollComplete');
						})

					},
					function(err) {
						console.error(err);
						$cordovaToast.showShortCenter('Sem conexão com a internet.');
						$scope.$broadcast('scroll.infiniteScrollComplete');
					});
			}

			$scope.refresh = carregar;
			$scope.selectedTab = "timeline";
			carregar();
		});
	})