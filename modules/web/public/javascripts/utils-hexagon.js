if( Utils == undefined )
	var Utils={};

(function(){
this.Hexagon = function(data){
	Konva.RegularPolygon.apply(this,data);
	this.q = data.q;
	this.r = data.r;
}
this.Hexagon.prototype = Konva.RegularPolygon.prototype;
this.Hexagon.prototype.constructor = this.Hexagon;

}).call(Utils);