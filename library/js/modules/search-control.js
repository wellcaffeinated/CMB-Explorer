// search control for autocompleting to find features
define(
	[
		'jquery',
		'stapes',
		'modules/autocomplete',
		'plugins/tpl!templates/search-control.tpl'
	],
	function(
		$,
		Stapes,
		autocomplete,
		template
	){
		'use strict';

		var SearchControl = Stapes.create().extend({

			options: {

				minQueryLength: 1
			},

			init: function( opts ){

				var self = this
					,el = $('<div>' + template.render() + '</div>')
					;

				this.extend( this.options, opts );

				self.set('el', el[0]);

				self.autocomplete = autocomplete({

					el: el.find('input.control'),
					wrapper: el.find('.search-control'),
					minQueryLength: self.options.minQueryLength,
					usePartialComplete: false,
					hintOnFocus: false,

					fetch: function( val, callback ){

						function watchForResults( results ){

							self.off( 'change:results', watchForResults );

							callback( {results: results} );
						}

						self.on( 'change:results', watchForResults );

						self.emit( 'autocomplete', val );
					},

					submit: function(){

						self.emit( 'search', $(this).val() );
					}


				});

				this.emit( 'ready' );
				return this;
			}

		});

		return {
			
			init: function( opts ){

				return SearchControl.create().init( opts );
			}
		};
	}
);