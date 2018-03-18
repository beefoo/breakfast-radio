'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.time = this.opt.startTime;
    this.place = this.opt.startPlace;
    this.timeStep = 1.0 / (this.opt.maxTime - this.opt.minTime);
    this.lastUpdated = new Date();

    this.data = this.parseData(MANIFEST.slice(0));

    this.ui = new UI({});
    this.audio = new Audio({});

    this.loadListeners();

    this.render();
  };

  App.prototype.loadKnobListener = function(knobListenerId, callback, startValue){
    var _this = this;
    var knobSensitivity = this.opt.knobSensitivity;

    // listen to knob
    var $knobListener = $(knobListenerId);
    var $knob = $($knobListener.attr("data-target"));
    var knobListener = $knobListener[0];
    var knobRegion = new ZingTouch.Region(knobListener);
    var knobAngle = startValue * 360;
    var onKnobRotate = function(e){
      knobAngle += e.detail.distanceFromLast * knobSensitivity;
      knobAngle = clamp(knobAngle, 0, 360);
      callback(knobAngle/360.0);
    };
    knobRegion.bind(knobListener, 'rotate', onKnobRotate);
    callback(startValue);
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var onTimeChange = function(percent){
      _this.onTimeChange(percent);
    };
    var onPlaceChange = function(percent){
      _this.onPlaceChange(percent);
    };
    this.loadKnobListener("#knob-time-listener", onTimeChange, this.opt.startTime);
    this.loadKnobListener("#knob-place-listener", onPlaceChange, this.opt.startPlace);
  };

  App.prototype.onPlaceChange = function(percent){
    this.place = percent;
    this.update();
  };

  App.prototype.onTimeChange = function(percent){
    this.time = percent;
    this.update();
  };

  App.prototype.parseData = function(data){
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

      d.filename = audioDir + d.filename;

      return d;
    });

    return parsedData;
  };

  App.prototype.render = function(){
    var _this = this;

    // increment time
    var now = new Date();
    var deltaSeconds = (now - this.lastUpdated) / 1000.0;
    var deltaPercent = deltaSeconds * this.timeStep;
    var newTime = clamp(this.time + deltaPercent, 0, 1);
    this.lastUpdated = now;

    this.time = newTime;
    var timeChanged = this.updateTime();
    if (timeChanged) {
      this.updatePerson();
    }
    // update the knobs always
    this.ui.update(this.time, this.place);

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.updatePerson = function(){
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

    // check to see if the person is changed
    var prev = this.currentPerson;
    var changed = (!prev && match || prev && !match || prev && match && match.index !== prev.index);
    if (changed) this.ui.updatePerson(match);
    this.currentPerson = match;

    return changed;
  };

  App.prototype.updateTime = function(){
    var time = this.time;

    // check to see if minute has changed
    var seconds = lerp(this.opt.minTime, this.opt.maxTime, time);
    seconds = parseInt(Math.round(seconds));
    var prev = this.currentTime;
    var changed = (!prev || prev && seconds !== prev);
    if (changed) this.ui.updateTime(seconds);
    this.currentTime = seconds;

    return changed;
  };

  App.prototype.updateZone = function(){
    var place = this.place;

    // check to see if zone has changed
    var zone = parseInt(Math.round(place * 23)) - 11;
    var prev = this.currentZone;
    var changed = (!prev || prev && zone !== prev);
    if (changed) this.ui.updateZone(zone);
    this.currentZone = zone;

    return changed;
  };

  App.prototype.update = function(){
    var timeChanged = this.updateTime();
    var zoneChanged = this.updateZone();

    if (timeChanged || zoneChanged) {
      var personChanged = this.updatePerson();
    }

    // update the knobs always
    this.ui.update(this.time, this.place);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
