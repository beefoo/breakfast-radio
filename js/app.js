'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function findPerson(data, time, place) {
    var match = false;

    var matches = _.filter(data, function(d){
      return (time >= d.timeSignalStartNormal && time <= d.timeSignalEndNormal && place >= d.placeSignalStartNormal && place < d.placeSignalEndNormal);
    });

    // add signal strength
    // signal strength of 1 = place and time are exactly in the center of audio track
    // signal strength of 0 = place and time are at the very edges of audio track
    matches = _.map(matches, function(m){
      var d = _.clone(m);
      d.signal = getSignal(d, time, place);
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

    return match;
  }

  function getPosition(d, time) {
    var n = norm(time, d.timeStartNormal, d.timeEndNormal);
    return d.duration * n;
  }

  function getSignal(d, time, place) {
    var timeSignal = 1.0 - Math.abs((norm(time, d.timeSignalStartNormal, d.timeSignalEndNormal) * 2) - 1);
    var placeSignal = 1.0 - Math.abs((norm(place, d.placeSignalStartNormal, d.placeSignalEndNormal) * 2) - 1);
    return (timeSignal + placeSignal) * 0.5;
  }

  App.prototype.init = function(){
    var _this = this;

    this.timeStep = 1.0 / (this.opt.maxTime - this.opt.minTime);
    this.lastUpdated = new Date();

    this.data = this.parseData(MANIFEST.slice(0));

    this.initTimeSpace();
    this.ui = new UI({});
    this.audio = new Audio({});

    // wait for a click to start things (to comply with browser audio autoplay policy)
    $(".start-app").on("click", function(e){
      $(".instructions-container").removeClass("active");
      Pizzicato.context.resume();
      _this.loadListeners();
      _this.render();
    });


  };

  App.prototype.initTimeSpace = function(){
    var minTime = this.opt.minTime;
    var maxTime = this.opt.maxTime;

    // set the radio to the current time if we can find a match
    var now = new Date();
    var timezone = now.getTimezoneOffset() / -60;
    if (timezone===-4) timezone = -5; // hack
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = hours * 60 * 60 + minutes * 60;
    var timeNormal = norm(seconds, minTime, maxTime);
    var placeNormal = (timezone + 11) / 24;
    var match = findPerson(this.data, timeNormal, placeNormal);

    // match found
    if (match) {
      this.time = timeNormal;
      this.place = placeNormal;
      this.currentPersonIndex = match.index;
      return;
    }

    // otherwise, choose a random person
    var sample = _.filter(this.data, function(d){ return d.zone === -5 && d.hour < 10 && d.hour > 7; });
    var index = _.random(sample.length - 1);
    var startingPerson = sample[index];

    this.time = startingPerson.timeCenterNormal;
    this.place = startingPerson.timezoneNormal;

    this.currentPersonIndex = startingPerson.index;
  };

  App.prototype.loadKnobListener = function(knobListenerId, callback, startValue){
    var _this = this;
    var knobSensitivity = this.opt.knobSensitivity;

    // listen to knob
    var $knobListener = $(knobListenerId);
    var knobListener = $knobListener[0];
    var knobRegion = new ZingTouch.Region(knobListener);
    var knobAngle = startValue * 360;
    var onKnobRotate = function(e){
      // console.log(e)
      if (!_this.seeking) {
        knobAngle += e.detail.distanceFromLast * knobSensitivity;
        knobAngle = clamp(knobAngle, 0, 360);
        callback(knobAngle/360.0);
      }
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
    var onResize = function(){
      _this.onResize();
    };
    var onSeek = function(e) {
      e.preventDefault();
      var direction = 1;
      if ($(e.target).hasClass("prev")) direction = -1;
      _this.onSeek(direction);
    };
    var onAudioLoad = function(e, person) {
      _this.ui.onAudioLoad(person);
    };

    this.loadKnobListener("#knob-time-listener", onTimeChange, this.time);
    this.loadKnobListener("#knob-place-listener", onPlaceChange, this.place);
    $(window).on('resize', onResize);
    $(document).on("audio.loaded", onAudioLoad);
    $('.seek').on('click', onSeek)
  };

  App.prototype.onPlaceChange = function(percent){
    this.place = percent;
    this.update();
  };

  App.prototype.onResize = function(){
    this.audio.onResize();
  };

  App.prototype.onSeek = function(direction){
    if (this.seeking) return false;

    var now = new Date();
    this.seeking = true;
    this.seekStart = now.getTime();
    this.seekEnd = this.seekStart + this.opt.seekMs;

    this.seekFromTime = this.time;
    this.seekFromPlace = this.place;

    // select next station
    var dataLen = this.data.length;
    var nextIndex = this.currentPersonIndex + direction;
    if (nextIndex < 0) nextIndex = dataLen - 1;
    if (nextIndex >= dataLen) nextIndex = 0;
    var nextStation = this.data[nextIndex];

    this.currentPersonIndex = nextIndex;
    this.seekToTime = nextStation.timeCenterNormal;
    this.seekToPlace = nextStation.timezoneNormal;
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

      d.timeStart = d.hour * 60 * 60 + d.minute * 60;
      d.timeEnd = d.timeStart + d.duration;
      if (d.timeEnd > maxTime) {
        d.timeEnd = maxTime;
        d.timeStart = maxTime - d.duration;
      }
      d.timeStartNormal = norm(d.timeStart, minTime, maxTime);
      d.timeEndNormal = norm(d.timeEnd, minTime, maxTime);
      d.timeCenterNormal = d.timeStartNormal + (d.timeEndNormal-d.timeStartNormal) * 0.5;
      d.timeSignalStartNormal = norm(d.timeStart-timePad, minTime, maxTime);
      d.timeSignalEndNormal = norm(d.timeEnd+timePad, minTime, maxTime);

      var zone = d.zone+11;
      d.timezone = TIMEZONES[zone];
      d.timezoneNormal = zone/24;
      d.placeNormal = norm(d.lon, -180.0, 180.0);
      d.placeSignalStartNormal = norm(d.lon-placePad, -180.0, 180.0);
      d.placeSignalEndNormal = norm(d.lon+placePad, -180.0, 180.0);

      d.filename = audioDir + d.filename;

      return d;
    });

    var sortedData = _.sortBy(parsedData, function(d){
      return d.timeCenterNormal + d.zone;
    });

    var indexedData = _.map(sortedData, function(obj, i){
      var d = _.clone(obj);
      d.id = ""+i;
      d.index = i;
      return d;
    });

    return indexedData;
  };

  App.prototype.render = function(){
    var _this = this;
    var now = new Date();
    now = now.getTime();

    // we are seeking
    if (this.seeking) {
      var progress = norm(now, this.seekStart, this.seekEnd);

      // done seeking
      if (progress >= 1) {
        progress = 1.0;
        this.seeking = false;
      }

      this.time = lerp(this.seekFromTime, this.seekToTime, progress);
      this.place = lerp(this.seekFromPlace, this.seekToPlace, progress);
      this.update();

    // else just increment time
    } else {
      var deltaSeconds = (now - this.lastUpdated) / 1000.0;
      var deltaPercent = deltaSeconds * this.timeStep;
      var newTime = clamp(this.time + deltaPercent, 0, 1);
      this.lastUpdated = now;
      this.time = newTime;
      this.update(true);
    }

    // update audio viz
    this.audio.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.updatePerson = function(){
    var match = findPerson(this.data, this.time, this.place);

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

  App.prototype.update = function(isAuto){
    var timeChanged = this.updateTime();
    var zoneChanged = this.updateZone();
    var personChanged = false;

    if (timeChanged || zoneChanged) {
      personChanged = this.updatePerson();
    }

    if (personChanged && this.currentPerson
        && (!this.seeking || this.seeking && this.currentPerson.index===this.currentPersonIndex)) {
      var position = getPosition(this.currentPerson, this.time);
      this.audio.updatePerson(this.currentPerson, position);

    } else if (!isAuto && timeChanged && this.currentPerson) {
      var signal = getSignal(this.currentPerson, this.time, this.place);
      var position = getPosition(this.currentPerson, this.time);
      this.audio.updatePerson(this.currentPerson, position, signal);
    }

    if ((personChanged || !isAuto) && !this.currentPerson) {
      this.audio.updateStatic();
    }

    // pre-load person before and after
    if (personChanged && this.currentPerson) {
      var data = this.data;
      var len = data.length;
      var after = this.currentPerson.index + 1;
      var before = this.currentPerson.index - 1;
      if (after >= len) after = 0;
      if (before < 0) before = len - 1;
      this.audio.preload(data[after]);
      this.audio.preload(data[before]);
    }

    // update the knobs always
    this.ui.update(this.time, this.place);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
