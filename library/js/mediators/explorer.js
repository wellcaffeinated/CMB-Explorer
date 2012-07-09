define(
    [
        'jquery',
        'stapes',
        'google/maps',
        'modules/celestial-model',
        'modules/marker-manager',
        'modules/map-chooser',
        'modules/build-control',
        'modules/fullscreen-control',
        'modules/search-control'
    ],
    function(
        $,
        Stapes,
        gm,
        CelestialModel,
        MarkerManager,
        MapChooser,
        BuildControl,
        FullscreenControl,
        SearchControl
    ){
        'use strict';

        var icons = {
            messier: 'http://www.bigbangregistry.com/panojs3/images/dot_blue_20px.png',
            user: 'http://www.bigbangregistry.com/panojs3/images/dot_brown_20px.png'
        };

        var explorer = Stapes.create().extend({

            init: function(){

                var self = this
                    ,mapId = 'explorer'
                    ,mapOptions = {
                            center: new gm.LatLng(77, -120),
                            zoom: 5,
                            minZoom: 2,
                            maxZoom: 5,
                            mapTypeControl: false,
                            streetViewControl: false,
                            panControl: false,
                            overviewMapControl: true,
                            overviewMapControlOptions: {
                                opened: true
                            }
                        }
                    ;

                this.initEventHandlers();

                // wait for dom ready
                $(function(){

                    var el = document.getElementById( mapId );
                    
                    // create map
                    self.set('map', new gm.Map(el, mapOptions));

                    // broken
                    /*limitBounds(map, new gm.LatLngBounds(
                        new google.maps.LatLng(0, -179.99999, true),
                        new google.maps.LatLng(85.05, 179.99999, true)
                    ));*/
                });
            },

            initEventHandlers: function(){

                var self = this
                    ;

                this.on({
                    
                    'fullscreen': function( active ){
                        
                        $('body').toggleClass('fullscreen', active);
                        gm.event.trigger( self.get('map'), 'resize' );
                    },

                    'create:map': function( map ){

                        // create map frame
                        map.controls[ gm.ControlPosition.TOP_LEFT ].push( $('<div id="map-frame"><div class="top"></div><div class="right"></div><div class="bottom"></div><div class="left"></div></div>')[0] );

                        self.initMapTypes();
                        self.initModules();
                    },

                    'types_ready': self.initMapChooser

                });
            },

            initModules: function(){

                this.initMessierMarkers();
                this.initFullscreenControl();
                this.initBuildControl();
            },

            initMapTypes: function(){

                var self = this
                    ,map = self.get('map')
                    ,typeList = [
                            {id: 'geo', name: 'Geography', tilesDir: 'tiles1/'},
                            {id: 'infra', name: 'Infrared', tilesDir: 'tiles2/'},
                            {id: 'mic', name: 'Microwave', tilesDir: 'tiles3/'}
                        ]
                    ;

                function numberPad(num, size) {
                    var s = num+"";
                    while (s.length < size) s = "0" + s;
                    return s;
                }

                // Normalizes the coords that tiles repeat across the x axis (horizontally)
                // like the standard Google map tiles.
                function getNormalizedCoord(coord, zoom) {
                    var y = coord.y;
                    var x = coord.x;

                    // tile range in one direction range is dependent on zoom level
                    // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
                    var tileRange = 1 << zoom;

                    // don't repeat across y-axis (vertically)
                    if (y < 0 || y >= (tileRange>>1)) {
                        return null;
                    }

                    // repeat across x-axis
                    if (x < 0 || x >= tileRange) {
                        return null; //x = (x % tileRange + tileRange) % tileRange;
                    }

                    return {
                        x: x,
                        y: y
                    };
                }

                map.setOptions({
                    mapTypeControlOptions: {
                        style: gm.MapTypeControlStyle.HORIZONTAL_BAR,
                        mapTypeIds: Stapes.util.map(typeList, function(el){ return el.id; }) // map doesn't mean google map.
                    }
                });

                for(var i = 0, l = typeList.length; i < l; i++){

                    // scope it so variables don't get messed...
                    !function(mapType){

                        map.mapTypes.set( mapType.id, new gm.ImageMapType({

                            getTileUrl: function(coord, zoom) {

                                var normalizedCoord = getNormalizedCoord(coord, zoom);
                                
                                if (!normalizedCoord) {

                                    return null;
                                }

                                var bound = Math.pow(2, zoom-1);

                                return 'http://data.bigbangregistry.com/panojs3/' + mapType.tilesDir +
                                    'tile__'+ numberPad(5-zoom,3) +
                                    '_' + numberPad(normalizedCoord.x,3) + 
                                    '_' + numberPad(normalizedCoord.y,3) + '.jpg';
                            },
                            tileSize: new gm.Size(256, 256),
                            maxZoom: 5,
                            minZoom: 1,
                            //radius: 1738000,
                            name: mapType.name
                        }));

                    }(typeList[i]);
                }

                // first map first...
                map.setMapTypeId( typeList[0].id );

                self.emit( 'types_ready', typeList );

            },

            initMapChooser: function( typeList ){

                var self = this
                    ,el
                    ,map = self.get('map')
                    ,mc = MapChooser.init({
                            layout: {
                                maps: typeList
                            }
                        })
                    ;

                mc.on('chosen', function( id ){

                    map.setMapTypeId( id );

                });

                map.controls[ gm.ControlPosition.LEFT_CENTER ].push( mc.get('el') );
            },

            // @TODO: make this MVC!!!
            initMessierMarkers: function(){

                var map = this.get('map')
                    ,model
                    ,markers
                    ,search
                    ;

                // messier data model
                model = CelestialModel.init({

                    url: 'data/messier.json',
                    idKey: 'name'

                });

                // marker renderer (view)
                markers = MarkerManager.init({
                    markerDefaults: {
                        icon: icons.messier,
                        shape: {coords:[0,0,0], type:'circle'}, // so icons don't disturb map drag
                        draggable: false,
                        raiseOnDrag: false,
                        labelAnchor: new gm.Point(22, 0),
                        labelClass: 'messier-label'
                    },

                    model: model,
                    map: this.get('map')

                });

                // search control
                search = SearchControl.init({});

                search.on({

                    'autocomplete': function( val, callback ){

                        search.set('results', model.find( 'name', val, true ) );
                    },

                    'search': function( feature ){

                        markers.focusTo( feature );

                    }
                });

                map.controls[ gm.ControlPosition.TOP_CENTER ].push( search.get('el') );

                this.set( 'search_view', search );
                this.set( 'messier_model', model );
                this.set( 'messier_view', markers );
            },

            initFullscreenControl: function(){

                var self = this
                    ,map = self.get('map')
                    ,el
                    ,fc = FullscreenControl.init()
                    ;

                fc.on('toggle', function( active ){

                    self.emit( 'fullscreen', active );
                });

                map.controls[ gm.ControlPosition.TOP_RIGHT ].push( fc.get('el') );
            },

            initBuildControl: function(){

                var self = this
                    ,map = self.get('map')
                    ,drawingManager = new gm.drawing.DrawingManager({
                            //drawingMode: gm.drawing.OverlayType.MARKER,
                            drawingControl: false,
                            drawingControlOptions: {
                                position: gm.ControlPosition.BOTTOM_LEFT,
                                drawingModes: [gm.drawing.OverlayType.MARKER]
                            },
                            markerOptions: {
                                icon: new gm.MarkerImage( icons.user ),
                                animation: gm.Animation.DROP
                            }
                        })
                    ,bc = BuildControl.init()
                    ;

                drawingManager.setMap( map );

                bc.on('toggle', function( active ){

                    var mode = active? 
                            gm.drawing.OverlayType.MARKER : 
                            null
                            ;

                    drawingManager.setDrawingMode( mode );
                });

                map.controls[ gm.ControlPosition.BOTTOM_LEFT ].push( bc.get('el') );

                // map click
                gm.event.addListener(drawingManager, 'overlaycomplete', function( event ) {

                    var infowindow = new gm.InfoWindow({

                        content: 'Amazing - You just built a new home!<br/>' +
                            '<br/>How about giving it a name?'+
                            '<br/><input type="text" placeholder="Awesome name here..." class="new-home-name"/>'+
                            '<br/><button class="new-home-btn">Name This Feature!</button>(small donation requested)'
                    });
                    
                    infowindow.open( map, event.overlay );

                    gm.event.addListenerOnce(infowindow, 'closeclick', function(){

                        // remove it
                        event.overlay.setMap( null );
                    });

                });
            }



        });

        // BROKEN
        function limitBounds( map, bounds ){
            new gm.Rectangle({
                bounds: bounds,
                strokeColor: 'red',
                strokeWeight: 2,
                map: map
            });
            var lastValidCenter = map.getCenter()
                ,b
                ,ne
                ,sw
                ;

            function centerChanged() {

                b = map.getBounds();
                // if the union of allowed bounds and map's current bounds is equal to allowed bounds
                // then the map is inside allowed bounds
                if (
                    bounds.contains( ne = b.getNorthEast() ) && 
                    bounds.contains( sw = b.getSouthWest() ) &&
                    ne.lng() > sw.lng()
                    // sw.lng() > bounds.getSouthWest().lng() &&
                    // ne.lng() < bounds.getNorthEast().lng()

                ) {
                    // still within valid bounds, so save the last valid position
                    lastValidCenter = map.getCenter();
                    return; 
                }

                // not valid anymore => return to last valid position
                map.panTo(lastValidCenter);
            }

            gm.event.addListener(map, 'center_changed', centerChanged);
            gm.event.addListener(map, 'zoom_changed', function(){

                gm.event.addListenerOnce(map, 'idle', function(){

                    var c = map.getCenter();
                    b = map.getBounds().toSpan();
                    console.log(b.toString())
                    // adjustment to north
                    var n = Math.max( c.lat() + b.lat()/2 - bounds.getNorthEast().lat(), 0 );
                    var s = Math.min( c.lat() - b.lat()/2 - bounds.getSouthWest().lat(), 0 );
                    var e = Math.max( c.lng() + b.lng()/2 - bounds.getNorthEast().lng(), 0 );
                    var w = Math.min( c.lng() - b.lng()/2 - bounds.getSouthWest().lng(), 0 );

                    console.log(c.lat(), c.lng(), b.lat(), b.lng());
                    console.log(bounds.getNorthEast().lng(), bounds.getSouthWest().lng())
                    lastValidCenter = new gm.LatLng(c.lat() - n - s, c.lng() - e - w);
                    console.log(n, e, s, w)
                    map.panTo(lastValidCenter);
                });
            });
        }
        
        explorer.init();
    }
);