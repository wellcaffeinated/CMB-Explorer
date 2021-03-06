/*!
 * Mediator implementation
 */
define(
	[
		'jquery'
	],
	function(
		$
	){

		var topics = {};
		var proxyCache = {};
		
		/**
		 * Create/retrieve pubsub instance around channel ID.
		 *
		 * @function pubsub
		 * @param {string} id Pubsub instance ID.
		 * @return {object} pubsub API for current instance with ID `id`.
		 */
		var pubsub = function( id ) {
			
			var callbacks
				,method
				,topic
				;
			
			if ( id.length ) {
				
				topic = topics[ id ];
			}
			
			if ( !topic ) {
				
				callbacks = $.Callbacks();
				
				topic = {
					
					/**
					 * Publish to the current channel.
					 *
					 * @method publish
					 * @param {mixed} arg1...[argN] Any number of arguments to pass to the callback.
					 * @returns {void}
					 */
					publish: callbacks.fire,
					
					/**
					 * Subscribe a callback function to the current channel.
					 *
					 * @method subscribe
					 * @param {function(arg1 [,...argN)]} callback Callback function (or array of functions) that accepts arguments passed by the publish method.
					 * @returns {void}
					 */
					subscribe: callbacks.add,
					
					/**
					 * Unsubscribe a callback from the current channel.
					 *
					 * @method unsubscribe
					 * @param {function(arg1 [,...argN)]} callback Callback function (or array of functions) previously subscribed via `.subscribe()`.
					 * @returns {void}
					 */
					unsubscribe: callbacks.remove
				};
				
				if ( id ) {
					topics[ id ] = topic;
				}
			}

			return topic;
		};

		var API = {

			publish: function( ch, args ){

				var obj = pubsub( ch );
				obj.publish.apply( obj, Array.prototype.splice.call(arguments,1) );
				return this;
			}

			,subscribe: function( ch, chOrFn ){

				if ( typeof chOrFn === 'string' ){

					proxyCache[chOrFn] = proxyCache[chOrFn] || $.proxy(pubsub(chOrFn), 'publish');
					pubsub( ch ).subscribe( proxyCache[chOrFn] );

				} else {

					pubsub( ch ).subscribe( chOrFn );
				}

				return this;
			}

			,unsubscribe: function( ch, chOrFn ){

				if ( typeof chOrFn === 'string' ){

					proxyCache[chOrFn] = proxyCache[chOrFn] || $.proxy(pubsub(chOrFn), 'publish');
					pubsub( ch ).unsubscribe( proxyCache[chOrFn] );

				} else {

					pubsub( ch ).unsubscribe( chOrFn );
				}
			}

		};


		return API;
	}
);