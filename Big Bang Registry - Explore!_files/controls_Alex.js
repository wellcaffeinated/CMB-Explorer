/*******************************************************************************
  Controls - creates buttons for zooming and, full screen 
  
  GSV 3.0 : PanoJS3
  @author Dmitry Fedorov  <fedorov@ece.ucsb.edu>   
  
  Copyright (c) 2010 Dmitry Fedorov, Center for Bio-Image Informatics
  
  using: isClientTouch() and isClientPhone() from utils.js

*******************************************************************************/
 // http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
 function CSVToArray(filePath ){
 var arrData = [[]];
//var filePath = '/panojs3/BoughtHouses.csv'
xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET",filePath,false);
xmlhttp.send(null);
var strData = xmlhttp.responseText;
 
 strDelimiter = ",";
 var objPattern = new RegExp(
 (
 // Delimiters.
 "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
  
 // Quoted fields.
 "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
  
 // Standard fields.
 "([^\"\\" + strDelimiter + "\\r\\n]*))"
 ),
 "gi"
 );


 var arrMatches = null;
 while (arrMatches = objPattern.exec( strData )){
 var strMatchedDelimiter = arrMatches[ 1 ];
 if (
 strMatchedDelimiter.length &&
 (strMatchedDelimiter != strDelimiter)
 ){

 arrData.push( [] );
  
 }
 if (arrMatches[ 2 ]){
 var strMatchedValue = arrMatches[ 2 ].replace(
 new RegExp( "\"\"", "g" ),
 "\""
 );
  
 } else {
 var strMatchedValue = arrMatches[ 3 ];
  
 }
arrData[ arrData.length - 1 ].push( strMatchedValue );
 }
 return( arrData );
 }




PanoJS.CONTROL_IMAGE_ZOOMIN   = "images/32px_plus.png";
PanoJS.CONTROL_IMAGE_ZOOM11   = "images/32px_takemehome.png";
PanoJS.CONTROL_IMAGE_ZOOMOUT  = "images/32px_minus.png";
PanoJS.CONTROL_IMAGE_MAXIMIZE = "images/64px_show.png";
PanoJS.CONTROL_IMAGE_HOUSE = "images/32px_house.png";
PanoJS.CONTROL_IMAGE_BOUGHT = "images/dot_brown_20px.png";
PanoJS.CONTROL_IMAGE_MESSIER = "images/dot_blue_20px.png";
//PanoJS.CONTROL_IMAGE_BOAT = "images/32px_boat.png";
PanoJS.CONTROL_IMAGE_MAP1 = "images/64px_map.png";
PanoJS.CONTROL_IMAGE_MAP2 = "images/64px_wise.png";
PanoJS.CONTROL_IMAGE_MAP3 = "images/64px_wmap.png";
PanoJS.CONTROL_IMAGE_TOGGLE = "images/toggle_icon.png";


PanoJS.CONTROL_IMAGE_MAP1_OVER = "images/64px_map_over.png";
PanoJS.CONTROL_IMAGE_MAP2_OVER = "images/64px_wise_over.png";
PanoJS.CONTROL_IMAGE_MAP3_OVER = "images/64px_wmap_over.png";
 
PanoJS.CONTROL_IMAGE_ZOOMIN_TOUCH   = "images/64px_plus.png";
PanoJS.CONTROL_IMAGE_ZOOM11_TOUCH   = "images/64px_takemehome.png";
PanoJS.CONTROL_IMAGE_ZOOMOUT_TOUCH  = "images/64px_minus.png";
PanoJS.CONTROL_IMAGE_MAXIMIZE_TOUCH = "images/64px_show.png";
PanoJS.CONTROL_IMAGE_HOUSE_TOUCH   = "images/64px_house.png";
PanoJS.CONTROL_IMAGE_BOUGHT_TOUCH   = "images/dot_brown_20px.png";
PanoJS.CONTROL_IMAGE_MESSIER_TOUCH   = "images/dot_blue_20px.png";
//PanoJS.CONTROL_IMAGE_BOAT_TOUCH = "images/48px_boat.png";
PanoJS.CONTROL_IMAGE_MAP1_TOUCH = "images/64px_map.png";
PanoJS.CONTROL_IMAGE_MAP2_TOUCH = "images/64px_wise.png";
PanoJS.CONTROL_IMAGE_MAP3_TOUCH = "images/64px_wmap.png";
PanoJS.CONTROL_IMAGE_TOGGLE_TOUCH = "images/toggle_icon.png";

PanoJS.CONTROL_STYLE = "position: absolute; z-index: 30; "; //opacity:0.5; filter:alpha(opacity=50); ";
PanoJS.CONTROL_STYLE_B = "position: absolute; z-index: 20; "; //opacity:0.5; filter:alpha(opacity=50); ";

PanoJS.CONTROL_ZOOMIN = {
    className : "zoomIn",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_ZOOMIN_TOUCH : PanoJS.CONTROL_IMAGE_ZOOMIN),
    title : "Zoom in",
    style : PanoJS.CONTROL_STYLE + " top: 10px; left: 10px; width: 20px;",
};

PanoJS.CONTROL_ZOOM11 = {
    className : "zoom11",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_ZOOM11_TOUCH : PanoJS.CONTROL_IMAGE_ZOOM11),
    title : "Take me home!",
    style : PanoJS.CONTROL_STYLE + " top: 40px; left: 10px; width: 20px;",
};

PanoJS.CONTROL_ZOOMOUT = {
    className : "zoomOut",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_ZOOMOUT_TOUCH : PanoJS.CONTROL_IMAGE_ZOOMOUT),
    title : "Zoom out",
    style : PanoJS.CONTROL_STYLE + " top: 70px; left: 10px; width: 20px;",
};

PanoJS.CONTROL_MAXIMIZE = {
    className : "maximize",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_MAXIMIZE_TOUCH : PanoJS.CONTROL_IMAGE_MAXIMIZE),
    title : "Maximize",
    style : PanoJS.CONTROL_STYLE + " top: 10px; right: 10px; width: 50px;",
};

PanoJS.CONTROL_HOUSE = {
    className : "house",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_HOUSE_TOUCH : PanoJS.CONTROL_IMAGE_HOUSE),
    title : "House",
    style : PanoJS.CONTROL_STYLE_B + " top: 400px; left: 10px; width: 20px;",
};

PanoJS.CONTROL_BOUGHT = {
    className : "bought",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_BOUGHT_TOUCH : PanoJS.CONTROL_IMAGE_BOUGHT),
    title : "Bought",
    style : PanoJS.CONTROL_STYLE_B + " top: 400px; left: 10px; width: 20px;",
};

PanoJS.CONTROL_MESSIER = {
    className : "messier",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_MESSIER_TOUCH : PanoJS.CONTROL_IMAGE_MESSIER),
    title : "Messier",
    style : PanoJS.CONTROL_STYLE_B + " top: 400px; left: 10px; width: 20px;",
};
/*
PanoJS.CONTROL_BOAT = {
    className : "boat",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_BOAT_TOUCH : PanoJS.CONTROL_IMAGE_BOAT),
    title : "Boat",
    style : PanoJS.CONTROL_STYLE_B + " top: 400px; left: 10px; width: 28px;",
};*/

PanoJS.CONTROL_MAP1 = {
    className : "map1",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_MAP1_TOUCH : PanoJS.CONTROL_IMAGE_MAP1),
    title : "Map1: Geography",
    style : PanoJS.CONTROL_STYLE + " top: 95px; left: 10px; width: 50px;",
};

PanoJS.CONTROL_MAP2 = {
    className : "map2",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_MAP2_TOUCH : PanoJS.CONTROL_IMAGE_MAP2),
    title : "Map2: Infrared",
    style : PanoJS.CONTROL_STYLE + " top: 145px; left: 10px; width: 50px;",
};

PanoJS.CONTROL_MAP3 = {
    className : "map3",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_MAP3_TOUCH : PanoJS.CONTROL_IMAGE_MAP3),
    title : "Map3: Microwave",
    style : PanoJS.CONTROL_STYLE + " top: 195px; left: 10px; width: 50px;",
};

PanoJS.CONTROL_TOGGLE = {
    className : "toggle",
    image : (isClientTouch() ? PanoJS.CONTROL_IMAGE_TOGGLE_TOUCH : PanoJS.CONTROL_IMAGE_TOGGLE),
    title : "Toggle Messier Object",
    style : PanoJS.CONTROL_STYLE + " top: 250px; left: 10px; width: 50px;",
};

if (isClientTouch()) {
  PanoJS.CONTROL_ZOOMIN.style   = PanoJS.CONTROL_STYLE + " top: 15px;  left: 15px;  width: 36px;";
  PanoJS.CONTROL_ZOOM11.style   = PanoJS.CONTROL_STYLE + " top: 75px;  left: 15px;  width: 36px;";
  PanoJS.CONTROL_ZOOMOUT.style  = PanoJS.CONTROL_STYLE + " top: 135px; left: 15px;  width: 36px;";
  PanoJS.CONTROL_MAXIMIZE.style = PanoJS.CONTROL_STYLE + " top: 15px;  right: 15px; width: 36px;";
  PanoJS.CONTROL_HOUSE.style   = PanoJS.CONTROL_STYLE + " top: 300px;  left: 15px;  width: 36px;";
  PanoJS.CONTROL_BOUGHT.style   = PanoJS.CONTROL_STYLE + " top: 300px;  left: 10px;  width: 20px;";
  PanoJS.CONTROL_MESSIER.style   = PanoJS.CONTROL_STYLE + " top: 300px;  left: 10px;  width: 20px;";
  //PanoJS.CONTROL_BOAT.style   = PanoJS.CONTROL_STYLE + " top: 300px;  left: 15px;  width: 36px;";
  PanoJS.CONTROL_MAP1.style   = PanoJS.CONTROL_STYLE + " top: 200px;  left: 15px;  width: 64px;";
  PanoJS.CONTROL_MAP2.style   = PanoJS.CONTROL_STYLE + " top: 300px;  left: 15px;  width: 64px;";
  PanoJS.CONTROL_MAP3.style   = PanoJS.CONTROL_STYLE + " top: 400px;  left: 15px;  width: 64px;";
	PanoJS.CONTROL_TOGGLE.style   = PanoJS.CONTROL_STYLE + " top: 500px;  left: 15px;  width: 64px;";
}

if (isClientPhone()) {
  PanoJS.CONTROL_ZOOMIN.style   = PanoJS.CONTROL_STYLE + " top: 10px;  left: 20px;  width: 86px;";
  PanoJS.CONTROL_ZOOM11.style   = PanoJS.CONTROL_STYLE + " top: 500px; left: 30px;  width: 86px;";
  PanoJS.CONTROL_ZOOMOUT.style  = PanoJS.CONTROL_STYLE + " top: 100px; left: 20px;  width: 86px;";
  PanoJS.CONTROL_MAXIMIZE.style = PanoJS.CONTROL_STYLE + " top: 10px;  right: 20px; width: 86px;";
  PanoJS.CONTROL_HOUSE.style   = PanoJS.CONTROL_STYLE + " top: 360px; left: 30px;  width: 96px;";
  PanoJS.CONTROL_BOUGHT.style   = PanoJS.CONTROL_STYLE + " top: 360px; left: 30px;  width: 96px;";
  PanoJS.CONTROL_MESSIER.style   = PanoJS.CONTROL_STYLE + " top: 360px; left: 30px;  width: 96px;";
  //  PanoJS.CONTROL_BOAT.style   = PanoJS.CONTROL_STYLE + " top: 360px; left: 30px;  width: 96px;";

  PanoJS.CONTROL_MAP1.style   = PanoJS.CONTROL_STYLE + " top: 190px; left: 20px;  width: 86px;";
    PanoJS.CONTROL_MAP2.style   = PanoJS.CONTROL_STYLE + " top: 280px; left: 20px;  width: 86px;";
  PanoJS.CONTROL_MAP3.style   = PanoJS.CONTROL_STYLE + " top: 370px; left: 20px;  width: 86px;";
	PanoJS.CONTROL_TOGGLE.style   = PanoJS.CONTROL_STYLE + " top: 460px; left: 20px;  width: 86px;";
   }



function PanoControls(viewer) {
    this.viewer = viewer;  
    this.boughtData = CSVToArray('/panojs3/BoughtHouses.csv');
	this.boughtNameData = CSVToArray('/panojs3/BoughtNameHouses.csv');
	this.messierData = CSVToArray('/panojs3/MessierData.csv');
	this.messierNameData = CSVToArray('/panojs3/MessierNameData.csv');
    this.initControls;
	this.boughtButton = new Array();
	this.messierButton = new Array();
this.dom_element = this.viewer.viewerDomElement();

    
	for(i=0;i<this.boughtData.length-1;i++){
        this.boughtButton[i] = this.createBOUGHTElements(i);
        this.boughtButton[i].x = this.boughtData[i][0];
        this.boughtButton[i].y = this.boughtData[i][1];
	}

	
	for(i=0;i<this.messierData.length-1;i++){ 
        this.messierButton[i] = this.createMESSIERElements(i);
        this.messierButton[i].x = this.messierData[i][0];
        this.messierButton[i].y = this.messierData[i][1];
		this.messierButton[i].url = this.messierNameData[i][1];
	}
    //this.boatButton = this.createDOMElements2();
		this.houseButton = this.createDOMElements();
	this.map1Button = this.createMap1Elements();
    this.map2Button = this.createMap2Elements();
    this.map3Button = this.createMap3Elements();
	this.toggleButton = this.createToggleElements();

    
}

PanoControls.prototype.initControls = function() {
  if (PanoJS.CONTROL_UPDATED_URLS) return;
  PanoJS.CONTROL_ZOOMIN.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_ZOOMIN.image;
  PanoJS.CONTROL_ZOOM11.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_ZOOM11.image;
  PanoJS.CONTROL_ZOOMOUT.image  = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_ZOOMOUT.image;
  PanoJS.CONTROL_MAXIMIZE.image = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_MAXIMIZE.image;
  PanoJS.CONTROL_HOUSE.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_HOUSE.image;
  //PanoJS.CONTROL_BOAT.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_BOAT.image;
  PanoJS.CONTROL_MAP1.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_MAP1.image;
  PanoJS.CONTROL_MAP2.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_MAP2.image;
  PanoJS.CONTROL_MAP3.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_MAP3.image;  
  PanoJS.CONTROL_TOGGLE.image   = PanoJS.STATIC_BASE_URL+PanoJS.CONTROL_TOGGLE.image; 
  PanoJS.CONTROL_UPDATED_URLS   = true;
}

PanoControls.prototype.createDOMElements = function() {
    //this.dom_element = this.viewer.viewerDomElement();
      
    houseButton = this.createButton (PanoJS.CONTROL_HOUSE,0);
		this.createButton (PanoJS.CONTROL_ZOOMIN,0);
    this.createButton (PanoJS.CONTROL_ZOOM11,0);
    this.createButton (PanoJS.CONTROL_ZOOMOUT,0);
    this.createButton (PanoJS.CONTROL_MAXIMIZE,0);  
    
    //this.createButton (PanoJS.CONTROL_MAP1);
    //this.createButton (PanoJS.CONTROL_MAP2);
    //this.createButton (PanoJS.CONTROL_MAP3);
    return houseButton;
}

PanoControls.prototype.createBOUGHTElements = function(index) {
    btn = this.createButton(PanoJS.CONTROL_BOUGHT,index);
    return btn;    
}

PanoControls.prototype.createMESSIERElements = function(index) {
    btn = this.createButton(PanoJS.CONTROL_MESSIER,index);
    return btn;    
}

PanoControls.prototype.createMap1Elements = function(){
        map1Button = this.createButton(PanoJS.CONTROL_MAP1,0);
        return map1Button;
};

PanoControls.prototype.createMap2Elements = function(){
        map2Button = this.createButton(PanoJS.CONTROL_MAP2,0);
        return map2Button;
};

PanoControls.prototype.createMap3Elements = function(){
        map3Button = this.createButton(PanoJS.CONTROL_MAP3,0);
        return map3Button;
};

PanoControls.prototype.createToggleElements = function(){
        toggleButton = this.createButton(PanoJS.CONTROL_TOGGLE,0);
        return toggleButton;
};

PanoControls.prototype.map1MouseOver = function(map1)
{
    alert("map1...");
}

PanoControls.prototype.createButton = function(control,index) {
      
    var className = control.className;
    var src = control.image;
    var title = control.title;
    var style = control.style;
    
    var btn = document.createElement('span');
    btn.className = className;
    this.dom_element.appendChild(btn); 

    if (style) {
      btn.setAttribute("style", style);
      btn.style.cssText = style;   
    }
    
    //Find random location for the house
    btn.absoluteX = Math.floor(240*Math.random());
    btn.absoluteY = Math.floor(120*Math.random());
    document.mainForm.absoluteX.value = btn.absoluteX;
    document.mainForm.absoluteY.value = btn.absoluteY;
    
    if (control.className == "house")
    {
        btn.style.cssText = PanoJS.CONTROL_STYLE +  " top:360px; left: 30px;  width: 20px;";
		btn.onmousedown = callback(this.viewer, this.viewer[btn.className + 'DownHandler']); 
		btn.onmouseup = callback(this.viewer, this.viewer[btn.className + 'UpHandler']); 
    }
	
	if (control.className == "house" || control.className == "bought" || control.className == "messier")
    {
		btn.onmousewheel = callback(this.viewer, this.viewer['houseWheelHandler']);
    }
    
    //Bought stuff
    btn.x = 1;
    btn.y = 1;
    if(control.className == "bought" ){ btn.style.cssText = PanoJS.CONTROL_STYLE +  " top:-360px; left: 30px;  width: 20px;";}   
	if(control.className == "messier"){ btn.style.cssText = PanoJS.CONTROL_STYLE +  " top:-360px; left: 30px;  width: 20px;";}   //This is where the image width is set
    
    var img = document.createElement('img');
    img.src = src;
    if (title) img.title = title;
    if (btn.style.width) img.style.width = btn.style.width;
    btn.appendChild(img);  
	if(control.className == "bought"){	
		text = document.createTextNode(this.boughtNameData[index]);
		btn.appendChild(text);
	}
	
	if(control.className == "messier"){	
		text = document.createTextNode(this.messierNameData[index][0]);
		btn.appendChild(text);
		btn.onclick = callback(this.viewer, this.viewer[btn.className + 'Handler'+(index+1)]); 
	}
else{    btn.onclick = callback(this.viewer, this.viewer[btn.className + 'Handler']);    }
    return btn;
}
