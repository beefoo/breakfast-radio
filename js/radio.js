'use strict';

var Radio = (function() {
  function Radio(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Radio.prototype.init = function(){
    var _this = this;

    this.data = this.parseData(MANIFEST);
    // console.log(this.data);

    this.$station = $("#station");
    this.$stationSignal = $("#signal-status");
    this.$stationMarquee = $("#station-label");
    this.$stationMarqueeText = $(".station-label-text");

    this.time = this.opt.startTime;
    this.place = this.opt.startPlace;

    this.loadStatic();
  };

  Radio.prototype.loadStatic = function(){
    // https://noisehack.com/generate-noise-web-audio-api/
    var radioStatic = new Pizzicato.Sound(function(e) {
      var output = e.outputBuffer.getChannelData(0);
      var lastOut = 0.0;
      for (var i = 0; i < e.outputBuffer.length; i++) {
        var white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
      }
    });
    this.radioStatic = radioStatic;
    // this.radioStatic.play();
  };

  Radio.prototype.parseData = function(data){
    var audioDir = this.opt.audioDir;
    var minTime = this.opt.minTime;
    var maxTime = this.opt.maxTime;
    var timePad = this.opt.timePad;
    var placePad = this.opt.placePad;

    var parsedData = _.map(data, function(obj, i){
      var d = _.clone(obj);
      d.index = i;
      d.timeStart = d.hour * 60 * 60 + d.minute * 60;
      d.timeEnd = d.timeStart + d.duration;
      if (d.timeEnd > maxTime) {
        d.timeEnd = maxTime;
        d.timeStart = maxTime - d.duration;
      }
      d.timeStartNormal = norm(d.timeStart, minTime, maxTime);
      d.timeEndNormal = norm(d.timeEnd, minTime, maxTime);
      d.timeSignalStartNormal = norm(d.timeStart-timePad, minTime, maxTime);
      d.timeSignalEndNormal = norm(d.timeEnd+timePad, minTime, maxTime);

      var zone = d.zone+11;
      d.timezone = TIMEZONES[zone];
      d.placeNormal = norm(d.lon, -180.0, 180.0);
      d.placeSignalStartNormal = norm(d.lon-placePad, -180.0, 180.0);
      d.placeSignalEndNormal = norm(d.lon+placePad, -180.0, 180.0);
      return d;
    });

    return parsedData;
  };

  Radio.prototype.playAudio = function(person){

  };

  Radio.prototype.playStatic = function(){

  };

  Radio.prototype.update = function(){
    var place = this.place;
    var time = this.time;
    var match = false;

    var matches = _.filter(this.data, function(d){
      return (time >= d.timeSignalStartNormal && time <= d.timeSignalEndNormal && place >= d.placeSignalStartNormal && place < d.placeSignalEndNormal);
    });

    // add signal strength
    // signal strength of 1 = place and time are exactly in the center of audio track
    // signal strength of 0 = place and time are at the very edges of audio track
    matches = _.map(matches, function(m){
      var d = _.clone(m);
      var timeSignal = 1.0 - Math.abs((norm(time, d.timeSignalStartNormal, d.timeSignalEndNormal) * 2) - 1);
      var placeSignal = 1.0 - Math.abs((norm(place, d.placeSignalStartNormal, d.placeSignalEndNormal) * 2) - 1);
      d.signal = (timeSignal + placeSignal) * 0.5;
      return d;
    });

    // more than one matched, take the one with the strongest signal
    if (matches.length > 1) {
      var sorted = _.sortBy(matches, function(d){ return 1.0 - d.signal; });
      match = sorted[0];

    // only one matched
    } else if (matches.length > 0) {
      match = matches[0];
    }

    if (match) {
      this.updateUI(match);
      this.playAudio(match);
    } else {
      this.updateUI(false);
      this.playStatic();
    }

  };

  Radio.prototype.updatePlace = function(percent){
    this.place = percent;
    this.update();
  };

  Radio.prototype.updateTime = function(percent){
    this.time = percent;
    this.update();
  };

  Radio.prototype.updateUI = function(person){
    var prev = this.person;
    var changed = (!prev && person || prev && !person || prev && person && person.index !== prev.index);

    var zone = parseInt(Math.round(this.place * 23)) - 11;
    if (zone >= 0) zone = "+" + zone;
    var timezone = "GMT"+zone+":00";
    var time = lerp(this.opt.minTime, this.opt.maxTime, this.time);
    var hour = parseInt(Math.floor(time / 60 / 60));
    var minute = parseInt(Math.floor(time / 60) - hour * 60);

    this.$station.text(pad(hour, 2) + ":" + pad(minute, 2) + " (" + timezone + ")")

    if (changed && person) {
      this.$stationMarqueeText.text("Now playing: "+person.label);
      if (!prev) this.$stationMarquee.addClass("active");

    } else if (changed) {
      this.$stationMarqueeText.text("No signal");
      this.$stationMarquee.removeClass("active");
    }

    if (person) {
      this.$stationSignal.css('opacity', person.signal);
    }

    this.person = person;
  };

  return Radio;

})();
