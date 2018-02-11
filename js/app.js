'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      "audioDir": "audio/"
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

    this.$knob = $("#knob");
    this.$knobListener = $("#knob-listener");
    this.$switch = $("#switch");
    this.$bar = $("#bar");

    this.knobAngle = 0;
    this.timeMode = true;

    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    // listen to knob
    var $knobListener = this.$knobListener;
    var knobListener = $knobListener[0];
    var knobRegion = new ZingTouch.Region(knobListener);
    var onKnobRotate = function(e){
      _this.onKnobRotate(e.detail.distanceFromLast);
    };
    knobRegion.bind(knobListener, 'rotate', onKnobRotate);

    var onSwitchClick = function(e){
      _this.onSwitchClick();
    };
    this.$switch.on('click', onSwitchClick);
  };

  App.prototype.onKnobRotate = function(angleDelta){
    // update knob UI
    var knobAngle = this.knobAngle + angleDelta;
    knobAngle = clamp(knobAngle, 0, 360);
    this.$knob.css('transform', 'rotate(' + knobAngle + 'deg)');

    // update slider bar ui
    var percent = knobAngle / 360.0;
    this.$bar.css('left', (percent*100) + '%');

    this.knobAngle = knobAngle;
  };

  App.prototype.onSwitchClick = function(){
    var $switch = this.$switch;

    $switch.toggleClass('switched');
    this.timeMode = !$switch.hasClass("switched");
  };

  App.prototype.render = function(){

  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
