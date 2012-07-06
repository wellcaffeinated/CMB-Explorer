// chooser for map types 
define(
	[
		'jquery',
		'stapes',
		'plugins/tpl!templates/map-chooser.tpl'
	],
	function(
		$,
		Stapes,
		template
	){
		'use strict';

		var MapChooser = Stapes.create().extend({

			options: {
				layout: {}
			},

			init: function( opts ){

				this.extend( this.options, opts ).emit( 'ready' )
				return this;
			}
		});

		MapChooser.on('ready', function(){

			var self = this
				,el = $('<div>' + template.render( self.options.layout ) + '</div>');
				;

			self.set('el', el[0]);

			el.on('click', '.control', function(e){

				e.preventDefault();

				self.emit( 'chosen', $(this).attr('data-map-id') );
			});
		});

		return MapChooser;
	}
);