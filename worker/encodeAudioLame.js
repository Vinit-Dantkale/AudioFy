(function() {
	'use strict';

	self.Mp3LameEncoderConfig = {
		memoryInitializerPrefixURL: '../vendor/',
		TOTAL_MEMORY: 1073741824,
	}

	importScripts('../vendor/lame.min.js');
	importScripts('../vendor/Mp3LameEncoder.min.js');

	self.onmessage = (event) => {
		var audioData = event.data.audioData;
		const encoder = new Mp3LameEncoder(audioData.sampleRate, 192);
		encoder.encode(audioData.channels);

		const blob = encoder.finish();
		console.log(blob);
		return blob;
	}

	//self.importScripts('../encoder/lame.js');
	/*
	self.onmessage = async (event) => {
		var audioData = event.data.audioData;
		var mp3Encoder = new lamejs.Mp3Encoder(audioData.channels.length, audioData.sampleRate, 128);
			
		var buffer = [];
		var sampleBlockSize = 1152;

		for(var i in audioData.channels){
			var channel = audioData.channels[i];
			//For Each channel
			var samples = [];
			await convertFloat32ToInt16(channel, sampleBlockSize)
				.then( (result) => {
					console.log(result);
				});
			console.log(channel.length);
		}
		console.log(mp3Encoder);
	};


	function convertFloat32ToInt16(input, sampleBlockSize) {
		return new Promise((resolve, reject) => {
			try{
				var preSamplesLength = 
					( (input.length%sampleBlockSize) == 0 ? input.length/sampleBlockSize : (input.length/sampleBlockSize)+1 );
				var samplesLength = preSamplesLength * sampleBlockSize;
				var output = new Int16Array(samplesLength);
				for (var i = 0; i < input.length; i++) {
				  var s = Math.max(-1, Math.min(1, input[i]));
				  output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
				}
				resolve(output);
			} 
			catch(err) {
				reject(err);
			}
		});
	}
	*/

})();
