/** @license
 * RequireJS plugin for loading JSON files
 * - depends on Text plugin and it was HEAVILY "inspired" by it as well.
 * Author: Miller Medeiros
 * Version: 0.2.1 (2012/04/17)
 * Released under the MIT license
 */

define(["text"],function(text){function cacheBust(url){return url=url.replace(CACHE_BUST_FLAG,""),url+=url.indexOf("?")<0?"?":"&",url+CACHE_BUST_QUERY_PARAM+"="+Math.round(2147483647*Math.random())}var CACHE_BUST_QUERY_PARAM="bust",CACHE_BUST_FLAG="!bust",jsonParse=typeof JSON!="undefined"&&typeof JSON.parse=="function"?JSON.parse:function(val){return eval("("+val+")")},buildMap={};return{load:function(name,req,onLoad,config){!config.isBuild||config.inlineJSON!==!1&&name.indexOf(CACHE_BUST_QUERY_PARAM+"=")===-1?text.get(req.toUrl(name),function(data){config.isBuild?(buildMap[name]=data,onLoad(data)):onLoad(jsonParse(data))}):onLoad(null)},normalize:function(name,normalize){return name.indexOf(CACHE_BUST_FLAG)===-1?name:cacheBust(name)},write:function(pluginName,moduleName,write){if(moduleName in buildMap){var content=buildMap[moduleName];write('define("'+pluginName+"!"+moduleName+'", function(){ return '+content+";});\n")}}}})