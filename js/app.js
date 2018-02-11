'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      "audioDir": "audio/"
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.files = MANIFEST.slice(0);
  };

  App.prototype.loadListeners = function(){
    var _this = this;
  };

  App.prototype.onResize = function(){

  };

  App.prototype.render = function(){

  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
