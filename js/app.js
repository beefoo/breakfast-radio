'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      "audioDir": "audio/",
      "knobSensitivity": 0.5 // higher = more sensitive
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function clamp(value, lower, upper) {
    if (value > upper) value = upper;
    if (value < lower) value = lower;
    return value;
  }

  App.prototype.init = function(){
    var _this = this;

    this.files = MANIFEST.slice(0);

    this.$knobTime = $("#knob-time");
    this.$knobPlace = $("#knob-place");
    this.$barTime = $("#bar-time");
    this.$barPlace = $("#bar-place");

    this.loadListeners();
    this.loadRadio();
  };

  App.prototype.loadKnobListener = function(knobListenerId, callback){
    var _this = this;
    var knobSensitivity = this.opt.knobSensitivity;

    // listen to knob
    var $knobListener = $(knobListenerId);
    var $knob = $($knobListener.attr("data-target"));
    var knobListener = $knobListener[0];
    var knobRegion = new ZingTouch.Region(knobListener);
    var knobAngle = parseFloat($knobListener.attr("data-angle"));
    var onKnobRotate = function(e){
      knobAngle += e.detail.distanceFromLast * knobSensitivity;
      knobAngle = clamp(knobAngle, 0, 360);
      callback(knobAngle/360.0);
    };
    knobRegion.bind(knobListener, 'rotate', onKnobRotate);
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var onTimeChange = function(percent){
      _this.onTimeChange(percent);
    };
    var onPlaceChange = function(percent){
      _this.onPlaceChange(percent);
    };

    this.loadKnobListener("#knob-time-listener", onTimeChange);
    this.loadKnobListener("#knob-place-listener", onPlaceChange);
  };

  App.prototype.loadRadio = function(){
    this.radio = new Radio();
  };

  App.prototype.onTimeChange = function(percent){
    // update knob ui
    this.$knobTime.css('transform', 'rotate(' + (percent*360) + 'deg)');
    // update slider bar ui
    this.$barTime.css('left', (percent*100) + '%');
  };

  App.prototype.onPlaceChange = function(percent){
    // update knob ui
    this.$knobPlace.css('transform', 'rotate(' + (percent*360) + 'deg)');
    // update slider bar ui
    this.$barPlace.css('left', (percent*100) + '%');
  };

  App.prototype.render = function(){

  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
