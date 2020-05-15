async function readAndDecodeAudio() {
	arrBuffer = null;
	audioBuffer = null;

	//Read the original Audio
	await readAudio(audioFile)
			.then((results) => {
				arrBuffer = results.result;
			})
			.catch((error) => {
				window.alert("Some Error occured");
				return;
			}); 

	//Decode the original Audio into audioBuffer
	await new AudioContext().decodeAudioData(arrBuffer)
				.then((res) => {
					audioBuffer = res;
					console.log(audioBuffer);
				})
				.catch((err) => {
					window.alert("Can't decode Audio");
					return;
				});
}

async function trimAudio(region) {
	//Create empty buffer and then put the slice of audioBuffer i.e wanted part
	var regionDuration = region.end - region.start;
	var startPoint = Math.floor((region.start*audioBuffer.length)/totalAudioDuration);
	var endPoint = Math.ceil((region.end*audioBuffer.length)/totalAudioDuration);
	var audioLength = endPoint - startPoint;

	var trimmedAudio = new AudioContext().createBuffer(
		audioBuffer.numberOfChannels,
		audioLength,
		audioBuffer.sampleRate
	);

	for(var i=0;i<audioBuffer.numberOfChannels;i++){
		trimmedAudio.copyToChannel(audioBuffer.getChannelData(i).slice(startPoint,endPoint),i);
	}

	var audioData = {
		channels: Array.apply(null,{length: trimmedAudio.numberOfChannels})
					.map(function(currentElement, index) {
						return trimmedAudio.getChannelData(index);
					}),
		sampleRate: trimmedAudio.sampleRate,
    	length: trimmedAudio.length,
	}
	
	var temp = null;
	await encodeAudioBufferLame(audioData)
		.then((res) => {
			console.log(res);
			downloadAudio();
		})
		.catch((c) => {
			console.log(c);
		});
	console.log(audioData);
}

async function mergeAudio(audioList) {
	console.log(audioList);
	var trackDetails = new Array();
	var channelLength = 0;
	for( var i in audioList) {
		var regionDuration = audioList[i].end - audioList[i].start;
		var startPoint = Math.floor((audioList[i].start*audioBuffer.length)/totalAudioDuration);
		var endPoint = Math.ceil((audioList[i].end*audioBuffer.length)/totalAudioDuration);
		var audioLength = endPoint - startPoint;
		channelLength = channelLength + audioLength;

		var trackDetail = {
			'regionDuration': regionDuration,
			'startPoint': startPoint,
			'endPoint': endPoint,
			'audioLength': audioLength
		}
		trackDetails.push(trackDetail);
	}

	var mergedAudio = new AudioContext().createBuffer(
		audioBuffer.numberOfChannels,
		channelLength,
		audioBuffer.sampleRate
	);

	var channelData = (audioBuffer.numberOfChannels === 1 ? 
			new Array(new Float32Array(channelLength)) : 
			new Array(new Float32Array(channelLength), new Float32Array(channelLength)));

	for(var i=0;i<audioBuffer.numberOfChannels;i++) {
		var startLength = 0;
		for(var j in trackDetails) {
			channelData[i].set(audioBuffer.getChannelData(i).slice(
				trackDetails[j]["startPoint"], trackDetails[j]["endPoint"]), startLength);
			startLength = trackDetails[j]["audioLength"];
		}
	}

	for(var i=0; i<audioBuffer.numberOfChannels; i++) {
		mergedAudio.copyToChannel(channelData[i], i)
	}

	var audioData = {
		channels: Array.apply(null,{length: mergedAudio.numberOfChannels})
					.map(function(currentElement, index) {
						return mergedAudio.getChannelData(index);
					}),
		sampleRate: mergedAudio.sampleRate,
    	length: mergedAudio.length,
	}
	
	var temp = null;
	await encodeAudioBufferLame(audioData)
		.then((res) => {
			console.log(res)
			document.getElementById("merged-track").src = processedAudio.src;
		})
		.catch((c) => {
			console.log(c)
		});
	console.log(audioData);
}

function encodeAudioBufferLame( audioData ) {
	return new Promise( (resolve, reject) => {
		var worker = new Worker('./worker/worker.js');
		
		worker.onmessage = (event) => {
			console.log(event.data);
			if(event.data != null){
				resolve(event.data);
			}
			else{
				reject("Error");
			}
			var blob = new Blob(event.data.res, {type: 'audio/mp3'});
      		processedAudio = new window.Audio();
      		processedAudio.src = URL.createObjectURL(blob);
      		console.log(blob);
		};

		worker.postMessage({'audioData': audioData});
	});		
}

function readAudio(file) {	
	return new Promise((resolve, reject) => {
					var reader = new FileReader();
					reader.readAsArrayBuffer(file);

					//Resolve if audio gets loaded
					reader.onload = function() {
						console.log("Audio Loaded");
						resolve(reader);
					}

					reader.onerror = function(error){
						console.log("Error while reading audio");
						reject(error);
					}

					reader.onabort = function(abort){
						console.log("Aborted");
						console.log(abort);
						reject(abort);
					}

				})
}

function loadAudio() {
	var element = document.getElementById("audio-file");
	if(element.files[0].type !== "audio/mpeg"){
    	alert("Invalid Format");
    	return;
    }

    audioFile = element.files[0];
    if(wavesurfer !== undefined)
    	wavesurfer.destroy();
	wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: '#b6c3b1',
        progressColor: '#6d8764',
        responsive: true,
        barWidth: 3,
		barRadius: 3,
		cursorWidth: 1,
		height: 100,
		barGap: 3
    });
    wavesurfer.on('ready', function() {
    	readAndDecodeAudio();
    	preTrimUIChanges();
    	totalAudioDuration = wavesurfer.getDuration();
    	document.getElementById('time-total').innerText = totalAudioDuration.toFixed(1);
    	wavesurfer.enableDragSelection({});
    	console.log(intro);
    	if(intro != undefined) {
    		intro.nextStep();
    	}
    });
	wavesurfer.on('finish', setPlayButton); 
	wavesurfer.load(URL.createObjectURL(element.files[0]));
	wavesurfer.on('audioprocess', function() {
	    if(wavesurfer.isPlaying()) {
	        var currentTime = wavesurfer.getCurrentTime();
	        document.getElementById('time-current').innerText = currentTime.toFixed(1);
	    }
	});
	wavesurfer.on('region-created', function(newRegion) {
		var audioTracks = document.getElementById("audio-tracks").tBodies[0];
		console.log(audioTracks.childNodes);
		var tableRow = createAudioRow(new Array(newRegion.id, newRegion.start, newRegion.end));
		audioTracks.appendChild(tableRow);
	 	showAndHideMergeOption();
	});
	wavesurfer.on('region-update-end', function(newRegion) {
		document.getElementById(newRegion.id+1).innerText = 
			( 0 >= newRegion.start.toFixed(4) ? 0 : newRegion.start.toFixed(4));
		document.getElementById(newRegion.id+2).innerText = 
			( wavesurfer.getDuration() <= newRegion.end ? wavesurfer.getDuration().toFixed(4) : newRegion.end.toFixed(4));
		if(intro != undefined) {
			intro.exit();
		}	
	});
	var audioButtons = document.getElementById("audio-buttons");
	var audioButtonsClass = audioButtons.getAttribute("class").replace("w3-hide","w3-show");
	audioButtons.setAttribute("class",audioButtonsClass);
}

function downloadAudio() {
	var anchorAudio = document.createElement("a");
    anchorAudio.href = processedAudio.src;
	anchorAudio.download = "output.mp3";
	anchorAudio.click();
	console.log(anchorAudio);
}