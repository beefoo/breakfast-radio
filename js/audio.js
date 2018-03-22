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

    this.audioBuffers = [];
    this.audioBufferIds = [];

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

  Audio.prototype.playAudio = function(person){
    var _this = this;

    // pause current audio
    if (this.currentBuffer) this.currentBuffer.pause();

    // if no person, play random static
    if (!person) {
      this.playStatic(Math.random() * 0.5 + 0.5);
      return false;
    }

    // retrieve existing buffer
    var signal = person.signal;
    var bufferIndex = this.audioBufferIds.indexOf(person.id);
    var audioBuffer = false;
    var bufferLength = this.opt.bufferLength;

    // play audio buffer
    var playAudioBuffer = function(buf, sig, pos){
      buf.volume = sig;
      buf.play(0, pos);
      _this.currentBuffer = buf;
      _this.playStatic(1.0 - sig);
    };

    // play existing audio buffer
    if (bufferIndex >= 0) {
      audioBuffer = this.audioBuffers[bufferIndex];
      playAudioBuffer(audioBuffer, signal);

    // load and play new audio buffer
    } else {
      audioBuffer = new Pizzicato.Sound(person.filename, function() {
        console.log(person.filename + " loaded.");
        // limit number of audio buffers in memory
        if (_this.audioBufferIds.length >= bufferLength) {
          _this.audioBufferIds.pop();
          _this.audioBuffers.pop();
        }
        _this.audioBufferIds.unshift(person.id);
        _this.audioBuffers.unshift(audioBuffer);
        playAudioBuffer(audioBuffer, signal);
      });
    }

  };

  Audio.prototype.playStatic = function(signal){
    this.radioStatic.volume = signal;
    this.radioStatic.play();
  };

  Audio.prototype.render = function(){

  };

  Audio.prototype.updatePerson = function(person, position){
    this.playAudio(person, position);
  };

  return Audio;

})();
