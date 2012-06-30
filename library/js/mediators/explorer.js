define(
    [
        'jquery',
        'google/maps',
        'data/messier'
    ],
    function(
        $,
        gm,
        messier
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
                    streetViewControl: false,
                    mapTypeControlOptions: {

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
                
                m = new gm.Marker({
                        title: entry.title,
                        position: pos,
                        icon: icons.messier
                    });

                m.setMap(map);
            }
            
        }
        
        $(function(){

            var el = document.getElementById( mapId );
            
            // create map
            var map = new gm.Map(el, mapOptions);
            map.mapTypes.set('geo', geoMapType);
            map.mapTypes.set('infra', infraMapType);
            map.mapTypes.set('mic', micMapType);
            map.setMapTypeId('geo');

            gm.event.addListener(map, 'projection_changed', function(){
                
                initMessierMarkers(map);
            });

            var drawingManager = new gm.drawing.DrawingManager({
                //drawingMode: gm.drawing.OverlayType.MARKER,
                drawingControl: true,
                drawingControlOptions: {
                    position: gm.ControlPosition.TOP_LEFT,
                    drawingModes: [google.maps.drawing.OverlayType.MARKER]
                },
                markerOptions: {
                    icon: new gm.MarkerImage( icons.user ),
                    animation: gm.Animation.DROP
                }
            });
            drawingManager.setMap(map);

            // map click
            gm.event.addListener(drawingManager, 'overlaycomplete', function( event ) {

                var infowindow = new gm.InfoWindow({

                    content: 'Amazing - You just built a new home!<br/>' +
                        '<br/>How about giving it a name?'+
                        '<br/><input type="text" placeholder="Awesome name here..." class="new-home-name"/>'+
                        '<br/><button class="new-home-btn">Name This Feature!</button>(small donation requested)'
                });
                
                infowindow.open( map, event.overlay );

            });
        });
    }
);