define(
	[
		'plugins/callback!_googleMaps:http://maps.googleapis.com/maps/api/js?key=AIzaSyDtVrxyniaAXbNuA2d_pjFdBmzOQJD1bHY&sensor=false&libraries=drawing&callback=_googleMaps#'
	],
	function(
		
	){

		return google.maps;
	}
);