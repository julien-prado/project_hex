"use strict";
(function(){
var app = angular.module('app')
app.directive('brushBox',function(){
	return{
		restrict : 'E',
		controller:function($scope,$element){
			$scope.brushRadius = 0;
			$scope.brush = Hexmap.getRadialBrush({q:0,r:0},$scope.brushRadius,{h:1});
			function getRadialBrush(){
				$scope.brush = Hexmap.getRadialBrush({q:0,r:0},$scope.brushRadius,{h:1});
			};
			$scope.$watch('brushRadius' , function(newVals, oldVals) {
				if (newVals==undefined) return;
					getRadialBrush();
					return ;
				}, true);
		}
	};
});

app.directive('brushCanvas',function(){
	return{
		restrict : 'E',
		controller:function($scope,$element){
			var rootElement= $($element[0]);
			function getRootWidth(){return rootElement.width();}
			function getRootHeight(){return rootElement.height();}
			$scope.brushGroup=new Konva.Group();
			var groupK =new Konva.Group();
			function initStage(){
				var stage = new Konva.Stage({
					container: $element[0],
					width: getRootWidth(),
					height: getRootWidth()
				});
				return stage;
			}
			function updateLayer(kLayer,values,brush){
				groupK.destroyChildren();
				for(var i=0,len=brush.length; i<len; i++){
					var poly = new Konva.RegularPolygon({
							q:$scope.brush[i].q,
							r:$scope.brush[i].r,
							id: brush[i].q+":"+$scope.brush[i].r,
							x: values.RADIUS * Math.SQRT3 * (brush[i].q + brush[i].r/2),
							y: values.RADIUS * 3/2 * brush[i].r,
							sides: 6,
							radius: values.RADIUS,
							fill: 'grey'
						});
					groupK.add(poly);
				}
				groupK.x(values.width/2);
				groupK.y(values.height/2);
				groupK.cache({drawBorder:true});
			}
			function initForegrid(stage,values){
				var kLayer = new Konva.Layer();
				kLayer.add(groupK);
				updateLayer(kLayer,values,$scope.brush);
				$scope.$watch('brush' , function(newVals, oldVals) {
						if (newVals==undefined) return;
						updateLayer(kLayer,values,newVals);
						kLayer.draw();
						return ;
					}, true);
				stage.add(kLayer);
				kLayer.draw();
			}
			
			var stage = initStage();
			initForegrid(stage,{
				RADIUS:15,
				width: getRootWidth(),
				height: getRootWidth()
			});
		}
	};
	
});
app.directive('drawareaCanvas',function(){
	return{
		restrict : 'E',
		controller:function($scope,$element){
			var mapLayers=[];
			var rootElement= $($element[0]); 
			function getRootWidth(){return rootElement.width();}
			function getRootHeight(){return rootElement.height();}
			var sceneWidth=1;
			var sceneHeight=1;
			var stage = new Konva.Stage({
					container: $element[0],
					width: getRootWidth(),
					height: getRootHeight(),
					draggable: false,
					dragBoundFunc: function(pos) {
						var newX = pos.x;
						var newY = pos.y;
						
						if(newX > 0 || this.width() > (this.scaleX() * sceneWidth)){
							newX = 0 ;
						}else if(newX < this.width() - (this.scaleX() * sceneWidth)){
							newX = this.width() - (this.scaleX() * sceneWidth);
						}
						if(newY > 0 || this.height() > (this.scaleY() * sceneHeight)){
							newY = 0 ;
						}else if(newY < this.height() - (this.scaleY() * sceneHeight)){
							newY = this.height() - (this.scaleY() * sceneHeight);
						}
						return {
							x: newX,
							y: newY
						}
					}
			});
			var allowed = true;
			var editState = 'edit';
			$(document).keydown(function(e) { 
				if (!allowed) return;
				allowed = false;
				if(e.ctrlKey){
					editState='remove';
					$("canvas").css("cursor", "no-drop");
				}else{
					switch(e.which){
						case 32:{
							editState='drag';
							$("canvas").css("cursor", "move");
							stage.draggable(true);
							break;
						}
						case 2:{
							stage.draggable(true);
							break;
						}
					}
				}
			});
			function resetState(e){
				allowed = true;
				editState = 'edit';
				$("canvas").css("cursor", "default");
				stage.draggable(false);
			}
			$(document).keyup(resetState);
			$(document).focus(resetState);
			
			var foreground = new Konva.Layer();
			var bufferLayer = new Konva.Layer();
			var background = new Konva.Layer();
			stage.add(background);
			stage.add(bufferLayer);
			stage.add(foreground);
			stage.on('mousewheel', function(e) {
					var zoomAmount = (e.evt.wheelDelta/120)*0.01;
					if(((stage.scaleX()+zoomAmount)>(this.width()/sceneWidth) || (stage.scaleY()+zoomAmount)>(this.height()/sceneHeight)) && (stage.scaleX()+zoomAmount)<2){
						stage.scaleX(stage.scaleX()+zoomAmount);
						stage.scaleY(stage.scaleY()+zoomAmount);
						var newX = stage.x();
						if(stage.x() > 0 || stage.scaleX()*stage.width() < stage.width()){
							newX = 0 ;
						}else if(newX < stage.width() - (stage.scaleX() * stage.width())){
							newX = stage.width() - (stage.scaleX() * stage.width());
						}
						var newY = stage.y();
						if(stage.y() > 0 || stage.scaleY() * stage.height() < stage.height()){
							newY = 0 ;
						}else if(newY < stage.height() - (stage.scaleY() * stage.height())){
							newY = stage.height() - (stage.scaleY() * stage.height());
						}
						stage.x(newX);
						stage.y(newY);
						stage.draw();
					}
				});
				
			
			function initStage(option){
				stage.scaleX(getRootWidth()/sceneWidth);
				stage.scaleY(getRootWidth()/sceneWidth);
			}
			
			
			
			$scope.$watchCollection('view', 
				function(newVals, oldVals) {
					if (!newVals) return;
					sceneWidth = newVals.width;
					sceneHeight = newVals.height;
					initStage(newVals);
					for(var i = 0, len = newVals.layers.length ; i < len;i++){
						var map = initMapLayer(newVals.layers[i]);
					}
					initForegrid(stage,newVals);
					stage.draw();
					return ;
				}, true);
			
			
			$scope.$watch('toggledLayers', function(newVals, oldVals) {
				if (newVals==undefined) return;
				for(var i=0;i<newVals.length;i++){
					if(mapLayers[i]!=undefined){
						mapLayers[i].visible(newVals[i]);
					}
				}
				background.draw();
				return ;
			}, true);
			
			
			var focused;
			
			// generate hexes
			function initMapLayer(layerData){
				var mapLayer = new Konva.Group({x:0,y:0,width:sceneWidth,height:sceneHeight,listening : false});
				background.add(mapLayer);
				updateMapLayer(mapLayer,layerData);
				mapLayers.push(mapLayer);
				$scope.$watch(layerData, function(newVals, oldVals) {
					if (newVals==undefined) return;
					updateMapLayer(mapLayer,newVals);
					background.draw();
					return ;
				}, true);
			};
			
			function updateMapLayer(mapLayer,layer){
				mapLayer.destroyChildren();
				switch(layer.type){
					case 'base':{
						for(var p in layer.points){
							var curr = layer.points[p];
							var poly=new Konva.RegularPolygon({
								id: p,
								q:curr.q,
								r:curr.r,
								x: curr.x,
								y: curr.y,
								sides: 6,
								stroke:'black',
								strokeWidth:0.2,
								radius: curr.radius,
								fill : curr.fill
							});
							mapLayer.add(poly);
						}
						break;
					};
					case 'terrain':{
						for(var p in layer.points){
							var curr = layer.points[p];
							mapLayer.add(new Konva.RegularPolygon({
								id: p,
								sides: 6,
								x: curr.x,
								y: curr.y,
								radius:5,
								fill:'red'
							}));
						}
						break;
					};
					case 'border':{
						for(var p in layer.points){
							var curr = layer.points[p];
							mapLayer.add(new Konva.Line({
								id: p,
								points:[curr.a_x,curr.a_y,curr.b_x,curr.b_y],
								stroke: curr.fill,
								strokeWidth: 2,
							}));
						}
						break;
					};
					case 'building':{
						for(var p in layer.points){
							var curr = layer.points[p];
							mapLayer.add(new Konva.RegularPolygon({
								id: p,
								x: curr.x,
								y: curr.y,
								sides: 6,
								radius: curr.radius,
								fillPatternImage: curr.fill
							}));
						}
						break;
					};
				};
				if(mapLayer.hasChildren())
					mapLayer.cache();
			}
			
			var foregridBuffer = new Konva.Group();
			var foregridHex = new Konva.Group();
			var foregridPoint = new Konva.Group();
			var foregridGroup = new Konva.Group();
			var cursorHex = new Konva.Group();
				
			function initForegrid(stage,values){
				foreground.add(foregridBuffer);
				foreground.add(cursorHex);
				foregridGroup.add(foregridPoint);
				foregridGroup.add(foregridHex);
				foreground.add(foregridGroup);
				
				function updateBrush(newVals, oldVals) {
					if (newVals==undefined) return;
					cursorHex.destroyChildren();
					for(var i=0,len=newVals.length; i<len; i++){
						var poly = new Konva.RegularPolygon({
							id: newVals[i].q+":"+newVals[i].r,
							x: values.RADIUS * Math.SQRT3 * (newVals[i].q + newVals[i].r/2),
							y: values.RADIUS * 3/2 * newVals[i].r,
							sides: 6,
							opacity:0.5,
							radius: values.RADIUS,
							fill: 'grey'
						});
						cursorHex.add(poly);
					}
					cursorHex.cache();
					foreground.draw();
					return ;
				}
			
				function upadteSelectedLayer(newVals, oldVals) {
					if (newVals==undefined) return;
					switch($scope.data.map.layers[newVals].type){
						case 'base':{
							foregridHex.visible(true);
							foregridPoint.visible(false);
							break;
						};
						case 'terrain':{
							foregridHex.visible(true);
							foregridPoint.visible(false);
							break;
						};
						case 'border':{
							foregridHex.visible(false);
							foregridPoint.visible(true);
							break;
						};
						case 'building':{
							foregridHex.visible(true);
							foregridPoint.visible(false);
							break;
						};
					};
					foreground.draw();
					return ;
				}
				
				function foregridGroup_mouseover(evt) {
					var target = evt.target;
					var coord=evt.target.id().split(':');
					var Q = parseInt(coord[0]);
					var R = parseInt(coord[1]);
					cursorHex.x(target.x());
					cursorHex.y(target.y());
					foreground.draw();
					$scope.focused=coord;
					$scope.$apply();
				}
				
				function foregridGroup_mouseout(evt) {
					foreground.draw();
				}
				
				function foregridHex_click_tap_mousedown(evt){
					console.log(editState);
					var target = evt.target;
					var coord=evt.target.id().split(':');
					var Q = parseInt(coord[0]);
					var R = parseInt(coord[1]);
					switch(editState){
						case 'edit':{
							var result = $scope.applyBrush((Q-R)/3,(Q+2*R)/3);
							for(var i=0,len=result.length; i<len; i++){
								var f=bufferLayer.findOne('#'+result[i].id)
								if(f==undefined){
									var poly = new Konva.RegularPolygon({
										q:result[i].q,
										r:result[i].r,
										id: result[i].id,
										x: values.RADIUS + values.RADIUS * Math.SQRT3 * (result[i].q + result[i].r/2),
										y: values.RADIUS + values.RADIUS * 3/2 * result[i].r,
										sides: 6,
										opacity: 0.5,
										radius: values.RADIUS,
										stroke: 'red',
										strokeWidth: 1,
										fill: result[i].fill
									});
									bufferLayer.add(poly);
								}else{
									f.fill(result[i].fill);
								}
							}
							bufferLayer.draw();
							break;
						}
						case 'remove':{
							var result = $scope.applyBrush((Q-R)/3,(Q+2*R)/3);
							for(var i=0,len=result.length; i<len; i++){
								var f=bufferLayer.findOne('#'+result[i].id)
								if(f!=undefined){
									f.destroy();
								}
							}
							bufferLayer.draw();
							break;
						}
					}				
				}
				
				for(var q = -1; q < (values.hWidth)*2+1; q++){
					for(var r = -1- Math.floor(q/2); r < (values.hHeight*3/2)- Math.floor(q/2); r++){
						var x = values.RADIUS + values.RADIUS/Math.SQRT3 * 3/2* q;
						var y = values.RADIUS + values.RADIUS *(r+q/2);
						var radius = values.RADIUS-1;
						foregridPoint.add( new Konva.Circle({
							id: q+":"+r,
							x: x,
							y: y,
							radius: 5,
							opacity:0.1,
							fill: 'red'
						}));
						if(((q-r)/3)%1 == 0 && ((q+2*r)/3)%1 == 0){
							foregridHex.add( new Konva.RegularPolygon({
								id: q+":"+r,
								q: q,
								r: r,
								x: x,
								y: y,
								sides: 6,
								radius: radius,
								opacity:0.1,
								fill: 'grey'
							}));
						}
					}
				}
				
				foregridGroup.on('mouseover', foregridGroup_mouseover);
				foregridGroup.on('mouseout', foregridGroup_mouseout);
				foregridHex.on('mousedown',foregridHex_click_tap_mousedown);
				
				foregridPoint.cache();
				foregridHex.cache();
				
				$scope.$watch('selectedLayer', upadteSelectedLayer, true);
				$scope.$watch('brush', updateBrush, true);
			}
		}
	};
});

app.directive('editorMap', ['socket',function(socket) {
	return {
		restrict:'E',
		templateUrl: 'templates/edt-map.html',
		controller:function($scope,$routeParams,$location){
			var option={RADIUS:15};
			if($routeParams.id != -1){
				socket.once('resMapData',function(data){
					$scope.data=data;
				});
				socket.emit('getMapData',$routeParams.id);
			}else{
				var map = new Hexmap.Map({width:100,height:100});
				map.DummyMap();
				$scope.data ={
					name : "name",
					map : map
				};
			}
			$scope.focused={};
			$scope.toggledLayers=[true,true,true,true];
			$scope.selectedLayer=0;
			$scope.toggleLayer=function(i){
				$scope.toggledLayers[i]=!$scope.toggledLayers[i];
			};
			$scope.isLayerToggled=function(i){
				return $scope.toggledLayers[i];
			};
			$scope.selectLayer=function(i){
				$scope.selectedLayer = i;
			};
			$scope.modifyLayer=function(d){
				$scope.data.map.layers[d.i].fill(d);
				console.log(d);
			};
			$scope.wipeLayer=function(i){
				$scope.data.map.wipeLayerLayer(i);
			};
			$scope.save=function(){
				socket.emit('save_map',$scope.data);
				if($routeParams.id == -1){
					socket.once('resMapData',function(data){
						$location.path('/map/'+data._id);
					});
				}
			}
			$scope.applyBrush = function(q,r){
				var brush=$scope.brush;
				var result=[];
				for(var i=0,len=brush.length; i<len; i++){
					result.push( {
							id: (brush[i].q+q)+":"+(brush[i].r+r),
							q: brush[i].q+q,
							r: brush[i].r+r,
							fill: 'grey'
						});
				}
				return result;
				
			}
			$scope.$watchCollection('data.map', 
				function(newVals, oldVals) {
					if (!newVals) return;
					$scope.view = Hexmap.getView(newVals, option, Hexmap.defaultConfig);
					return ;
				}, true);
		},
		controllerAs:"map"
	};
}]);
})();