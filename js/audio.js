'use strict';

var Audio = (function() {
  function Audio(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Audio.prototype.init = function(){
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

  };

  Audio.prototype.playStatic = function(){

  };

  Audio.prototype.render = function(){

  };

  Audio.prototype.updatePerson = function(person){

  };

  return Audio;

})();
