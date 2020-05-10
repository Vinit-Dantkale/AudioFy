(function() {
	'use strict';

	importScripts('../vendor/lame.min.js');
	var mp3Encoder;
	var buffer = [];
	var maxSamples, sampleBlockSize = 1152;
	self.onmessage = async (event) => {
		await encode(event.data.audioData)
			.then( (res) => {
				finish();
				console.log(res);
				self.postMessage({'res':res});
			})
			.catch( (err) => {
				console.log(err);
			});
	}

	var finish = function () {
		appendToBuffer(mp3Encoder.flush());
		console.log('done encoding, size=', buffer.length);
	}

	var encode = function (audioData) {
		if(audioData.channels.length == 1) {
			mp3Encoder = new lamejs.Mp3Encoder(1, audioData.sampleRate, 128);
			return new Promise( (resolve, reject) => {
				console.log(evt);

				var arrayBuffer = audioData.channels[0];
				var sampleRate = audioData.sampleRate;
				var data = new Float32Array(arrayBuffer);
		    	var samples = new Int16Array(arrayBuffer.length);
		    	floatTo16BitPCM(data, samples);

		    	var remaining = samples.length;
			    for (var i = 0; remaining >= 0; i += maxSamples) {
			      var mono = samples.subarray(i, i + maxSamples);
			      var mp3buf = mp3Encoder.encodeBuffer(mono);
			      appendToBuffer(mp3buf);
			      remaining -= maxSamples;
				}
		    	resolve(buffer);
			});
		}

		if(audioData.channels.length == 2) {
			mp3Encoder = new lamejs.Mp3Encoder(2, audioData.sampleRate, 128);
			return new Promise( (resolve, reject) => {
				var right = new Int16Array(audioData.channels[0].length);
				floatTo16BitPCM(audioData.channels[0], right);
				
				var left = new Int16Array(audioData.channels[1].length);
				floatTo16BitPCM(audioData.channels[1], left);

				for (var i = 0; i < audioData.channels[0].length; i += sampleBlockSize) {
				  var leftChunk = left.subarray(i, i + sampleBlockSize);
				  var rightChunk = right.subarray(i, i + sampleBlockSize);
				  var mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
				  if (mp3buf.length > 0) {
				    buffer.push(mp3buf);
				  }
				}
				resolve(buffer);
			});
		}
	    
	}

	var appendToBuffer = function (mp3Buf) {
    	buffer.push(new Int8Array(mp3Buf));
  	};

	var floatTo16BitPCM = function floatTo16BitPCM(input, output) {
	//var offset = 0;
		for (var i = 0; i < input.length; i++) {
		  var s = Math.max(-1, Math.min(1, input[i]));
		  output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
		  if(i%1000==0){
		  	//console.log(output[i]);
		  }
		}
	};	
})();