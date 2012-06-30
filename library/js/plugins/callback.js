define(function(){

	function parse( n ){
		var p = n.split(':');
		return {
			callback: p.shift(),
			resource: p.join(':')
		}
	}

	return {
		normalize: function (name, normalize){

			var parsed = parse(name);
			return parsed.callback + ':' + normalize(parsed.resource);
		},

		load: function(name, req, load, config){

			var parsed = parse(name);

			window[parsed.callback] = load;
			req([parsed.resource]);
		}	
	};
});