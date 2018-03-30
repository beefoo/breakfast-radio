'use strict';

var Audio = (function() {
  function Audio(options) {
    var defaults = {
      el: "#station-viz",
      barCount: 64
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  function getBarHeight(value, canvasHeight) {
    var floorLevel = 0;
    var height = Math.max(0, (value - floorLevel));
    height = (height / (256 - floorLevel)) * canvasHeight;
    return height;
  }

  Audio.prototype.init = function(){

    this.$el = $(this.opt.el);
    this.audioBuffers = {};
    this.currentBufferId = false;

    this.loadAnalyzer();
    this.loadStatic();
    this.loadViz();
  };

  Audio.prototype.loadAnalyzer = function(){
    var barCount = this.opt.barCount;
    var analyzer = Pizzicato.context.createAnalyser();

    analyzer.fftSize = barCount * 4;
    var bufferLength = analyzer.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    this.analyzer = analyzer;
    this.analyzerBuf = dataArray;
    this.analyzerBuflen = bufferLength;
  };

  Audio.prototype.loadStatic = function(){
    // https://noisehack.com/generate-noise-web-audio-api/
    var radioStatic = new Pizzicato.Sound({
      source: 'script',
      options: {
        audioFunction: function(e){
          var output = e.outputBuffer.getChannelData(0);
          var lastOut = 0.0;
          for (var i = 0; i < e.outputBuffer.length; i++) {
            var white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
          }
        }
      }
    });
    this.radioStatic = radioStatic;
    // this.radioStatic.play();
  };

  Audio.prototype.loadViz = function(){
    var app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent: true});
    var graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    this.$el.append(app.view);

    this.viz = app;
    this.graphics = graphics;
  };

  Audio.prototype.onResize = function(){
    this.viz.renderer.resize(this.$el.width(), this.$el.height());
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

  Audio.prototype.playAudio = function(person, position, signal, playing){
    if (playing !== false) playing = true;

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
      this.audioBuffers[bufferId].playing = playing;
      this.audioBuffers[bufferId].signal = signal;
      this.audioBuffers[bufferId].position = position;
      playAudioBuffer(this.audioBuffers[bufferId]);

    // load and play new audio buffer
    } else {
      var buf = new Pizzicato.Sound(person.filename, function() {
        console.log(person.filename + " loaded.");
        _this.audioBuffers[bufferId].loaded = true;
        // $(document).trigger("audio.loaded", [person]);
        playAudioBuffer(_this.audioBuffers[bufferId]);
      });
      buf.connect(this.analyzer);
      this.audioBuffers[bufferId] = {
        buf: buf,
        loaded: false,
        playing: playing,
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

  Audio.prototype.preload = function(person){
    this.playAudio(person, 0, 0, false);
  };

  Audio.prototype.render = function(){
    var graphics = this.graphics;
    graphics.clear();

    if (!this.currentBufferId) return false;
    var a = this.audioBuffers[this.currentBufferId];
    if (!a || !a.loaded) return false;

    var barCount = this.opt.barCount;
    var analyzer = this.analyzer;
    var analyzerBuf = this.analyzerBuf;
    var analyzerBuflen = this.analyzerBuflen;
    var barMargin = 2;
    var barWidth = 1.0 * this.viz.renderer.width / barCount - barMargin;
    var canvasHeight = this.viz.renderer.height;

    analyzer.getByteFrequencyData(analyzerBuf);

    graphics.beginFill(0xaa4e76);
    var x = 0;
    for(var i = 0; i < barCount; i++) {
      var barHeight = getBarHeight(analyzerBuf[i], canvasHeight);
      var y = canvasHeight - barHeight;
      graphics.drawRect(x, y, barWidth, barHeight);
      x += barWidth + barMargin;
    }

    graphics.endFill();
  };

  Audio.prototype.updatePerson = function(person, position, signal){
    this.pauseAudio();

    // if no person, play random static
    if (!person) {
      this.currentBufferId = false;
      this.playStatic();

    } else {
      this.currentBufferId = person.id;
      this.pauseStatic();
      this.playAudio(person, position, signal);
    }
  };

  Audio.prototype.updateStatic = function(){
    this.currentBufferId = false;
    this.pauseAudio();
    this.playStatic();
  };

  return Audio;

})();
