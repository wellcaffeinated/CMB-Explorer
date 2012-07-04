define(
	[
		'plugins/async!http://maps.googleapis.com/maps/api/js?sensor=false&libraries=drawing'
		// doesn't seem to need api key: key=AIzaSyDtVrxyniaAXbNuA2d_pjFdBmzOQJD1bHY
	],
	function(
		
	){

		return google.maps;
	}
);