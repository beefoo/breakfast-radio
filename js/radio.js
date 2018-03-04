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

    this.time = this.opt.time;
    this.place = this.opt.place;

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

    var parsedData = _.each(data, function(obj, i){
      var d = _.clone(obj);
      d.timeStart = d.hour * 60 * 60 + d.minute * 60;
      d.timeEnd = d.timeStart + d.duration;
      if (d.timeEnd > maxTime) {
        d.timeEnd = maxTime;
        d.timeStart = maxTime - d.duration;
      }
      d.timeStartNormal = norm(d.timeStart, minTime, maxTime);
      d.timeEndNormal = norm(d.timeEnd, minTime, maxTime);
      d.timezone = TIMEZONES[d.zone+11];
      d.placeStartNormal = d.zone+11 / 24.0;
      d.placeEndNormal = d.placeStartNormal + 1.0 / 24.0;
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
      return (time >= d.timeStartNormal && time <= d.timeEndNormal && place >= d.placeStartNormal && place < d.placeEndNormal);
    });

    // more than one matched
    if (matches.length > 1) {

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
  };

  Radio.prototype.updateTime = function(percent){
    this.time = percent;
  };

  Radio.prototype.updateUI = function(person){

  };

  return Radio;

})();
