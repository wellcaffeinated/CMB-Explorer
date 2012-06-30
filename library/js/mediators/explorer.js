define(
	[
		'jquery',
		'google/maps'
	],
	function(
		$,
		gm
	){
		var mapId = 'explorer'
			,mapOptions = {
					center: new gm.LatLng(0, 0),
					zoom: 2,
					minZoom: 2,
					maxZoom: 6,
					mapTypeId: gm.MapTypeId.ROADMAP
				};
			;
		
		$(function(){

			var el = document.getElementById( mapId );
			
			// create map
			var map = new gm.Map(el, mapOptions);
		});
	}
);