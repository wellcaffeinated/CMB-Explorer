define(
	[
		'require',
		'stapes'
	],
	function(
		require,
		Stapes
	){
		'use strict';

		var model = Stapes.create().extend({

			options: {

				url: null, // specify this at init
				fetch: true, // fetch on init
				filter: null, // filter function for data retrieval
				idKey: 'id' // @TODO to implement
			},

			init: function( opts ){

				this.extend( this.options, opts );

				if ( this.options.fetch && this.options.url ){

					this.fetch();
				}

				this.emit( 'ready' );
				return this;
			},

			fetch: function( url, retryDelay ){

				var self = this
					;

				url = url || self.options.url;

				// just deal with json for now...
				require([ 'plugins/json!'+url ], function( data ){

					if ( self.options.filter ){

						data = self.options.filter( data );
					}

					self.add( data );

					self.emit('fetch');

				}, function(){
					// error callback
					retryTimeout = ~~retryTimeout + 1;

					setTimeout(function(){

						self.fetch( url, retryTimeout );
						// grow the delay every time it tries
					}, Math.pow(2,retryTimeout)*1000);
				});

				return this;
			},

			/**
			 * Find property `prop` in data equal to `val`.
			 * If `fuzzy` is true, search strings for similar (not necessarily equal) strings.
			 */
			find: function( prop, val, fuzzy ){

				var self = this
					,v
					,fn = (Stapes.util.typeOf(prop) === 'function')? prop : function( item ){

							v = item[ prop ];
							
							return (fuzzy && Stapes.util.typeOf(v) === 'string')? 
								v.indexOf( val ) > -1 : // search substr
								v === val // exact search
								;
						}
					;

				return this.filter( fn );
			},

			add: function( data ){

				var self = this
					,id = self.options.idKey
					;

				switch( Stapes.util.typeOf( data ) ){

					case 'object':

						self.set( data );

					break;
					case 'array':

						if ( 
							Stapes.util.typeOf( data[0] ) === 'object' && 
							Stapes.util.typeOf( data[0][id] ) !== 'undefined'
						){

							Stapes.util.each(data, function( val ){

								self.set( val[id], val );
							});	
						} else {

							self.push( data );
						}

					break;
					default:

						self.push( data );
				}

				return this;
			},

			// remove all data
			flush: function(){

				this.remove(function(){

					return true;
				});

				return this;
			}
		});

		return {

			init: function( opts ){

				return model.create().init( opts );				
			}
		};
	}
);