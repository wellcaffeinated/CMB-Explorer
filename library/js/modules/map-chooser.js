// chooser for map types 
define(
	[
		'jquery',
		'plugins/tpl!templates/map-chooser.tpl'
	],
	function(
		$,
		template
	){

		function MapChooser(opts){

			if(!(this instanceof MapChooser)){

				return new MapChooser(opts);
			}

			this.init(opts);
		}

		MapChooser.prototype = {

			init: function(opts){

				var self = this;

				// only run once
				this.init = null;

				this.options = $.extend({
					//defaults
					mediator: null

				}, opts);

				this.mediator = this.options.mediator;

				if (!this.mediator)
					throw "No mediator specified.";


				this.el = $('<div>' + template.render( this.options.layout ) + '</div>');

				this.el.on('click', '.control', function(e){

					e.preventDefault();

					self.mediator.publish( '/map-chooser/chosen', $(this).attr('data-map-id') );
				});
			},

			getEl: function(){

				return this.el[0];
			}
		};

		return MapChooser;
	}
);