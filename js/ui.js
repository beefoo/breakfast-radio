'use strict';

var UI = (function() {
  function UI(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  UI.prototype.init = function(){
    this.$stationTime = $("#station-time");
    this.$stationZone = $("#station-zone");
    this.$stationSignal = $("#signal-status");
    this.$stationMarquee = $("#station-label");
    this.$stationMarqueeText = $(".station-label-text");
    this.$knobTime = $("#knob-time");
    this.$knobPlace = $("#knob-place");
    this.$barTime = $("#bar-time");
    this.$barPlace = $("#bar-place");
  };

  UI.prototype.update = function(time, place){
    // update knob ui
    this.$knobPlace.css('transform', 'rotate(' + (place*360) + 'deg)');
    // update slider bar ui
    this.$barPlace.css('left', (place*100) + '%');

    // update knob ui
    this.$knobTime.css('transform', 'rotate(' + (time*360) + 'deg)');
    // update slider bar ui
    this.$barTime.css('left', (time*100) + '%');
  };

  UI.prototype.updatePerson = function(person){
    if (person) {
      this.$stationMarqueeText.text("Now playing: "+person.label);
      this.$stationMarquee.addClass("active");
      this.$stationSignal.css('opacity', person.signal);

    } else {
      this.$stationMarqueeText.text("No signal");
      this.$stationMarquee.removeClass("active");
      this.$stationSignal.css('opacity', 0);
    }
  };

  UI.prototype.updateTime = function(minutes) {
    var hour = parseInt(Math.floor(minutes / 60));
    var minute = minutes - hour * 60;
    this.$stationTime.text(pad(hour, 2) + ":" + pad(minute, 2));
  };

  UI.prototype.updateZone = function(zone) {
    if (zone >= 0) zone = "+" + zone;
    var timezone = "GMT"+zone+":00";
    this.$stationZone.text("(" + timezone + ")");
  };

  return UI;

})();
