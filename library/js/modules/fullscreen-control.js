// build control for user structures 
define(
	[
		'jquery',
		'plugins/tpl!templates/fullscreen-control.tpl'
	],
	function(
		$,
		template
	){

		function FullscreenControl(opts){

			if(!(this instanceof FullscreenControl)){

				return new FullscreenControl(opts);
			}

			this.init(opts);
		}

		FullscreenControl.prototype = {

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


				this.el = $('<div>' + template.render() + '</div>');

				this.el.on('click', '.control', function(e){

					e.preventDefault();

					var $this = $(this).toggleClass('active')
						,active = $this.is('.active')
						;

					$this.text( active? 'Exit Fullscreen' : 'Fullscreen' );
					self.mediator.publish( '/fullscreen-control/toggle', active );
				});
			},

			getEl: function(){

				return this.el[0];
			}
		};

		return FullscreenControl;
	}
);