/*!
 * Mediator implementation
 */

define(["jquery"],function($){var topics={},proxyCache={},pubsub=function(id){var callbacks,method,topic;return id.length&&(topic=topics[id]),topic||(callbacks=$.Callbacks(),topic={publish:callbacks.fire,subscribe:callbacks.add,unsubscribe:callbacks.remove},id&&(topics[id]=topic)),topic},API={publish:function(ch,args){var obj=pubsub(ch);return obj.publish.apply(obj,Array.prototype.splice.call(arguments,1)),this},subscribe:function(ch,chOrFn){return typeof chOrFn=="string"?(proxyCache[chOrFn]=proxyCache[chOrFn]||$.proxy(pubsub(chOrFn),"publish"),pubsub(ch).subscribe(proxyCache[chOrFn])):pubsub(ch).subscribe(chOrFn),this},unsubscribe:function(ch,chOrFn){typeof chOrFn=="string"?(proxyCache[chOrFn]=proxyCache[chOrFn]||$.proxy(pubsub(chOrFn),"publish"),pubsub(ch).unsubscribe(proxyCache[chOrFn])):pubsub(ch).unsubscribe(chOrFn)}};return API})