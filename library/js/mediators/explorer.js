define(
    [
        'jquery',
        'google/maps',
        'data/messier',
        'modules/mediator',
        'util/gm-label-marker',
        'modules/map-chooser',
        'modules/build-control',
        'modules/fullscreen-control'
    ],
    function(
        $,
        gm,
        messier,
        mediator,
        MarkerWithLabel,
        MapChooser,
        BuildControl,
        FullscreenControl
    ){
        var mapId = 'explorer'
            ,placeMarker = true
            ,icons = {
                messier: 'http://www.bigbangregistry.com/panojs3/images/dot_blue_20px.png',
                user: 'http://www.bigbangregistry.com/panojs3/images/dot_brown_20px.png'
            }
            ,mapOptions = {
                    center: new gm.LatLng(77, -120),
                    zoom: 5,
                    minZoom: 1,
                    maxZoom: 5,
                    mapTypeControl: false,
                    streetViewControl: false,
                    panControl: false,
                    overviewMapControl: true,
                    overviewMapControlOptions: {
                        opened: true
                    },
                    mapTypeControlOptions: {
                        style: gm.MapTypeControlStyle.HORIZONTAL_BAR,
                        mapTypeIds: ['geo', 'infra', 'mic']
                    }
                }
            ,geoMapType = new gm.ImageMapType({

                    getTileUrl: function(coord, zoom) {

                        var normalizedCoord = getNormalizedCoord(coord, zoom);
                        
                        if (!normalizedCoord) {

                            return null;
                        }

                        var bound = Math.pow(2, zoom-1);

                        return 'http://data.bigbangregistry.com/panojs3/tiles1/'+
                            'tile__'+ numberPad(5-zoom,3) +
                            '_' + numberPad(normalizedCoord.x,3) + 
                            '_' + numberPad(normalizedCoord.y,3) + '.jpg';

                        /*"tiles/ilc/wmap_ilc_7yr_v4_200uK_RGB_sos" +
                                "/" + zoom + "/" + normalizedCoord.x + "/" +
                                (bound - normalizedCoord.y - 1) + ".jpg"*/
                    },
                    tileSize: new gm.Size(256, 256),
                    maxZoom: 5,
                    minZoom: 1,
                    //radius: 1738000,
                    name: 'Geography'
                })
            ,infraMapType = new gm.ImageMapType({

                    getTileUrl: function(coord, zoom) {

                        var normalizedCoord = getNormalizedCoord(coord, zoom);
                        
                        if (!normalizedCoord) {

                            return null;
                        }

                        var bound = Math.pow(2, zoom-1);

                        return 'http://data.bigbangregistry.com/panojs3/tiles2/'+
                            'tile__'+ numberPad(5-zoom,3) +
                            '_' + numberPad(normalizedCoord.x,3) + 
                            '_' + numberPad(normalizedCoord.y,3) + '.jpg';

                        /*"tiles/ilc/wmap_ilc_7yr_v4_200uK_RGB_sos" +
                                "/" + zoom + "/" + normalizedCoord.x + "/" +
                                (bound - normalizedCoord.y - 1) + ".jpg"*/
                    },
                    tileSize: new gm.Size(256, 256),
                    maxZoom: 5,
                    minZoom: 1,
                    //radius: 1738000,
                    name: 'Infrared'
                })
            ,micMapType = new gm.ImageMapType({

                    getTileUrl: function(coord, zoom) {

                        var normalizedCoord = getNormalizedCoord(coord, zoom);
                        
                        if (!normalizedCoord) {

                            return null;
                        }

                        var bound = Math.pow(2, zoom-1);

                        return 'http://data.bigbangregistry.com/panojs3/tiles3/'+
                            'tile__'+ numberPad(5-zoom,3) +
                            '_' + numberPad(normalizedCoord.x,3) + 
                            '_' + numberPad(normalizedCoord.y,3) + '.jpg';

                        /*"tiles/ilc/wmap_ilc_7yr_v4_200uK_RGB_sos" +
                                "/" + zoom + "/" + normalizedCoord.x + "/" +
                                (bound - normalizedCoord.y - 1) + ".jpg"*/
                    },
                    tileSize: new gm.Size(256, 256),
                    maxZoom: 5,
                    minZoom: 1,
                    //radius: 1738000,
                    name: 'Microwave'
                })

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

        function initMessierMarkers(map){

            var i
                ,l = messier.length
                ,m
                ,entry
                ,pos
                ,proj = map.getProjection()
                ;

            for(i = 0; i < l; i++){

                entry = messier[i];

                // TODO: isn't a good projection
                pos = proj.fromPointToLatLng(new gm.Point(entry.x, entry.y), true);
                
                // m = new gm.Marker({
                //         title: entry.title,
                //         position: pos,
                //         icon: icons.messier
                //     });
                m = new MarkerWithLabel({
                    position: pos,
                    title: entry.name,
                    icon: icons.messier,
                    labelContent: entry.name,
                    labelAnchor: new google.maps.Point(22, 0),
                    labelClass: 'messier-label'
                });

                m.setMap(map);
            }
            
        }

        // BROKEN
        function limitBounds(map, bounds){
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
        
        function initBuildControl( map ){

            var drawingManager = new gm.drawing.DrawingManager({
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
                ,bc = BuildControl({
                    mediator: mediator
                })
                ;

            drawingManager.setMap( map );

            mediator.subscribe('/build-control/toggle', function( active ){

                var mode = active? 
                        gm.drawing.OverlayType.MARKER : 
                        null
                        ;

                drawingManager.setDrawingMode( mode );
            });

            map.controls[ gm.ControlPosition.BOTTOM_LEFT ].push( bc.getEl() );

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

        function initMapChooser( map ){

            var el
                ,mc = MapChooser({
                        mediator: mediator,
                        layout: {
                            maps: [
                                {id: 'geo', name: 'Geography'},
                                {id: 'infra', name: 'Infrared'},
                                {id: 'mic', name: 'Microwave'}
                            ]
                        }
                    })
                ;

            map.mapTypes.set('geo', geoMapType);
            map.mapTypes.set('infra', infraMapType);
            map.mapTypes.set('mic', micMapType);
            map.setMapTypeId('geo');

            mediator.subscribe('/map-chooser/chosen', function( id ){

                map.setMapTypeId( id );

            });

            el = mc.getEl();
            el.index = 1;
            map.controls[ gm.ControlPosition.LEFT_CENTER ].push( el );
        }

        function initFullscreenControl( map ){

            var el
                ,wrap = $('body')
                ,fc = FullscreenControl({
                        mediator: mediator
                    })
                ;

            mediator.subscribe('/fullscreen-control/toggle', function( active ){

                wrap.toggleClass('fullscreen', active);
                gm.event.trigger( map, 'resize' );
            });

            el = fc.getEl();

            map.controls[ gm.ControlPosition.TOP_RIGHT ].push( el );
        }

        $(function(){

            var el = document.getElementById( mapId );
            
            // create map
            var map = new gm.Map(el, mapOptions);

            initMessierMarkers(map);

            // create map frame
            map.controls[ gm.ControlPosition.TOP_LEFT ].push( $('<div id="map-frame"><div class="top"></div><div class="right"></div><div class="bottom"></div><div class="left"></div></div>')[0] );

            initBuildControl( map );
            initMapChooser( map );
            initFullscreenControl( map );

            // broken
            /*limitBounds(map, new gm.LatLngBounds(
                new google.maps.LatLng(0, -179.99999, true),
                new google.maps.LatLng(85.05, 179.99999, true)
            ));*/
        });
    }
);