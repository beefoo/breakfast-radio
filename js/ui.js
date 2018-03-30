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

    this.peopleIds = [];
  };

  UI.prototype.onAudioLoad = function(person){
    var id = person.id;
    this.peopleIds.push(id);

    this.updatePerson(person);
  };

  UI.prototype.update = function(time, place){
    var placeDegree = round(place * 360, 1);
    var timeDegree = round(time * 360, 1);

    var placeChanged = this.placeDegree===undefined || this.placeDegree !== placeDegree;
    var timeChanged = this.timeDegree===undefined || this.timeDegree !== timeDegree;
    this.placeDegree = placeDegree;
    this.timeDegree = timeDegree;

    if (placeChanged) {
      // update knob ui
      this.$knobPlace.css('transform', 'rotate(' + (place*360) + 'deg)');
      // update slider bar ui
      this.$barPlace.css('left', (place*100) + '%');
    }

    if (timeChanged) {
      // update knob ui
      this.$knobTime.css('transform', 'rotate(' + (time*360) + 'deg)');
      // update slider bar ui
      this.$barTime.css('left', (time*100) + '%');
    }
  };

  UI.prototype.updatePerson = function(person){
    if (person) {
      this.$stationMarqueeText.text("Now playing: "+person.label);
      this.$stationMarquee.addClass("active");
      this.$stationSignal.css('opacity', 1);

      // var id = person.id;
      // var index = this.peopleIds.indexOf(id);
      //
      // if (index >= 0) {
      //   this.$stationMarqueeText.text("Now playing: "+person.label);
      //   this.$stationSignal.css('opacity', 1);
      //
      // // audio not loaded yet
      // } else {
      //   this.$stationMarqueeText.text("Acquiring signal: "+person.label);
      //   this.$stationSignal.css('opacity', 0.5);
      // }

    } else {
      this.$stationMarqueeText.text("No signal");
      this.$stationMarquee.removeClass("active");
      this.$stationSignal.css('opacity', 0);
    }
  };

  UI.prototype.updateTime = function(seconds) {
    var hour = parseInt(Math.floor(seconds / 60 / 60));
    var minutes = parseInt(Math.floor(seconds / 60));

    var minute = minutes - hour * 60;
    var second = seconds - hour * 60 * 60 - minute * 60;
    this.$stationTime.text(pad(hour, 2) + ":" + pad(minute, 2) + ":" + pad(second, 2));
  };

  UI.prototype.updateZone = function(zone) {
    if (zone >= 0) zone = "+" + zone;
    var timezone = "GMT"+zone+":00";
    this.$stationZone.text("(" + timezone + ")");
  };

  return UI;

})();
