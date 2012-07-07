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

				var self = this
					,el = $('<div>' + template.render() + '</div>')
					;

				this.extend( this.options, opts );

				self.set('el', el[0]);

				el.on('click', '.control', function(e){

					e.preventDefault();

					var $this = $(this).toggleClass('active')
						,active = $this.is('.active')
						;

					$this.text( active? 'Exit Fullscreen' : 'Fullscreen' );
					self.emit( 'toggle', active );
				});

				this.emit( 'ready' );
				return this;
			}

		});

		return {
			
			init: function( opts ){

				return FullscreenControl.create().init( opts );
			}
		};
	}
);