// build control for user structures 
define(
	[
		'jquery',
		'plugins/tpl!templates/build-control.tpl'
	],
	function(
		$,
		template
	){

		function BuildControl(opts){

			if(!(this instanceof BuildControl)){

				return new BuildControl(opts);
			}

			this.init(opts);
		}

		BuildControl.prototype = {

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

					var $this = $(this).toggleClass('active');

					self.mediator.publish( '/build-control/toggle', $this.is('.active') );
				});
			},

			getEl: function(){

				return this.el[0];
			}
		};

		return BuildControl;
	}
);