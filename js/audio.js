'use strict';

var Audio = (function() {
  function Audio(options) {
    var defaults = {
      bufferLength: 5
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Audio.prototype.init = function(){

    this.audioBuffers = {};

    this.loadStatic();
  };

  Audio.prototype.loadStatic = function(){
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

  Audio.prototype.pauseAudio = function(){
    var _this = this;
    
    // pause current audio
    _.each(this.audioBuffers, function(a, id){
      if (a.loaded) {
        a.buf.volume = 0;
        a.buf.pause();
      }
      _this.audioBuffers[id].playing = false;
    });
  };

  Audio.prototype.pauseStatic = function(){
    this.playStatic(0);
  };

  Audio.prototype.playAudio = function(person, position, signal){
    var _this = this;

    // retrieve existing buffer
    if (signal===undefined) signal = person.signal;
    var bufferIds = _.keys(this.audioBuffers);
    var bufferId = person.id;
    var bufferIndex = bufferIds.indexOf(bufferId);

    // play audio buffer
    var playAudioBuffer = function(a){
      if (a.loaded && a.playing) {
        a.buf.volume = a.signal;
        a.buf.play(0, a.position);
      }
    };

    // play existing audio buffer
    if (bufferIndex >= 0) {
      this.audioBuffers[bufferId].playing = true;
      this.audioBuffers[bufferId].signal = signal;
      this.audioBuffers[bufferId].position = position;
      playAudioBuffer(this.audioBuffers[bufferId]);

    // load and play new audio buffer
    } else {
      var buf = new Pizzicato.Sound(person.filename, function() {
        console.log(person.filename + " loaded.");
        _this.audioBuffers[bufferId].loaded = true;
        playAudioBuffer(_this.audioBuffers[bufferId]);
      });
      this.audioBuffers[bufferId] = {
        buf: buf,
        loaded: false,
        playing: true,
        signal: signal,
        position: position
      };
    }
  };

  Audio.prototype.playStatic = function(signal){
    if (signal === undefined) signal = Math.random() * 0.25;
    this.radioStatic.volume = signal;
    this.radioStatic.play();
  };

  Audio.prototype.render = function(){

  };

  Audio.prototype.updatePerson = function(person, position, signal){
    this.pauseAudio();

    // if no person, play random static
    if (!person) {
      this.playStatic();

    } else {
      this.pauseStatic();
      this.playAudio(person, position, signal);
    }
  };

  Audio.prototype.updateStatic = function(){
    this.pauseAudio();
    this.playStatic();
  };

  return Audio;

})();
