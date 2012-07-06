// build control for user structures 
define(
	[
		'jquery',
		'stapes',
		'plugins/tpl!templates/fullscreen-control.tpl'
	],
	function(
		$,
		Stapes,
		template
	){
		'use strict';

		var FullscreenControl = Stapes.create().extend({

			options: {

			},

			init: function( opts ){
				
				this.extend( this.options, opts ).emit( 'ready' )
				return this;
			}
		});

		FullscreenControl.on('ready', function(){

			var self = this
				,el = $('<div>' + template.render() + '</div>')
				;

			self.set('el', el[0]);

			el.on('click', '.control', function(e){

				e.preventDefault();

				var $this = $(this).toggleClass('active')
					,active = $this.is('.active')
					;

				$this.text( active? 'Exit Fullscreen' : 'Fullscreen' );
				self.emit( 'toggle', active );
			});
		});

		return FullscreenControl;
	}
);