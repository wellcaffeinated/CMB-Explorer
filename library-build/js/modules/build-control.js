define(["jquery","stapes","plugins/tpl!templates/build-control.tpl"],function($,Stapes,template){var BuildControl=Stapes.create().extend({options:{},init:function(opts){var self=this,el=$("<div>"+template.render()+"</div>");return this.extend(this.options,opts),self.set("el",el[0]),el.on("click",".control",function(e){e.preventDefault();var $this=$(this).toggleClass("active");self.emit("toggle",$this.is(".active"))}),this.emit("ready"),this}});return{init:function(opts){return BuildControl.create().init(opts)}}})