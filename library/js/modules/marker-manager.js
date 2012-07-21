define(
	[
		'stapes',
		'google/maps',
		'util/gm-label-marker'
	],
	function(
		Stapes,
		gm,
		MarkerWithLabel
	){

		var MarkerManager = Stapes.create().extend({

			options: {

				map: null,

				markerDefaults: {

				}
			},

			init: function( opts ){

				this.extend( this.options.markerDefaults, opts.markerDefaults );
				opts.markerDefaults = this.options.markerDefaults;
				this.extend( this.options, opts );

				this.initModel( this.options.model );

				this.emit( 'ready' );
				return this;
			},

			initModel: function( model ){

				if (!model) return this;

				var self = this
					,map = self.options.map
					,proj = map.getProjection()
					;

				// monitor projection to see when it's ready
                if ( !proj ){

                    gm.event.addListenerOnce(map, 'projection_changed', function(){
                        
                        self.initModel( model );
                    });

                    return this;
                }

				this.model = model;
				
				// add markers for bodies already in model				
				model.each(function( entry, id ){

					var pos = proj.fromPointToLatLng(new gm.Point(entry.x, entry.y), true)
                        ,m
                        ;

                    self.addMarker(id, {

	                    position: pos,
	                    title: entry.name,
	                    labelContent: entry.name
	                    
	                });

				});

				// monitor for changes
				model.on({

                    'create': function( id ){

                        var entry = this.get( id )
                            ,pos = new gm.LatLng(entry.lat, entry.lng)
                            ,m
                            ;

                        self.addMarker( id, {

		                    position: pos,
		                    title: entry.name,
		                    labelContent: entry.name
		                    
		                });
                    },

                    'change': function( id ){

                        if(!self.has( id )) return;

                        var entry = this.get( id )
                            // @TODO: isn't a good projection (i think)
                            ,pos = proj.fromPointToLatLng(new gm.Point(entry.x, entry.y), true)
                            ;

                        self.get( id ).setPosition( pos );
                    },

                    'remove': function( id ){

                        self.get( id ).setMap( null );
                        self.remove( id );
                    }
                });
				
				return this;
			},

			focusTo: function( id ){

				var m = this.get( id )
					,map = this.options.map
					,pos
					,l
					;

				if (!m || !map) return this;

				pos = m.getPosition();
				l = pos.lng()+180;
				pos = new gm.LatLng(pos.lat(), (l < 0 ? l%360+360 : l%360) - 180, true);
				
				// wrap around so lng() stays within the range (-180,180)
				map.setCenter( pos );
				map.setZoom( 5 );

				return this;
			},

			addMarker: function( id, opts ){

				// parse settings
				var settings = Stapes.util.clone( this.options.markerDefaults )
					,m
					;

				Stapes.util.each(opts, function( val, key ){

					if (val) settings[ key ] = val;
				});
				
				// create the marker
				m = new MarkerWithLabel( settings );

				// put marker on map
                m.setMap( this.options.map );

                // so labels don't disturb map drag... this is a bit sketchy because
                // it's accessing something "private"... but meh.
                gm.event.clearListeners(m.label.eventDiv_);

                // store marker
                this.set( id, m );
			}

		});
		
		return {

			init: function( opts ){

				return MarkerManager.create().init( opts );				
			}
		};
	}
);