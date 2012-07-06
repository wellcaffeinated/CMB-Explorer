// build control for user structures 
define(
	[
		'jquery',
		'stapes',
		'plugins/tpl!templates/build-control.tpl'
	],
	function(
		$,
		Stapes,
		template
	){
		'use strict';
		
		var BuildControl = Stapes.create().extend({

			options: {

			},

			init: function( opts ){

				this.extend( this.options, opts ).emit( 'ready' )
				return this;
			}
		});

		BuildControl.on('ready', function(){

			var self = this
				,el = $('<div>' + template.render() + '</div>');
				;

			self.set('el', el[0]);

			el.on('click', '.control', function(e){

				e.preventDefault();

				var $this = $(this).toggleClass('active');

				self.emit( 'toggle', $this.is('.active') );
			});
		});

		return BuildControl;
	}
);