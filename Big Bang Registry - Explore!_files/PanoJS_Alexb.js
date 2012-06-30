/*******************************************************************************
 Panoramic JavaScript Image Viewer (PanoJS) 2.0.0
 aka GSV 3.0 aka Giant-Ass Image Viewer 3

 This version of PanoJS has been extensively modified by Alex Yale and Henry Reich in April, 2012.
 
 Generates a draggable and zoomable viewer for images that would
 be otherwise too large for a browser window.  Examples would include
 maps or high resolution document scans.

 History:
   GSV 1.0 : Giant-Ass Image Viewer : http://mike.teczno.com/giant/pan/
   @author Michal Migurski <mike-gsv@teczno.com>

   GSV 2.0 : PanoJS : http://code.google.com/p/panojs/
   @author Dan Allen       <dan.allen@mojavelinux.com>
     
   GSV 3.0 : PanoJS3
   @author Dmitry Fedorov  <fedorov@ece.ucsb.edu> 

 Images must be precut into tiles: 
   a) tilemaker.py python library shipped with GSV 2.0
   b) Zoomify
   c) imagcnv 
   d) Bisque system
   e) dynamically served by websystems (requires writing TileProvider)

 
  var viewerBean = new PanoJS(element, 'tiles', 256, 3, 1);

 Copyright (c) 2005 Michal Migurski <mike-gsv@teczno.com>
                    Dan Allen <dan.allen@mojavelinux.com>
               2010 Dmitry Fedorov, Center for Bio-Image Informatics <fedorov@ece.ucsb.edu>
  
 Redistribution and use in source form, with or without modification,
 are permitted provided that the following conditions are met:
 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 2. The name of the author may not be used to endorse or promote products
    derived from this software without specific prior written permission.
  
 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*******************************************************************************/
 
function PanoJS(viewer, options) {
    
  // listeners that are notified on a move (pan) event
  this.viewerMovedListeners = [];
  // listeners that are notified on a zoom event
  this.viewerZoomedListeners = [];
  // listeners that are notified on a resize event
  this.viewerResizedListeners = [];
    
    
  if (typeof viewer == 'string')
    this.viewer = document.getElementById(viewer);
  else
    this.viewer = viewer;
    
  if (typeof options == 'undefined') options = {};
    
  if (typeof options.tileUrlProvider != 'undefined' && (options.tileUrlProvider instanceof PanoJS.TileUrlProvider) )
    this.tileUrlProvider = options.tileUrlProvider;
  else
    this.tileUrlProvider = new PanoJS.TileUrlProvider( options.tileBaseUri ? options.tileBaseUri : PanoJS.TILE_BASE_URI,
                                                       options.tilePrefix ? options.tilePrefix : PanoJS.TILE_PREFIX,
                                                       options.tileExtension ? options.tileExtension : PanoJS.TILE_EXTENSION
                                                     );

  this.tileSize = (options.tileSize ? options.tileSize : PanoJS.TILE_SIZE);
  this.realTileSize = this.tileSize;
  
  if (options.staticBaseURL) PanoJS.STATIC_BASE_URL = options.staticBaseURL;  
      
  // assign and do some validation on the zoom levels to ensure sanity
  this.zoomLevel = (typeof options.initialZoom == 'undefined' ? -1 : parseInt(options.initialZoom));
  this.maxZoomLevel = (typeof options.maxZoom == 'undefined' ? 0 : Math.abs(parseInt(options.maxZoom)));
  if (this.zoomLevel > this.maxZoomLevel) this.zoomLevel = this.maxZoomLevel;
    
  this.initialPan = (options.initialPan ? options.initialPan : PanoJS.INITIAL_PAN);
    
  this.initialized = false;
  this.surface = null;
  this.well = null;
  this.width = 0;
  this.height = 0;
  this.top = 0;
  this.left = 0;
  this.x = 0;
  this.y = 0;
  this.mark = { 'x' : 0, 'y' : 0 };
  this.pressed = false;
  this.tiles = [];
  this.houseIsMoving = 0;
  
  this.cache = {};
  this.blankTile = options.blankTile ? options.blankTile : PanoJS.BLANK_TILE_IMAGE;
  this.loadingTile = options.loadingTile ? options.loadingTile : PanoJS.LOADING_TILE_IMAGE;      
  this.resetCache();
  this.image_size = { width: options.imageWidth, height: options.imageHeight };
    
  // employed to throttle the number of redraws that
  // happen while the mouse is moving
  this.moveCount = 0;
  this.slideMonitor = 0;
  this.slideAcceleration = 0;
}

// project specific variables
PanoJS.PROJECT_NAME = 'PanoJS';
PanoJS.PROJECT_VERSION = '2.0.0';
PanoJS.REVISION_FLAG = '';

// CSS definition settings
PanoJS.SURFACE_STYLE_CLASS  = 'surface';
PanoJS.SURFACE_ID           = 'viewer_contorls_surface';
PanoJS.SURFACE_STYLE_ZINDEX = 20;
PanoJS.WELL_STYLE_CLASS     = 'well';
PanoJS.CONTROLS_STYLE_CLASS = 'controls'
PanoJS.TILE_STYLE_CLASS     = 'tile';

// language settings
PanoJS.MSG_BEYOND_MIN_ZOOM = 'Cannot zoom out past the current level.';
PanoJS.MSG_BEYOND_MAX_ZOOM = 'Cannot zoom in beyond the current level.';

// defaults if not provided as constructor options
PanoJS.TILE_BASE_URI = 'tiles';
PanoJS.TILE_PREFIX = 'tile-';
PanoJS.TILE_EXTENSION = 'jpg';
PanoJS.TILE_SIZE = 256;
PanoJS.BLANK_TILE_IMAGE = 'blank.gif';
PanoJS.LOADING_TILE_IMAGE = 'blank.gif';
PanoJS.INITIAL_PAN = { 'x' : .13, 'y' : .293 };
PanoJS.USE_LOADER_IMAGE = true;
PanoJS.USE_SLIDE = true;

// dima
if (!PanoJS.STATIC_BASE_URL) PanoJS.STATIC_BASE_URL = '';
PanoJS.CREATE_CONTROLS = true;
PanoJS.CREATE_INFO_CONTROLS = true;
PanoJS.CREATE_OSD_CONTROLS = true;
PanoJS.CREATE_THUMBNAIL_CONTROLS = (isClientPhone() ? false : true);

PanoJS.MAX_OVER_ZOOM = 2;
PanoJS.PRE_CACHE_AMOUNT = 3; // 1 - only visible, 2 - more, 3 - even more

// dima
// The dafault is to pan with wheel events on a mac and zoom on other systems
PanoJS.USE_WHEEL_FOR_ZOOM = (navigator.userAgent.indexOf("Mac OS X")>0 ? true: true);
// the deltas on Firefox and Chrome are 40 times smaller than on Safari or IE
PanoJS.WHEEL_SCALE = (navigator.userAgent.toLowerCase().indexOf('chrome')>-1 ? 1 : 40);

// dima: keys used by keyboard handlers
// right now event is attached to 'document', can't make sure which element is current, skip for now
PanoJS.USE_KEYBOARD = true;
PanoJS.KEY_MOVE_THROTTLE = 15;
//PanoJS.KEY_UP    = 38;
//PanoJS.KEY_DOWN  = 40;
//PanoJS.KEY_RIGHT = 39;
//PanoJS.KEY_LEFT  = 37;
PanoJS.KEY_SHIFT = 16;
PanoJS.KEY_ESC = 27;
//PanoJS.KEY_MINUS = {109:0, 189:0};
//PanoJS.KEY_PLUS  = {107:0, 187:0};

// performance tuning variables
PanoJS.MOVE_THROTTLE = 3;
PanoJS.SLIDE_DELAY = 40;
PanoJS.SLIDE_ACCELERATION_FACTOR = 5;

// the following are calculated settings
PanoJS.DOM_ONLOAD = (navigator.userAgent.indexOf('KHTML') >= 0 ? false : true);
PanoJS.GRAB_MOUSE_CURSOR = (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'pointer' : (document.attachEvent ? 'url(grab.cur)' : '-moz-grab'));
PanoJS.GRABBING_MOUSE_CURSOR = (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'move' : (document.attachEvent ? 'url(grabbing.cur)' : '-moz-grabbing'));
//PanoJS.HOUSE_CURSOR = (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'pointer' : (document.attachEvent ? 'url(house.cur)' : 'url(house.cur)'));
//PanoJS.HOUSE_CURSOR = ('url(/panojs3/images/house.cur) 12 12,default');
PanoJS.HOUSE_CURSOR = ('url(http://data.bigbangregistry.com/panojs3/images/30px_house.png) 12 12,default');
PanoJS.BOAT_CURSOR = ('url(http://data.bigbangregistry.com/panojs3/images/boat.cur) 17 15,default');
PanoJS.NEWMAP = 1;
PanoJS.HOUSE_OFFSET_X = 8;
PanoJS.HOUSE_OFFSET_Y = 8;
PanoJS.BOAT_OFFSET_X = 18;
PanoJS.BOAT_OFFSET_Y = 16;
PanoJS.HOUSE_SIZE = 22;
PanoJS.BOAT_SIZE = 30;
PanoJS.HOUSE_IS_HOUSE = true;
PanoJS.GB_ON = false;
PanoJS.CONTROL_IMAGE_MAP1 = "http://data.bigbangregistry.com/panojs3/images/64px_map.png";
PanoJS.CONTROL_IMAGE_MAP2 = "http://data.bigbangregistry.com/panojs3/images/64px_wise.png";
PanoJS.CONTROL_IMAGE_MAP3 = "http://data.bigbangregistry.com/panojs3/images/64px_wmap.png";

PanoJS.CONTROL_IMAGE_MAP1_OVER = "images/64px_map_over.png";
PanoJS.CONTROL_IMAGE_MAP2_OVER = "images/64px_wise_over.png";
PanoJS.CONTROL_IMAGE_MAP3_OVER = "images/64px_wmap_over.png";
PanoJS.HOUSES_VISIBLE = true;
PanoJS.MESSIER_TOGGLE = true;
PanoJS.COUNTER = 0;
PanoJS.FIRST=true;


PanoJS.prototype.init = function() {

    if (document.attachEvent)
      document.body.ondragstart = function() { return false; }
 
    if (this.width == 0 && this.height == 0) {
      this.width = this.viewer.offsetWidth;
      this.height = this.viewer.offsetHeight;
    }
   
    // calculate the zoom level based on what fits best in window
    if (this.zoomLevel < 0 || this.zoomLevel > this.maxZoomLevel) {
            var new_level = 0;
            // here MAX defines partial fit and MIN would use full fit
            while (this.tileSize * Math.pow(2, new_level) <= Math.max(this.width, this.height) && 
                   new_level<=this.maxZoomLevel) {
                this.zoomLevel = new_level;
                new_level += 1;   
            }
    }
      
    // move top level up and to the left so that the image is centered
    var fullWidth = this.tileSize * Math.pow(2, this.zoomLevel);
    var fullHeight = this.tileSize * Math.pow(2, this.zoomLevel);
    if (this.image_size) {
      var cur_size = this.currentImageSize();  
      fullWidth = cur_size.width;
      fullHeight = cur_size.height;    
    }
    this.x = Math.floor((fullWidth - this.width) * -this.initialPan.x);
    this.y = Math.floor((fullHeight - this.height) * -this.initialPan.y);

       
    // offset of viewer in the window
    for (var node = this.viewer; node; node = node.offsetParent) {
      this.top += node.offsetTop;
      this.left += node.offsetLeft;
    }
        
    // Create viewer elements
    if (!this.surface) {
      this.surface = document.createElement('div');
      this.surface.className = PanoJS.SURFACE_STYLE_CLASS;
      this.surface.id = PanoJS.SURFACE_ID;
      this.viewer.appendChild(this.surface); 
      this.surface.style.cursor = PanoJS.GRAB_MOUSE_CURSOR;
      this.surface.style.zIndex = PanoJS.SURFACE_STYLE_ZINDEX;
    }
     
    if (!this.well) {
      this.well = document.createElement('div');
      this.well.className = PanoJS.WELL_STYLE_CLASS;
      this.viewer.appendChild(this.well);
    }


    // set event handlers for controls buttons
    if (PanoJS.CREATE_CONTROLS && !this.controls)
      this.controls = new PanoControls(this);
         
    if (PanoJS.CREATE_INFO_CONTROLS && !this.info_control) {
      this.info_control = new InfoControl(this);
    }          

    if (PanoJS.CREATE_OSD_CONTROLS && !this.osd_control) {
      this.osd_control = new OsdControl(this);
    }     
  
    if (PanoJS.CREATE_THUMBNAIL_CONTROLS && !this.thumbnail_control) {
      this.thumbnail_control = new ThumbnailControl(this);
    }     
        
    this.prepareTiles();
    this.initialized = true;

    // dima: Setup UI events
    this.ui_listener = this.surface;
    if (isIE()) this.ui_listener = this.viewer; // issues with IE, hack it
    
    this.ui_listener.onmousemove   = callback(this, this.mouseMovedShiftHandler);
    
    this.ui_listener.onmousedown   = callback(this, this.mousePressedHandler);
    this.ui_listener.onmouseup     = callback(this, this.mouseReleasedHandler);
    this.ui_listener.onmouseout    = callback(this, this.mouseReleasedHandler);
    this.ui_listener.oncontextmenu = function() {return false;}; 
    this.ui_listener.ondblclick    = callback(this, this.doubleClickHandler);
    this.ui_listener.onclick       = callback(this, this.singleClickHandler);
    if (PanoJS.USE_KEYBOARD){
      document.onkeydown  = callback(this, this.keyboardHandler);
      document.onkeyup    = callback(this, this.keyboardHandlerUp);
    }
    this.ui_listener.onmousewheel = callback(this, this.mouseWheelHandler);
    // dima: Firefox standard
    if (!('onmousewheel' in document.documentElement))
      this.surface.addEventListener ("DOMMouseScroll", callback(this, this.mouseScrollHandler), false);
        
    // dima: support for HTML5 touch interfaces like iphone and android
    this.ui_listener.ontouchstart    = callback(this, this.touchStartHandler);
    this.ui_listener.ontouchmove     = callback(this, this.touchMoveHandler);
    this.ui_listener.ongesturestart  = callback(this, this.gestureStartHandler);
    this.ui_listener.ongesturechange = callback(this, this.gestureChangeHandler);
    this.ui_listener.ongestureend    = callback(this, this.gestureEndHandler);        
        
    // notify listners
    this.notifyViewerZoomed();    
    this.notifyViewerMoved();  
	
	var zero = {'x':0, 'y':0};
	this.moveHouse(zero);
	
	 //GB_showCenter("Big Bang Registry Cosmic Object Explorer", "/terms.html");
	 
};

PanoJS.prototype.viewerDomElement = function() {    
    return this.viewer;
};

PanoJS.prototype.thumbnailURL = function() {       
  if (PanoJS.NEWMAP==1){    return this.tileUrlProvider.assembleUrl(0, 0, 0, 1);}
  else {
    if (PanoJS.NEWMAP==2){return this.tileUrlProvider.assembleUrl(0, 0, 0, 2);}
    else{
      return this.tileUrlProvider.assembleUrl(0, 0, 0, 3);
      }
  }
 };

PanoJS.prototype.imageSize = function() {        
    return this.image_size;
};     

PanoJS.prototype.currentImageSize = function() {    
    var scale = this.currentScale();
    return { width: this.image_size.width * scale, height: this.image_size.height * scale };       
};    
    
PanoJS.prototype.prepareTiles = function() {        
    var rows = Math.ceil(this.height / this.tileSize)+ PanoJS.PRE_CACHE_AMOUNT;
    var cols = Math.ceil(this.width / this.tileSize)+ PanoJS.PRE_CACHE_AMOUNT;
           
    for (var c = 0; c < cols; c++) {
      var tileCol = [];
            
      for (var r = 0; r < rows; r++) {
        /**
         * element is the DOM element associated with this tile
         * posx/posy are the pixel offsets of the tile
         * xIndex/yIndex are the index numbers of the tile segment
         * qx/qy represents the quadrant location of the tile
         */
        /*
        var tile = {
          'element' : null,
          'posx' : 0,
          'posy' : 0,
          'xIndex' : c,
          'yIndex' : r,
          'qx' : c,
          'qy' : r
        };*/
        
        var tile = new Tile(this, c, r);
        
        tileCol.push(tile);
      }
      this.tiles.push(tileCol);
    }
        
    this.positionTiles();
};
    
/**
 * Position the tiles based on the x, y coordinates of the
 * viewer, taking into account the motion offsets, which
 * are calculated by a motion event handler.
 */
PanoJS.prototype.positionTiles = function(motion, reset) {       
    // default to no motion, just setup tiles
    if (typeof motion == 'undefined') {
      motion = { 'x' : 0, 'y' : 0 };
    }

    var cur_size = this.currentImageSize(); 
    for (var c = 0; c < this.tiles.length; c++) {
      for (var r = 0; r < this.tiles[c].length; r++) {
        var tile = this.tiles[c][r];
                
        tile.posx = (tile.xIndex * this.tileSize) + this.x + motion.x;
        tile.posy = (tile.yIndex * this.tileSize) + this.y + motion.y;
                
        var visible = true;
                
        if (tile.posx > this.width  +this.tileSize ) {
          // tile moved out of view to the right
          // consider the tile coming into view from the left
          do {
            tile.xIndex -= this.tiles.length;
            tile.posx = (tile.xIndex * this.tileSize) + this.x + motion.x;
          } while (tile.posx > this.width +this.tileSize  );
                    
          if (tile.posx + this.tileSize < 0) {
            visible = false;
          }
                    
        } else {
          // tile may have moved out of view from the left
          // if so, consider the tile coming into view from the right
          while (tile.posx < -this.tileSize  *2) {
            tile.xIndex += this.tiles.length;
            tile.posx = (tile.xIndex * this.tileSize) + this.x + motion.x;
          }
                    
          if (tile.posx > this.width  +this.tileSize) {
            visible = false;
          }
        }
                
        if (tile.posy > this.height   +this.tileSize) {
          // tile moved out of view to the bottom
          // consider the tile coming into view from the top
          do {
            tile.yIndex -= this.tiles[c].length;
            tile.posy = (tile.yIndex * this.tileSize) + this.y + motion.y;
          } while (tile.posy > this.height   +this.tileSize);
                    
          if (tile.posy + this.tileSize < 0) {
            visible = false;
          }
                    
        } else {
          // tile may have moved out of view to the top
          // if so, consider the tile coming into view from the bottom
          while (tile.posy < -this.tileSize  *2) {
            tile.yIndex += this.tiles[c].length;
            tile.posy = (tile.yIndex * this.tileSize) + this.y + motion.y;
          }
                    
          if (tile.posy > this.height   +this.tileSize) {
            visible = false;
          }
        }
                
        // additional constraint                
        if (tile.xIndex*this.tileSize >= cur_size.width) visible = false;
        if (tile.yIndex*this.tileSize >= cur_size.height) visible = false;                    
                
        // display the image if visible
        if (visible)
            this.assignTileImage(tile);
        else
            this.removeTileFromWell(tile);
      }
    }

    // reset the x, y coordinates of the viewer according to motion
    if (reset) {
      this.x += motion.x;
      this.y += motion.y;
    }
};
    
PanoJS.prototype.removeTileFromWell = function(tile) {        
    if (!tile || !tile.element || !tile.element.parentNode) return;
    this.well.removeChild(tile.element);   
    tile.element = null;      
};
    
   
/**
 * Determine the source image of the specified tile based
 * on the zoom level and position of the tile.  If forceBlankImage
 * is specified, the source should be automatically set to the
 * null tile image.  This method will also setup an onload
 * routine, delaying the appearance of the tile until it is fully
 * loaded, if configured to do so.
 */
PanoJS.prototype.assignTileImage = function(tile) {    
    var tileImgId, src;
    var useBlankImage = false;
        
    // check if image has been scrolled too far in any particular direction
    // and if so, use the null tile image
    if (!useBlankImage) {
      var left = tile.xIndex < 0;
      var high = tile.yIndex < 0;
      
      // dima: allow zooming in more than 100%
      var cur_size = this.currentImageSize();      
      var right = tile.xIndex*this.tileSize >= cur_size.width;
      var low   = tile.yIndex*this.tileSize >= cur_size.height;              
            
      if (high || left || low || right) {
        useBlankImage = true;
      }
    }

    if (useBlankImage) {
      tileImgId = 'blank';
      src = this.cache['blank'].src;
    }
    else {
      tileImgId = src = this.tileUrlProvider.assembleUrl(tile.xIndex, tile.yIndex, this.zoomLevel,PanoJS.NEWMAP); //CHANGE HERE
    }

    // only remove tile if identity is changing
    if (tile.element != null &&
      tile.element.parentNode != null &&
      tile.element.relativeSrc != null &&      
      tile.element.relativeSrc != src) {
      delete this.cache[tile.element.relativeSrc];
      this.well.removeChild(tile.element);
    }

    var scale = Math.max(this.tileSize / this.realTileSize, 1.0);         
    var tileImg = this.cache[tileImgId];

    //window.localStorage (details)
    //var available = navigator.mozIsLocallyAvailable("my-image-file.png", true);

    // create cache if not exist
    if (tileImg == null)
      //tileImg = this.cache[tileImgId] = this.createPrototype('', src); // delayed loading
      tileImg = this.cache[tileImgId] = this.createPrototype(src);
    else
      tileImg.done = true;

    //if (tileImg.done)  
    if (tileImg.naturalWidth && tileImg.naturalHeight && tileImg.naturalWidth>0 && tileImg.naturalHeight>0) {
      tileImg.style.width = tileImg.naturalWidth*scale + 'px';
      tileImg.style.height = tileImg.naturalHeight*scale + 'px';   
    } else 
    if (isIE() && tileImg.offsetWidth>0 && tileImg.offsetHeight>0) { // damn IE does not have naturalWidth ...
      tileImg.style.width = tileImg.offsetWidth*scale + 'px';
      tileImg.style.height = tileImg.offsetHeight*scale + 'px';         
    }

    if ( tileImg.done || !tileImg.delayed_loading &&
         (useBlankImage || !PanoJS.USE_LOADER_IMAGE || tileImg.complete || (tileImg.image && tileImg.image.complete))  ) {
      tileImg.onload = null;
      if (tileImg.image) tileImg.image.onload = null;
            
      if (tileImg.parentNode == null) {
        tile.element = this.well.appendChild(tileImg);
      }  
      tileImg.done = true;      
    } else {
      var loadingImg = this.createPrototype(this.cache['loading'].src);
      loadingImg.targetSrc = tileImgId;
            
      var well = this.well;
      tile.element = well.appendChild(loadingImg);
      tileImg.onload = function() {
        // make sure our destination is still present
        if (loadingImg.parentNode && loadingImg.targetSrc == tileImgId) {
          tileImg.style.top = loadingImg.style.top;
          tileImg.style.left = loadingImg.style.left;
          if (tileImg.naturalWidth && tileImg.naturalHeight && tileImg.naturalWidth>0 && tileImg.naturalHeight>0) {
            tileImg.style.width = tileImg.naturalWidth*scale + 'px';
            tileImg.style.height = tileImg.naturalHeight*scale + 'px'; 
          } else 
          if (isIE() && tileImg.offsetWidth>0 && tileImg.offsetHeight>0) { // damn IE does not have naturalWidth ...
            tileImg.style.width = tileImg.offsetWidth*scale + 'px';
            tileImg.style.height = tileImg.offsetHeight*scale + 'px';         
          }          
          well.replaceChild(tileImg, loadingImg);
          tile.element = tileImg;
        } else {
          // delete a tile if the destination is not present anymore
          if (loadingImg.parentNode) {
            well.removeChild(loadingImg);   
            tile.element = null;      
          }           
        }
                
        tileImg.onload = function() {};
        return false;
      }

      // dima, fetch image after onload method is set-up
      if (!tileImg.done) {// && tileImg.delayed_loading) {
        tileImg.src = tileImg.relativeSrc;
      }
            
      // konqueror only recognizes the onload event on an Image
      // javascript object, so we must handle that case here
      if (!PanoJS.DOM_ONLOAD) {
        tileImg.image = new Image();
        tileImg.image.onload = tileImg.onload;
        tileImg.image.src = tileImg.src;
      }
    }
    
    if (tile.element) {
      tile.element.style.top = tile.posy + 'px';
      tile.element.style.left = tile.posx + 'px';    
    }
    
};

PanoJS.prototype.createPrototype = function(src, src_to_load) {        
    var img = document.createElement('img');
    img.src = src;
    if (!src_to_load)
      img.relativeSrc = src;
    else {
      img.relativeSrc = src_to_load;
      img.delayed_loading = true;
    }
    img.className = PanoJS.TILE_STYLE_CLASS;
    //img.style.width = this.tileSize + 'px';
    //img.style.height = this.tileSize + 'px';
    return img;
};
    
PanoJS.prototype.currentScale = function() {      
    var scale = 1.0;
    if (this.zoomLevel<this.maxZoomLevel)
      scale = 1.0 / Math.pow(2, Math.abs(this.zoomLevel-this.maxZoomLevel));
    else
    if (this.zoomLevel>this.maxZoomLevel)
      scale = Math.pow(2, Math.abs(this.zoomLevel-this.maxZoomLevel));
    return scale;
};
  
PanoJS.prototype.toImageFromViewer = function(p) {   
    var scale = this.currentScale();
    p.x = (p.x / scale);
    p.y = (p.y / scale);    
    return p;
};  
    
PanoJS.prototype.toViewerFromImage = function(p) {       
    var scale = this.currentScale();
    p.x = (p.x * scale);
    p.y = (p.y * scale);    
    return p;
};  

PanoJS.prototype.addViewerMovedListener = function(listener) {          
    this.viewerMovedListeners.push(listener);
};
    
PanoJS.prototype.addViewerZoomedListener = function(listener) {  
    this.viewerZoomedListeners.push(listener);
};

PanoJS.prototype.addViewerResizedListener = function(listener) {      
    this.viewerResizedListeners.push(listener);
};  
    
// Notify listeners of a zoom event on the viewer.
PanoJS.prototype.notifyViewerZoomed = function() {         
    var scale = this.currentScale();
    var w = this.surface.clientWidth / scale;
    var h = this.surface.clientHeight / scale;  
    
    for (var i = 0; i < this.viewerZoomedListeners.length; i++)
      this.viewerZoomedListeners[i].viewerZoomed( new PanoJS.ZoomEvent(this.x, this.y, this.zoomLevel, scale, w, h) );
};
  
// dima : Notify listeners of a zoom event on the viewer
PanoJS.prototype.notifyViewerResized = function() {      
    var scale = this.currentScale();
    var w = this.surface.clientWidth / scale;
    var h = this.surface.clientHeight / scale;  
    for (var i = 0; i < this.viewerResizedListeners.length; i++)
      this.viewerResizedListeners[i].viewerResized( new PanoJS.ResizeEvent(this.x, this.y, w, h) );
};
    
// Notify listeners of a move event on the viewer.
PanoJS.prototype.notifyViewerMoved = function(coords) {   
    if (typeof coords == 'undefined') {
      coords = { 'x' : 0, 'y' : 0 };
    }
        
    for (var i = 0; i < this.viewerMovedListeners.length; i++) {
      this.viewerMovedListeners[i].viewerMoved( new PanoJS.MoveEvent( this.x + (coords.x - this.mark.x),
                                                                      this.y + (coords.y - this.mark.y)
                                                                    )
                                              );
    }
    this.redrawHouse();
    //this.redrawBoat();
};

PanoJS.prototype.zoom = function(direction) {   
    // ensure we are not zooming out of range
    if (this.zoomLevel + direction < 2) { //This '2' used to be a zero: specifies max zoom.
      if (PanoJS.MSG_BEYOND_MIN_ZOOM) {
        alert(PanoJS.MSG_BEYOND_MIN_ZOOM);
      }
      return;
    }
    if (this.zoomLevel+direction > this.maxZoomLevel+PanoJS.MAX_OVER_ZOOM) return;
    
    this.blank();
    this.resetCache();       
        
    if (this.zoomLevel+direction > this.maxZoomLevel) {
      //dima
      var scale_dif = (this.zoomLevel+direction - this.maxZoomLevel) * 2;
        this.tileSize = this.realTileSize*scale_dif;      
    } else {
        this.tileSize = this.realTileSize;
    }
        
    var coords = { 'x' : Math.floor(this.width / 2), 'y' : Math.floor(this.height / 2) };
        
    var before = {
      'x' : (coords.x - this.x),
      'y' : (coords.y - this.y)
    };
        
    var after = {
      'x' : Math.floor(before.x * Math.pow(2, direction)),
      'y' : Math.floor(before.y * Math.pow(2, direction))
    };
	
	if(PanoJS.MESSIER_TOGGLE)
	{
		if(this.zoomLevel == 3 && direction == -1){
			for(i=0;i<this.controls.messierButton.length;i++)
			{
				this.controls.messierButton[i].style.visibility = "hidden";
			}
		}
		if(this.zoomLevel == 2 && direction == 1){
			for(i=0;i<this.controls.messierButton.length;i++)
			{
				this.controls.messierButton[i].style.visibility = "visible";
			}
		}
	}
	
	
	
	
	
        
    this.x = coords.x - after.x;
    this.y = coords.y - after.y;
    this.zoomLevel += direction;
    
    coords.x=0;
    coords.y=0;
        
    this.positionTiles();
    this.notifyViewerZoomed();
    this.moveViewer(coords);
    this.moveHouse(coords);
	
    //this.moveBoat(coords);
    //this.redrawHouse();
    //this.redrawBoat();
};

PanoJS.prototype.update = function() {     
	var zero = {'x':0, 'y':0};
    this.blank();
    this.resetCache();
    this.positionTiles();
    this.redrawHouse();
	this.moveViewer(zero);
	this.moveHouse(zero);
    //this.redrawBoat();
    if (this.thumbnail_control) this.thumbnail_control.update();
};    
    
// Clear all the tiles from the well for a complete reinitialization of the
// viewer. At this point the viewer is not considered to be initialized.
PanoJS.prototype.clear = function() {         
    this.blank();
    this.initialized = false;
    this.tiles = [];
    this.resetCache();
};
    
PanoJS.prototype.resetCache = function() {        
    this.cache = {};
    this.cache['blank'] = new Image();
    this.cache['blank'].src = this.blankTile;
    if (this.blankTile != this.loadingTile) {
      this.cache['loading'] = new Image();
      this.cache['loading'].src = this.loadingTile;
    } else {
      this.cache['loading'] = this.cache['blank'];
    }    
};    
    
// Remove all tiles from the well, which effectively "hides"
// them for a repaint.
PanoJS.prototype.blank = function() {      
    for (imgId in this.cache) {
      var img = this.cache[imgId];
      if (!img) continue;
      img.onload = function() {};
      if (img.image) {
        img.image.onload = function() {};
      }
            
      if (img.parentNode != null) {
        this.well.removeChild(img);
      }
    }
    this.resetCache();
};

PanoJS.prototype.redrawHouse = function(coords) {
  var absX = this.controls.houseButton.absoluteX;
  var absY = this.controls.houseButton.absoluteY;
  if (PanoJS.HOUSE_IS_HOUSE){ var offsetx = PanoJS.HOUSE_OFFSET_X; var offsety = PanoJS.HOUSE_OFFSET_Y;}
  else{ var offsetx = PanoJS.BOAT_OFFSET_X; var offsety = PanoJS.BOAT_OFFSET_Y;}
  var localX = absX * Math.pow(2, this.zoomLevel) + this.x-offsetx;
  var localY = absY * Math.pow(2, this.zoomLevel) + this.y-offsety;
  this.controls.houseButton.style.cssText = "position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 20px;";
};
/*
PanoJS.prototype.redrawBoat = function(coords) {
  var absXb = this.controls.boatButton.absoluteX;
  var absYb = this.controls.boatButton.absoluteY;
  var localXb = absXb * Math.pow(2, this.zoomLevel) + this.x;
  var localYb = absYb * Math.pow(2, this.zoomLevel) + this.y;
  this.controls.boatButton.style.cssText = "position: absolute; z-index: 30; top: "+localYb+"px; left: "+localXb+"px; width: 36px;";
};*/

//redrawHouse();
PanoJS.prototype.redrawHouse = function() {
  var absX = this.controls.houseButton.absoluteX;
  var absY = this.controls.houseButton.absoluteY;
  if (PanoJS.HOUSE_IS_HOUSE){ var offsetx = PanoJS.HOUSE_OFFSET_X; var offsety = PanoJS.HOUSE_OFFSET_Y;}
  else{ var offsetx = PanoJS.BOAT_OFFSET_X; var offsety = PanoJS.BOAT_OFFSET_Y;}
  var localX = absX * Math.pow(2, this.zoomLevel) + this.x-offsetx;
  var localY = absY * Math.pow(2, this.zoomLevel) + this.y-offsety;
  this.controls.houseButton.style.cssText = "position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 20px;";
/*
if(this.zoomLevel == 5){
  for(i=0;i<this.controls.boughtButton.length;i++){
    localX = this.controls.boughtButton[i].x* Math.pow(2, this.zoomLevel) + this.x ;  
    localY = this.controls.boughtButton[i].y* Math.pow(2, this.zoomLevel) + this.y ;  
    this.controls.boughtButton[i].style.cssText = "position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 30px;";
  }}*/
};
/*
//redrawBoat();
PanoJS.prototype.redrawBoat = function() {
  var absXb = this.controls.boatButton.absoluteX;
  var absYb = this.controls.boatButton.absoluteY;
  var localXb = absXb * Math.pow(2, this.zoomLevel) + this.x-10;
  var localYb = absYb * Math.pow(2, this.zoomLevel) + this.y-10;
  this.controls.boatButton.style.cssText = "position: absolute; z-index: 30; top: "+localYb+"px; left: "+localXb+"px; width: 36px;";
};*/
    
// Method specifically for handling a mouse move event.  A direct
// movement of the viewer can be achieved by calling positionTiles() directly.
PanoJS.prototype.moveViewer = function(coords) {
  if (coords.x == this.x && coords.y == this.y) return;
  var motionX = (coords.x - this.mark.x);
  var motionY = (coords.y - this.mark.y);
  
  if( this.isMovingOutside(coords) ){
    var width = 960;
    var heigth = 480;
    if( motionX + this.x > 0) motionX -= Math.abs(motionX + this.x);
    if( motionY + this.y > 0) motionY -= Math.abs(motionY + this.y);
    if( motionX + this.x - width  + 250*Math.pow(2,this.zoomLevel) < 0) motionX += Math.abs(motionX + this.x - width + 250*Math.pow(2,this.zoomLevel));
    if( motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel) < 0) motionY += Math.abs(motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel));
  }
  
  //this.positionTiles({ 'x' : (coords.x - this.mark.x), 'y' : (coords.y - this.mark.y) });
  this.positionTiles({ 'x' : motionX, 'y' : motionY });
  this.notifyViewerMoved(coords);
};

PanoJS.prototype.isMovingOutside = function(coords)
{
    if(this.maximized) return false;
    var curWidth = 960;
    var curHeight = 480;
    var cornerX = coords.x - this.mark.x + this.x
    var cornerY = coords.y - this.mark.y + this.y
    if(cornerX > 0) return true;
    if(cornerY > 0) return true;
    if(cornerX < -250*Math.pow(2, this.zoomLevel)+curWidth) return true;
    if(cornerY < -125*Math.pow(2, this.zoomLevel)+curHeight) return true;
    return false;
}

PanoJS.prototype.isMovingOutsideX = function(coords)
{
    if(this.maximized) return false;
    var curWidth = 960;
    var cornerX = coords.x - this.mark.x + this.x
    if(cornerX > 0) return true;
    if(cornerX < -250*Math.pow(2, this.zoomLevel)+curWidth) return true;
    return false;
}

PanoJS.prototype.isMovingOutsideY = function(coords)
{
    if(this.maximized) return false;
    var curHeight = 480;
    var cornerY = coords.y - this.mark.y + this.y
    if(cornerY > 0) return true;
    if(cornerY < -125*Math.pow(2, this.zoomLevel)+curHeight) return true;
    return false;
}

PanoJS.prototype.moveHouse = function(coords) {
  var motionX = (coords.x - this.mark.x);
  var motionY = (coords.y - this.mark.y);
 
 if( this.isMovingOutside(coords) ){
    var width = 960;
    var heigth = 480;
    if( motionX + this.x > 0) motionX -= Math.abs(motionX + this.x);
    if( motionY + this.y > 0) motionY -= Math.abs(motionY + this.y);
    if( motionX + this.x - width  + 250*Math.pow(2,this.zoomLevel) < 0) motionX += Math.abs(motionX + this.x - width + 250*Math.pow(2,this.zoomLevel));
    if( motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel) < 0) motionY += Math.abs(motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel));
  }
    var absX = this.controls.houseButton.absoluteX;
    var absY = this.controls.houseButton.absoluteY;
    if (PanoJS.HOUSE_IS_HOUSE){ var offsetx = PanoJS.HOUSE_OFFSET_X; var offsety = PanoJS.HOUSE_OFFSET_Y;}
  else{ var offsetx = PanoJS.BOAT_OFFSET_X; var offsety = PanoJS.BOAT_OFFSET_Y;}
    var localX = absX * Math.pow(2, this.zoomLevel) + this.x  +motionX-offsetx;
    var localY = absY * Math.pow(2, this.zoomLevel) + this.y  +motionY-offsety;
    this.controls.houseButton.style.cssText = "position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 20px;";

  if(this.zoomLevel==5 || this.zoomLevel==4 || this.zoomLevel==3)
  {  
  	PanoJS.HOUSES_VISIBLE = true;
    for(i=0;i<this.controls.boughtButton.length;i++)
    {
  		localX = this.controls.boughtButton[i].x*Math.pow(2, this.zoomLevel) + this.x  +motionX -10;
  		localY = this.controls.boughtButton[i].y*Math.pow(2, this.zoomLevel) + this.y  +motionY -10;  
  		if( this.zoomLevel==5 || this.zoomLevel==4) //Normal font
    	{	if (PanoJS.NEWMAP==2)
  			{
    			this.controls.boughtButton[i].style.cssText = "color:#BBBBBB;  line-height:80%; font-weight:bold; font-size:70%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
    		} 
  			else 
  			{
    			this.controls.boughtButton[i].style.cssText = "color:#333333;  line-height:80%; font-weight:bold; font-size:70%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
  			}
  		} 
  		else 
  		{ //0-size font if we're zoomed out at level3
  			this.controls.boughtButton[i].style.cssText = "color:#BBBBBB;  line-height:80%; font-weight:bold; font-size:0%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
  		}
  	}
  } 
	else if(PanoJS.HOUSES_VISIBLE && this.zoomLevel==2) 
	{
		PanoJS.HOUSES_VISIBLE = false;
		for(i=0;i<this.controls.boughtButton.length;i++)
		{
  		localX = -100;  
  		localY = -100;  
  		this.controls.boughtButton[i].style.cssText = "position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 30px;";
		} //for
  } //else if(PanoJS.HOUSES_VISIBLE) 
  
//Do same thing for Messier objects
if(PanoJS.MESSIER_TOGGLE)
{  
    for(i=0;i<this.controls.messierButton.length;i++)
    {
		localX = this.controls.messierButton[i].x* Math.pow(2, this.zoomLevel) + this.x  +motionX -10;   
		localY = this.controls.messierButton[i].y* Math.pow(2, this.zoomLevel) + this.y  +motionY -10;  
		if (PanoJS.NEWMAP==2) {
			if(this.zoomLevel == 2){
				this.controls.messierButton[i].style.cssText = "color:#BBBBBB;  line-height:95%; font-weight:bold; font-size:0%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
			} else {
				this.controls.messierButton[i].style.cssText = "color:#BBBBBB;  line-height:95%; text-shadow: #000000 1px 1px 0.5px; font-weight:bold; font-size:70%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
			}
		} else {
			if(this.zoomLevel == 2){
				this.controls.messierButton[i].style.cssText = "color:#71742c;  line-height:90%; font-weight:bold; font-size:0%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
			} else {
				this.controls.messierButton[i].style.cssText = "color:#2a54a8;  line-height:90%; text-shadow: #ececec 0px 0px 5px; font-weight:bold; font-size:70%; position: absolute; z-index: 30; top: "+localY+"px; left: "+localX+"px; width: 10px;";
			}
		}
	}
}

}
/*
 PanoJS.prototype.moveBoat = function(coords) { 
    var motionX = (coords.x - this.mark.x);
    var motionY = (coords.y - this.mark.y);
 
 if( this.isMovingOutside(coords) ){
    var width = 960;
    var heigth = 480;
    if( motionX + this.x > 0) motionX -= Math.abs(motionX + this.x);
    if( motionY + this.y > 0) motionY -= Math.abs(motionY + this.y);
    if( motionX + this.x - width  + 250*Math.pow(2,this.zoomLevel) < 0) motionX += Math.abs(motionX + this.x - width + 250*Math.pow(2,this.zoomLevel));
    if( motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel) < 0) motionY += Math.abs(motionY + this.y - heigth + 125*Math.pow(2,this.zoomLevel));
  }

    var absXb = this.controls.boatButton.absoluteX;
    var absYb = this.controls.boatButton.absoluteY;
    var localXb = absXb * Math.pow(2, this.zoomLevel) + this.x - 10 +motionX;
    var localYb = absYb * Math.pow(2, this.zoomLevel) + this.y - 10 +motionY;
    this.controls.boatButton.style.cssText = "position: absolute; z-index: 30; top: "+localYb+"px; left: "+localXb+"px; width: 36px;";
};*/
    
// dima: Event that works for any input, expects DeltaX and DeltaY
PanoJS.prototype.moveViewerBy = function(coords) {   
if(this.isMovingOutside(coords)) return false;  
      this.positionTiles(coords, true);
      //this.notifyViewerMoved(coords);
      this.notifyViewerMoved();
      this.redrawHouse();
      //this.redrawBoat();
},
  
  
   

  
  
/**
 * Make the specified coords the new center of the image placement.
 * This method is typically triggered as the result of a double-click
 * event.  The calculation considers the distance between the center
 * of the viewable area and the specified (viewer-relative) coordinates.
 * If absolute is specified, treat the point as relative to the entire
 * image, rather than only the viewable portion.
 */
PanoJS.prototype.recenter = function(coords, absolute, skip_motion) {   
  skip_motion = typeof(skip_motion) != 'undefined' ? skip_motion : false; 
  if (absolute) {
    coords.x += this.x;
    coords.y += this.y;
  }
  if (coords.x == this.x && coords.y == this.y) return;      
      
  var motion = {
    'x' : Math.floor((this.width / 2) - coords.x),
    'y' : Math.floor((this.height / 2) - coords.y)
  };
      
  if (motion.x == 0 && motion.y == 0) {
    return;
  }
      
  if (PanoJS.USE_SLIDE && !skip_motion) {
    var target = motion;
    var x, y;
    // handle special case of vertical movement
    if (target.x == 0) {
      x = 0;
      y = this.slideAcceleration;
    }
    else {
      var slope = Math.abs(target.y / target.x);
      x = Math.round(Math.pow(Math.pow(this.slideAcceleration, 2) / (1 + Math.pow(slope, 2)), .5));
      y = Math.round(slope * x);
    }
    
    motion = {
      'x' : Math.min(x, Math.abs(target.x)) * (target.x < 0 ? -1 : 1),
      'y' : Math.min(y, Math.abs(target.y)) * (target.y < 0 ? -1 : 1)
    }
  }
    
  this.positionTiles(motion, true);
  this.notifyViewerMoved();
  
  var zero = {
    'x' : 0,
    'y' : 0
  };
  this.moveViewer(zero);
  this.moveHouse(zero);
  //this.moveBoat(zero);
      
  if (!PanoJS.USE_SLIDE && !skip_motion) {
    return;
  }
      
  var newcoords = {
    'x' : coords.x + motion.x,
    'y' : coords.y + motion.y
  };
      
  var self = this;
  // TODO: use an exponential growth rather than linear (should also depend on how far we are going)
  // FIXME: this could be optimized by calling positionTiles directly perhaps
  this.slideAcceleration += PanoJS.SLIDE_ACCELERATION_FACTOR;
  this.slideMonitor = setTimeout(function() { self.recenter(newcoords); }, PanoJS.SLIDE_DELAY );
};

PanoJS.prototype.resize = function() {     
  // IE fires a premature resize event
  if (!this.initialized) return;
  if (this.width == this.viewer.offsetWidth && this.height == this.viewer.offsetHeight) return;
      
  var newWidth = this.viewer.offsetWidth;
  var newHeight = this.viewer.offsetHeight;
  this.viewer.style.display = 'none';
  this.clear();
  this.width = newWidth;
  this.height = newHeight;
      
  this.prepareTiles();
  this.positionTiles();
  this.viewer.style.display = '';
  this.initialized = true;
  this.notifyViewerMoved();
  this.notifyViewerResized();
  this.redrawHouse();
  //this.redrawBoat();
};

PanoJS.prototype.toggleMaximize = function() {     
  if (!this.maximized) this.maximized = false;
  this.maximized = !this.maximized;

  var vd = this.viewer;
  if (this.maximized) {
      this.viewer_style = { 'width': vd.style.width, 'height': vd.style.height,
          'position': vd.style.position, 'zIndex': vd.style.zIndex,
          'left': vd.style.left, 'top': vd.style.top };
      this.document_style = { 'padding': document.body.style.padding, 'overflow': document.body.style.overflow };
      
      vd.style.position = 'fixed';
      //vd.style.position = 'absolute';            
      vd.style.zIndex   = '14999';
      //vd.style.left     = window.scrollX + 'px';
      //vd.style.top      = window.scrollY + 'px';
      vd.style.left     = '0px';
      vd.style.top      = '0px';
      vd.style.width    = '100%';
      vd.style.height   = '100%'; 
      document.body.style.overflow = 'hidden';
      document.body.style.padding = '0';
      if (isMobileSafari()) {
        vd.style.left = window.scrollX + 'px';
        vd.style.top  = window.scrollY + 'px';
        vd.style.width    = window.innerWidth + 'px';
        vd.style.height   = window.innerHeight + 'px';   
      }
     document.getElementById("frame").style.visibility="hidden";
     
	 //Move screen so that center(minimized) = center(maximized)
	 var motion = {
		'x' :  0.5*this.width - this.x,
		'y' :  0.5*this.height- this.y+1
	};
	this.slideAcceleration = 5000; //hack to turn slide off
	this.recenter(motion,true,true);
      
  } else {
      document.body.style.padding = this.document_style.padding;
      document.body.style.overflow = this.document_style.overflow;          
      vd.style.width    = this.viewer_style.width;
      vd.style.height   = this.viewer_style.height;
      vd.style.position = this.viewer_style.position;
      vd.style.zIndex   = this.viewer_style.zIndex;
      vd.style.left     = this.viewer_style.left;
	  vd.style.left		= '0px';
      vd.style.top      = this.viewer_style.top;
      document.getElementById("frame").style.visibility="visible";
	  
	  //Move screen so that center(minimized) = center(maximized)
	  var motion = {
		'x' : 0.5*this.width - this.x+0,
		'y' : 0.5*this.height - this.y+1 //I don't know why you need a '+1' here, but you do.
	  };
	  this.slideAcceleration = 5000; //hack to turn slide off
	  this.recenter(motion,true,true);
  }
  this.resize();
};
  
/**
 * Resolve the coordinates from this mouse event by subtracting the
 * offset of the viewer in the browser window (or frame).  This does
 * take into account the scroll offset of the page.
 */
PanoJS.prototype.resolveCoordinates = function(e) {    
  if (this.maximized)
    return { 'x' : e.clientX, 'y' : e.clientY };

  return {
    'x' : (e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft))) - this.left,
    'y' : (e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop))) - this.top
  };
};

PanoJS.prototype.press = function(coords) {     
  this.activate(true);
  this.mark = coords;
  this.mouse_have_moved = false;
};

PanoJS.prototype.release = function(coords) {  
  this.activate(false);
  var motion = {
    'x' : (coords.x - this.mark.x),
    'y' : (coords.y - this.mark.y)
  };
  
  if( this.isMovingOutside(coords) ){
    var width = 960;
    var heigth = 480;
    if( motion.x + this.x > 0) motion.x -= Math.abs(motion.x + this.x);
    if( motion.y + this.y > 0) motion.y -= Math.abs(motion.y + this.y);
    if( motion.x + this.x - width + 250*Math.pow(2,this.zoomLevel) < 0) motion.x += Math.abs(motion.x + this.x - width + 250*Math.pow(2,this.zoomLevel));
    if( motion.y + this.y - heigth + 125*Math.pow(2,this.zoomLevel) < 0) motion.y += Math.abs(motion.y + this.y - heigth + 125*Math.pow(2,this.zoomLevel));
  }
      
  this.x += motion.x;
  this.y += motion.y;
  this.mark = { 'x' : 0, 'y' : 0 };
  this.mouse_have_moved = false;   
  this.redrawHouse();
  //this.redrawBoat();
};
  
/**
 * Activate the viewer into motion depending on whether the mouse is pressed or
 * not pressed.  This method localizes the changes that must be made to the
 * layers.
 */
PanoJS.prototype.activate = function(pressed) {   
  this.pressed = pressed;
  this.surface.style.cursor = (pressed ? PanoJS.GRABBING_MOUSE_CURSOR : PanoJS.GRAB_MOUSE_CURSOR);
  //this.ui_listener.onmousemove = (pressed ? callback(this, this.mouseMovedHandler) : function() {});
  if(pressed){
    this.ui_listener.onmousemove = callback(this, this.mouseMovedHandler);
    this.redrawHouse();
      //this.redrawBoat();

    }
    else{
    this.ui_listener.onmousemove = function(){};
    }
};
  
/**
 * Check whether the specified point exceeds the boundaries of
 * the viewer's primary image.
 */
PanoJS.prototype.pointExceedsBoundaries = function(coords) {     
  return (coords.x < this.x ||
          coords.y < this.y ||
          coords.x > (this.tileSize * Math.pow(2, this.zoomLevel) + this.x) ||
          coords.y > (this.tileSize * Math.pow(2, this.zoomLevel) + this.y));
};
  
// QUESTION: where is the best place for this method to be invoked?
PanoJS.prototype.resetSlideMotion = function() {     
  // QUESTION: should this be > 0 ? 
  if (this.slideMonitor != 0) {
    clearTimeout(this.slideMonitor);
    this.slideMonitor = 0;
  }
      
  this.slideAcceleration = 0;
};

/**
 * Change the house picture.  Value = 1 (house), 2 (boat)
 * TODO: add phone, tablet functionality (i.e. 32px vs 64px)
 */
PanoJS.prototype.changeHousePicture = function(value) {
    var btn = this.controls.houseButton;
    if (value==1){
        var src = "images/32px_house.png";
        var img = document.createElement('img');
        img.src = src;
        img.style.width = "22px";
        btn.removeChild(btn.lastChild);
        btn.appendChild(img);
        PanoJS.HOUSE_IS_HOUSE = true;
    }
    else if (value==2){
        var src = "images/32px_boat.png";
        var img = document.createElement('img');
        img.src = src;
        img.style.width = "32px";
        btn.removeChild(btn.lastChild);
        btn.appendChild(img);
        PanoJS.HOUSE_IS_HOUSE = false;
    }
}

//-------------------------------------------------------
// Mouse Events
//-------------------------------------------------------

PanoJS.prototype.blockPropagation = function (e) {
    if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
    else e.cancelBubble = true;                 // IE    
    if (e.preventDefault) e.preventDefault(); // prevent image dragging
    else e.returnValue=false;    
}

PanoJS.prototype.mousePressedHandler = function(e) {
  e = e ? e : window.event;
  this.blockPropagation(e); 

var zero = {'x':0, 'y':0};
this.moveHouse(zero);
    
  // only grab on left-click
  var coords = this.resolveCoordinates(e);
  //if (this.pointExceedsBoundaries(coords))
    this.press(coords);
    
  // NOTE: MANDATORY! must return false so event does not propagate to well!
  return false;
};

PanoJS.prototype.mouseReleasedHandler = function(e) {
  e = e ? e : window.event;
  var coords = this.resolveCoordinates(e);   
  
  
  this.houseIsMoving = 0;
    this.ui_listener.onmousemove = callback(this, this.mouseMovedShiftHandler);
  //this.ui_listener.onmousemove = function(){};
  if (!this.pressed) return false;
  var motion = {
        'x' : (coords.x - this.mark.x),
        'y' : (coords.y - this.mark.y)
  };        
  
  var moved = this.mouse_have_moved;
  this.release(coords);
  // only if there was little movement
  if (moved || motion.x>5 || motion.y>5) return false;  
  if (e.button == 2) {
    this.blockPropagation(e);      
    this.zoom(-1);    
  } else
  // move on one click
  //if (e.button < 2) {
  //  //if (!this.pointExceedsBoundaries(coords)) {
  //       this.resetSlideMotion();
  //       this.recenter(coords);
  //  //}        
  //}
   
  
//  if(e.shiftKey) {
//	var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel);
//    var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel);
//	var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
//		if(landColor == 1){
//			this.changeHousePicture(2);
//			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
//                        PanoJS.HOUSE_IS_HOUSE = false;
//		} else {
//			this.changeHousePicture(1);
//			this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
//                        PanoJS.HOUSE_IS_HOUSE = true;
//		}
//  }
  
    //this.redrawHouse();
  return false;    
};

PanoJS.prototype.mouseMovedShiftHandler = function(e) {
e = e ? e : window.event;
if (e.shiftKey){
	var coords = this.resolveCoordinates(e); 
	var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel);
    var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel);
	var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
		if(landColor == 1){
			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
		} else {
			this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
		}
                
        }

        //this.redrawHouse();

	return false;
};

PanoJS.prototype.mouseMovedHandler = function(e) {
  e = e ? e : window.event;  
  // only move on left-click
  
  if (e.button < 2) {
    this.mouse_have_moved = true;
    this.moveCount++;
    var coords = this.resolveCoordinates(e); 
	
    if (this.moveCount % PanoJS.MOVE_THROTTLE == 0){
        //if( !this.isMovingOutside(coords) ){
              this.moveViewer(coords);
              this.moveHouse(coords);
                
             // this.moveBoat(coords);
        //}
    }
  }

  if (e.shiftKey){
	var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel);
        var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel);
	var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
		if(landColor == 1){
			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
		} else {
			this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
		}
        }


  //this.redrawHouse();
  return false;        
};

PanoJS.prototype.houseMovedHandler = function(e) {
if (e.button < 2 && this.houseIsMoving == 1){
	var coords = this.resolveCoordinates(e);
	var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel)
	var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel)
	this.controls.houseButton.absoluteX = absoluteX;
	this.controls.houseButton.absoluteY = absoluteY;
        if (PanoJS.HOUSE_IS_HOUSE){ var offsetx = PanoJS.HOUSE_OFFSET_X; var offsety = PanoJS.HOUSE_OFFSET_Y;}
  else{ var offsetx = PanoJS.BOAT_OFFSET_X; var offsety = PanoJS.BOAT_OFFSET_Y;}
	drawAtX = coords.x-offsetx;
	drawAtY = coords.y-offsety;
	//Move house location
	this.controls.houseButton.style.cssText = "position: absolute; z-index: 30; top: "+drawAtY+"px; left: "+drawAtX+"px; width: 20px;";
		//if (absoluteX>125){
		//this.controls.houseButton.image = PanoJS.CONTROL_IMAGE_BOAT;}
		//else{this.controls.houseButton.image = PanoJS.CONTROL_IMAGE_HOUSE;}
	 document.mainForm.absoluteX.value = absoluteX;
	document.mainForm.absoluteY.value = absoluteY;
	var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
	document.mainForm.map.value = landColor;
		if(landColor == 1){
			this.changeHousePicture(2);
			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
                        PanoJS.HOUSE_IS_HOUSE = false;
		} else {
			this.changeHousePicture(1);
			this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
                        PanoJS.HOUSE_IS_HOUSE = true;
		}

	}
        redrawHouse();
	return false;
}

//Shift + leftClick: Position House
//ctrl + leftClick: Position Boat
PanoJS.prototype.singleClickHandler = function(e) {
    if (e.shiftKey){
        //this.zoom(1);
        var coords = this.resolveCoordinates(e);
        var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel)
        var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel)
        this.controls.houseButton.absoluteX = absoluteX;
        this.controls.houseButton.absoluteY = absoluteY;
        if (PanoJS.HOUSE_IS_HOUSE){ var offsetx = PanoJS.HOUSE_OFFSET_X; var offsety = PanoJS.HOUSE_OFFSET_Y;}
  else{ var offsetx = PanoJS.BOAT_OFFSET_X; var offsety = PanoJS.BOAT_OFFSET_Y;}
        drawAtX = coords.x-offsetx;
        drawAtY = coords.y-offsety;
        //Move house location
        this.controls.houseButton.style.cssText = "position: absolute; z-index: 30; top: "+drawAtY+"px; left: "+drawAtX+"px; width: 20px;";
            //if (absoluteX>125){
            //this.controls.houseButton.image = PanoJS.CONTROL_IMAGE_BOAT;}
            //else{this.controls.houseButton.image = PanoJS.CONTROL_IMAGE_HOUSE;}
         document.mainForm.absoluteX.value = absoluteX;
        document.mainForm.absoluteY.value = absoluteY;
		var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
        document.mainForm.map.value = landColor;
		if(landColor == 1){
			this.changeHousePicture(2);
			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
                        PanoJS.HOUSE_IS_HOUSE = false;
		} else {
			this.changeHousePicture(1);
			this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
                        PanoJS.HOUSE_IS_HOUSE = true;
		}
                this.redrawHouse();
                if (PanoJS.FIRST){
                  if (PanoJS.HOUSE_IS_HOUSE){
                  GB_showCenter("You just chose your first spacehouse!", "/panojs3/firsthouse.php", 600, 500);
                  PanoJS.GB_ON = true;
                  }
                  if (!PanoJS.HOUSE_IS_HOUSE){
                  GB_showCenter("You just chose your first spaceboat!", "/panojs3/firstboat.php", 600, 500);
                  PanoJS.GB_ON = true;
                  }

                }
                PanoJS.FIRST=false;

    } //return false;
/*
    if (e.ctrlKey){
        //this.zoom(1);
        var coords = this.resolveCoordinates(e);
        var absoluteXb = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel)
        var absoluteYb = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel)
        this.controls.boatButton.absoluteX = absoluteXb;
        this.controls.boatButton.absoluteY = absoluteYb;
        drawAtXb = coords.x-10;
        drawAtYb = coords.y-10;
        //Move boat location
        this.controls.boatButton.style.cssText = "position: absolute; z-index: 30; top: "+drawAtYb+"px; left: "+drawAtXb+"px; width: 36px;";
        document.mainForm.absoluteX.value = absoluteXb;
        document.mainForm.absoluteY.value = absoluteYb;
    }*/
}


PanoJS.prototype.doubleClickHandler = function(e) {
  e = e ? e : window.event;
  var coords = this.resolveCoordinates(e);
  if (!this.pointExceedsBoundaries(coords)) {
    this.slideAcceleration=1000;
    this.recenter(coords); 
    this.resetSlideMotion();      
    this.zoom(1);
  }
  return false;  
};

//Chrome uses this function for mouse wheel
PanoJS.prototype.mouseWheelHandler = function(e) {
  e = e ? e : window.event;
  var coords = this.resolveCoordinates(e);
  this.blockPropagation(e);  
  if (PanoJS.USE_WHEEL_FOR_ZOOM) {
      if (e.wheelDelta<0) {
		if (this.zoomLevel - 1 < 2) return false;
		if (this.zoomLevel-1 > this.maxZoomLevel+PanoJS.MAX_OVER_ZOOM) return false;
		this.zoom(-1);	
	} else if (e.wheelDelta>0) {
		
		if (this.zoomLevel + 1 < 2) return false;
		if (this.zoomLevel+1 > this.maxZoomLevel+PanoJS.MAX_OVER_ZOOM) return false;
		this.zoom(1); 
		this.slideAcceleration=1000;
		this.recenter(coords);
		this.resetSlideMotion();
	}
  } else {
      var dx = e.wheelDeltaX/PanoJS.WHEEL_SCALE;
      var dy = e.wheelDeltaY/PanoJS.WHEEL_SCALE;
      this.moveViewerBy({'x': dx,'y': dy});
  }  
  return false;      
};

//Firefox uses this function for mouse wheel
PanoJS.prototype.mouseScrollHandler = function(e) {
  e = e ? e : window.event;
  this.blockPropagation(e); 
  var coords = this.resolveCoordinates(e);
  // Here we only have delta Y, so for firefox only Zoom will be implemented
  //var wheelData = e.detail * -1 * PanoJS.WHEEL_SCALE; // adjust delta value in sync with Webkit   
	//Only do this if we can still zoom in
  if (e.detail<0) {
	if (this.zoomLevel + 1 < 2) return false;
	if (this.zoomLevel+1 > this.maxZoomLevel+PanoJS.MAX_OVER_ZOOM) return false;
	
	this.zoom(1); 
	this.slideAcceleration=1000;
    this.recenter(coords);
    this.resetSlideMotion();}
  else if (e.detail>0){
	if (this.zoomLevel - 1 < 2) return false;
	if (this.zoomLevel-1 > this.maxZoomLevel+PanoJS.MAX_OVER_ZOOM) return false;
	this.zoom(-1);
	}
  
  return false;  
};

//----------------------------------------------------------------------
// keyboard events
//----------------------------------------------------------------------

PanoJS.prototype.keyboardHandler = function(e) {
  if (!PanoJS.USE_KEYBOARD) return;  
  e = e ? e : window.event;
  var key = e.keyCode ? e.keyCode : e.which;
  
  if (key == PanoJS.KEY_MINUS) {
      this.blockPropagation(e); 
      //this.zoom(-1);
      return false;      
  } else 
  if (key == PanoJS.KEY_PLUS) {
      this.blockPropagation(e); 
      //this.zoom(1);
      return false;
  } else
  if (key == PanoJS.KEY_UP) {
      this.blockPropagation(e); 
      //this.moveViewerBy({'x': 0,'y': PanoJS.KEY_MOVE_THROTTLE});
      return false;      
  } else 
  if (key == PanoJS.KEY_RIGHT) {
      this.blockPropagation(e); 
      //this.moveViewerBy({'x': -PanoJS.KEY_MOVE_THROTTLE,'y': 0});      
      return false;      
  } else 
  if (key == PanoJS.KEY_DOWN) {
      this.blockPropagation(e); 
      //this.moveViewerBy({'x': 0,'y': -PanoJS.KEY_MOVE_THROTTLE});      
      return false;      
  } else 
  if (key == PanoJS.KEY_LEFT) {
      this.blockPropagation(e); 
      // this.moveViewerBy({'x': PanoJS.KEY_MOVE_THROTTLE,'y': 0});      
      return false;
  } else
  if (key == PanoJS.KEY_SHIFT) {
      //this.blockPropagation(e); 
		var coords = this.resolveCoordinates(e); 
		var absoluteX = coords.x/ Math.pow(2, this.zoomLevel) - this.x/ Math.pow(2, this.zoomLevel);
		var absoluteY = coords.y/ Math.pow(2, this.zoomLevel) - this.y/ Math.pow(2, this.zoomLevel);
		var landColor = getColor(8*(absoluteX),8*(absoluteY),landAndSea);
 		if(landColor == 1){
			this.surface.style.cursor = PanoJS.BOAT_CURSOR;
		} else {
                  this.surface.style.cursor = PanoJS.HOUSE_CURSOR;
		}
	  this.ui_listener.onmousemove = callback(this, this.mouseMovedShiftHandler);
      return false;
  }else
  if (key == PanoJS.KEY_ESC) {
      this.blockPropagation(e);
      //alert(PanoJS.GB_ON);
          if (PanoJS.GB_ON){
            PanoJS.GB_ON = false;
            GB_hide();
          }
          else{
            if (this.maximized){
              this.toggleMaximize();
            }
          }
      return false;
  }
  
}

PanoJS.prototype.keyboardHandlerUp = function(e) {
    e = e ? e : window.event;
    var key = e.keyCode ? e.keyCode : e.which;
    if (key == PanoJS.KEY_SHIFT) {
        this.blockPropagation(e); 
        this.surface.style.cursor = PanoJS.GRAB_MOUSE_CURSOR;
		this.ui_listener.onmousemove = function(){};
        return false;
    } 
}

//----------------------------------------------------------------------
// touch events
//----------------------------------------------------------------------

PanoJS.prototype.touchStartHandler = function(e) {
  e = e ? e : window.event;
  if (e == null) return false;
    
  if (e.touches.length == 1) { // Only deal with one finger
      // prevent anything else happening for this event further
      this.blockPropagation(e);   
      
      // actully store the initial touch move position
      var touch = e.touches[0]; // Get the information for finger #1
      this.touch_start = {'x': touch.clientX,'y': touch.clientY}; 
  }
  return false;       
}

PanoJS.prototype.touchMoveHandler = function(e) {
  e = e ? e : window.event;
  if (e == null) return false;
  
  if (e.touches.length==1 && this.touch_start) { // Only deal with one finger
      // prevent anything else happening for this event further
      this.blockPropagation(e);          
      
      // move
      var touch = e.touches[0]; // Get the information for finger #1    
      var p = {'x': touch.clientX-this.touch_start.x,'y': touch.clientY-this.touch_start.y};
      this.moveViewerBy(p); 
      this.touch_start = {'x': touch.clientX,'y': touch.clientY}; 
			var zero = {'x':0, 'y':0};
			this.moveHouse(zero);
  }
  return false;       
}
 

//----------------------------------------------------------------------
// gesture events
//----------------------------------------------------------------------

PanoJS.prototype.gestureStartHandler = function(e) {
  e = e ? e : window.event;
  if (e == null) return false;  
  this.blockPropagation(e);
  this.gesture_current_scale = 1.0;
  this.gesture_image_scale = this.currentScale();  
  return false;              
}

PanoJS.prototype.gestureChangeHandler = function(e) {
  e = e ? e : window.event;
  if (e == null) return false;  
  this.blockPropagation(e);      
  
  if (e.scale/this.gesture_current_scale>2.0) {
    this.gesture_current_scale = e.scale;
    this.zoom(1);
  } else 
  if (e.scale/this.gesture_current_scale<0.5) {
    this.gesture_current_scale = e.scale;
    this.zoom(-1);
  }
  
  if (this.osd_control) {
    e.image_scale = this.gesture_image_scale;
    e.gesture_current_scale = this.gesture_current_scale;
    this.osd_control.viewerZooming(e); 
  }
  
  return false;       
}

PanoJS.prototype.gestureEndHandler = function(e) {
  e = e ? e : window.event;
  if (e == null) return false;  
  this.blockPropagation(e);      
  if (this.osd_control) this.osd_control.show(false);
  
  // e.scale e.rotation
  //if (e.scale>1) this.zoom(1);
  //else
  //if (e.scale<1) this.zoom(-1);  
  return false;       
}


//-------------------------------------------------------
// Control Events
//-------------------------------------------------------

PanoJS.prototype.zoomInHandler = function(e) {
  this.zoom(1);
};

PanoJS.prototype.zoomOutHandler = function(e) {
  this.zoom(-1);
};

PanoJS.prototype.zoom11Handler = function(e) {
  var coords = {'x':this.controls.houseButton.absoluteX*Math.pow(2, this.zoomLevel)+this.x, 'y':this.controls.houseButton.absoluteY*Math.pow(2, this.zoomLevel)+this.y};
  //this.slideAcceleration=1000;
    this.recenter(coords);
   // this.resetSlideMotion();  
  //this.zoom(this.maxZoomLevel-this.zoomLevel);
};

PanoJS.prototype.maximizeHandler = function(e) {
  this.toggleMaximize();  
};

PanoJS.prototype.houseHandler = function(e) {
  //this.zoom(1);  
};

PanoJS.prototype.houseWheelHandler = function(e) {
  this.mouseWheelHandler(e);  
};

PanoJS.prototype.boughtHandler = function(e) {
	//GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://mobile.wikipedia.org/");
};



PanoJS.prototype.houseDownHandler = function(e) {
  this.houseIsMoving = 1;
  //this.controls.houseButton.style.visibility = "hidden";
  this.ui_listener.onmousemove = callback(this, this.houseMovedHandler);
};

PanoJS.prototype.houseUpHandler = function(e) {
//  this.houseIsMoving = 0;  
// this.ui_listener.onmousemove = function(){};
};
/*
PanoJS.prototype.boatHandler = function(e) {
  //this.zoom(1);  
};*/

PanoJS.prototype.map1Handler = function(e) {
  //Change Map Path;  
  PanoJS.NEWMAP=1;
  this.update();
          document.mainForm.map.value = PanoJS.NEWMAP;
          var elem = document.mainForm.map;
          if (typeof elem.onclick == "function") {
          elem.onclick.apply(elem);}

};

PanoJS.prototype.map2Handler = function(e) {
  //Change Map Path;  
  PanoJS.NEWMAP=2;
  this.update();
          document.mainForm.map.value = PanoJS.NEWMAP;
          var elem = document.mainForm.map;
          if (typeof elem.onclick == "function") {
          elem.onclick.apply(elem);}

};

PanoJS.prototype.map3Handler = function(e) {
  //Change Map Path;  
  PanoJS.NEWMAP=3;
  this.update();
          document.mainForm.map.value = PanoJS.NEWMAP;
          var elem = document.mainForm.map;
          if (typeof elem.onclick == "function") {
          elem.onclick.apply(elem);}

};

PanoJS.prototype.toggleHandler = function(e){
	if(PanoJS.MESSIER_TOGGLE){
		PanoJS.MESSIER_TOGGLE = false;
		for(i=0;i<this.controls.messierButton.length;i++)
		{
			this.controls.messierButton[i].style.visibility = "hidden";
		}
	}
	else {PanoJS.MESSIER_TOGGLE = true;}
	var zero = {'x':0, 'y':0};
	this.moveHouse(zero);
};
	

PanoJS.prototype.map1MouseOverHandler = function(e){ 
alert("map!");
  /*var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP1_OVER;
  img.style.width = "50px";
  this.controls.map1Button.removeChild(this.controls.map1Button.lastChild);
  this.controls.map1Button.appendChild(img);*/
};

PanoJS.prototype.map1MouseOutHandler = function(e){
alert("map!");
  alert("mouse out");
  /*var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP1;
  img.style.width = "50px";
  alert("trying...");
  this.controls.map1Button.removeChild(this.controls.map1Button.lastChild);
  alert("mouse OUT 1");
  this.controls.map1Button.appendChild(img);*/
};

PanoJS.prototype.map2MouseOverHandler = function(e){
alert("map!");
  var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP2_OVER;
  img.style.width = "50px";
  this.controls.map2Button.removeChild(this.controls.map2Button.lastChild);
  this.controls.map2Button.appendChild(img);
};

PanoJS.prototype.map2MouseOutHandler = function(e){
alert("map!");
  var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP2;
  img.style.width = "50px";
  this.controls.map2Button.removeChild(this.controls.map2Button.lastChild);
  this.controls.map2Button.appendChild(img);
};

PanoJS.prototype.map3MouseOverHandler = function(e){
alert("map!");
  var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP3_OVER;
  img.style.width = "50px";
  this.controls.map3Button.appendChild(img);
  this.controls.map3Button.removeChild(this.controls.map3Button.firstChild);
  //alert("Map3 IN");
  
};

PanoJS.prototype.map3MouseOutHandler = function(e){
alert("map!"); 
  var img = document.createElement('img');
  img.src = PanoJS.CONTROL_IMAGE_MAP3;
  img.style.width = "50px";
  this.controls.map3Button.appendChild(img);
  this.controls.map3Button.removeChild(this.controls.map3Button.firstChild);
};

PanoJS.prototype.messierHandler1 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_1"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler2 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_2"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler3 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_3"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler4 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_4"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler5 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_5"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler6 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_6"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler7 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_7"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler8 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_8"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler9 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_9"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler10 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_10"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler11 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_11"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler12 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_12"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler13 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_13"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler14 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_14"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler15 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_15"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler16 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_16"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler17 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_17"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler18 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_18"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler19 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_19"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler20 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_20"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler21 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_21"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler22 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_22"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler23 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_23"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler24 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_24"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler25 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_25"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler26 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_26"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler27 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_27"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler28 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_28"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler29 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_29"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler30 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_30"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler31 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_31"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler32 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_32"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler33 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_33"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler34 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_34"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler35 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_35"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler36 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_36"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler37 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_37"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler38 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_38"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler39 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_39"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler40 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_40"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler41 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_41"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler42 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_42"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler43 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_43"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler44 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_44"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler45 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_45"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler46 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_46"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler47 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_47"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler48 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_48"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler49 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_49"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler50 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_50"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler51 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_51"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler52 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_52"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler53 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_53"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler54 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_54"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler55 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_55"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler56 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_56"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler57 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_57"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler58 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_58"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler59 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_59"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler60 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_60"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler61 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_61"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler62 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_62"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler63 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_63"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler64 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_64"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler65 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_65"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler66 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_66"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler67 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_67"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler68 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_68"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler69 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_69"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler70 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_70"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler71 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_71"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler72 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_72"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler73 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_73"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler74 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_74"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler75 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_75"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler76 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_76"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler77 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_77"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler78 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_78"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler79 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_79"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler80 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_80"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler81 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_81"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler82 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_82"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler83 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_83"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler84 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_84"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler85 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_85"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler86 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_86"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler87 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_87"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler88 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_88"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler89 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_89"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler90 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_90"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler91 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_91"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler92 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_92"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler93 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_93"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler94 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_94"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler95 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_95"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler96 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_96"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler97 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_97"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler98 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_98"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler99 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_99"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler100 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_100"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler101 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_101"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler102 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_103"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler103 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_104"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler104 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_105"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler105 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_106"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler106 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_107"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler107 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_108"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler108 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_109"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler109 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Messier_110"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler110 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Alpha_Camelopardalis"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler111 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_342"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler112 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_1396"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler113 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Deneb"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler114 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://www.ruppel.darkhorizons.org/ic_410.htm"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler115 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/California_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler116= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Sculptor_Galaxy"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler117= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Veil_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler118= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Zeta_Ophiuchi"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler119= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Rho_Ophiuchi"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler120= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_4592"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler121= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Coronet_cluster"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler122= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Omega_Centauri"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler123= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_2944"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler124= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Circinus_Galaxy"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler125= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Gum_nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler126 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Tarantula_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler127 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Small_Magellanic_Cloud"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler128 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Fornax_Cluster"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler129 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/NGC_2359"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler130 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Rosette_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler131 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Seagull_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler132 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Lambda_Orionis"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler133 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Flame_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler134 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_443"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler135 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Polaris"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler136 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Cone_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler137 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Horsehead_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler138 = function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Soul_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler139= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Hubble_deep_field"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler140= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Pelican_Nebula"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler141= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/IC_5146"); PanoJS.GB_ON = true;};
PanoJS.prototype.messierHandler142= function(e) { GB_showCenter("Big Bang Registry Cosmic Object Explorer", "http://en.mobile.wikipedia.org/wiki/Large_Magellanic_Cloud"); PanoJS.GB_ON = true;};


//PanoJS.prototype.map2Handler = function(e) {
//  //Change Map Path;  
//  if(PanoJS.NEWMAP==0){PanoJS.NEWMAP=1;}
//  else {PanoJS.NEWMAP=0;
//  }
//  this.update();
//};



//This is doing nothing at the moment
//PanoJS.prototype.getUrl = function(xIndex, yIndex, zoom){
//    alert("Hello!");
//    var l = formatInt( zoom , 3);
//    var x = formatInt(xIndex, 3);
//    var y = formatInt(yIndex, 3);
//    var pyramidString = "" + l + "_" + x + "_" + y + ".jpg";//?"+zoom; 
//    var returnString = "";
//
//    
//    if(PanoJS.NEWMAP==1){
//        returnString = 'tilesjpg' + '/' + 'tile__' + pyramidString;
//        }
//    if(PanoJS.NEWMAP==0){
//        returnString = 'tilesjpg' + '/' + 'tile__' + pyramidString;
//        }
//    alert(returnString);
//    return returnString;
//    return this.TileUrlProvider.assembleUrl(xIndex,yIndex,zoom);
//}


//-------------------------------------------------------
// PanoJS Events
//-------------------------------------------------------

PanoJS.MoveEvent = function(x, y) {
  this.x = x;
  this.y = y;
};

PanoJS.ZoomEvent = function(x, y, level, scale, width, height) {
  this.x = x;
  this.y = y;
  this.level = level;
  this.scale = scale;
  this.width = width;
  this.height = height;   
};

PanoJS.ResizeEvent = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};




//-------------------------------------------------------
// Tile
//-------------------------------------------------------
    
function Tile(viewer, x, y) {
    this.viewer = viewer;  
    this.element = null;
    this.posx = 0;
    this.posy = 0;
    this.xIndex = x;
    this.yIndex = y;
    this.qx = x;
    this.qy = y;
};

Tile.prototype.createDOMElements = function() {
    //this.dom_info.innerHTML = "";
};

//-------------------------------------------------------
// TileUrlProvider
//-------------------------------------------------------

PanoJS.TileUrlProvider = function(baseUri, prefix, extension) {
  this.baseUri = baseUri;
  this.prefix = prefix;
  this.extension = extension;
}


PanoJS.TileUrlProvider.prototype = {
assembleUrl: function(xIndex, yIndex, zoom) {
    return this.baseUri + '/' +
    this.prefix + zoom + '-' + xIndex + '-' + yIndex + '.' + this.extension +
    (PanoJS.REVISION_FLAG ? '?r=' + PanoJS.REVISION_FLAG : '');
    }
}

