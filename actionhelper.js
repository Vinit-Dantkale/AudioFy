var wavesurfer;
var audioFile;
var totalAudioDuration;
var arrBuffer;
var audioBuffer;

//helper
function trimDriver(){
	wavesurfer.enableDragSelection({});
}

/*
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
			console.log(res)
		})
		.catch((c) => {
			console.log(c)
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
      		var t = new window.Audio();
      		t.src = URL.createObjectURL(blob);
      		//t.play();
      		console.log(t);
      		console.log(blob);
      		var anchorAudio = document.createElement("a");
      		anchorAudio.href = t.src;
      		anchorAudio.download = t.src;
      		anchorAudio.click();
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
        waveColor: '#deddf7',
        progressColor: '#5856d6',
        responsive: true,
        barWidth: 3,
		barRadius: 3,
		cursorWidth: 1,
		height: 100,
		barGap: 3
    });
    wavesurfer.on('ready', function() {
    	readAndDecodeAudio();
    	setPlayButton();
    	totalAudioDuration = wavesurfer.getDuration();
    	document.getElementById('time-total').innerText = totalAudioDuration.toFixed(1);
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
		var audioTracks = document.getElementById("audio-tracks");
		console.log(audioTracks.childNodes);
		var tableRow = createAudioRow(new Array(newRegion.id, newRegion.start, newRegion.end));
		audioTracks.appendChild(tableRow);
	});
	wavesurfer.on('region-update-end', function(newRegion) {
		document.getElementById(newRegion.id+1).innerText = 
			( 0 >= newRegion.start ? 0 : newRegion.start);
		document.getElementById(newRegion.id+2).innerText = 
			( wavesurfer.getDuration() <= newRegion.end ? wavesurfer.getDuration() : newRegion.end);
	});
}
*/

function showAndHideMergeOption() {
	var audioTracks = document.getElementById("audio-tracks");
	var mergeOption = document.getElementById('merge-option');
	if(audioTracks.childNodes.length >= 4) {
		mergeOption.setAttribute('class', 'w3-show');
	} else {
		mergeOption.setAttribute('class', 'w3-hide');
	}
	console.log(mergeOption);
}

function createAudioRow(arr) {
	var tableRow = document.createElement("tr");
	tableRow.setAttribute("id", arr[0]);
	tableRow.setAttribute("class", "w3-hover-text-green");
	//tableRow.setAttribute("onmouseover", "highlightRegion('over','"+arr[0]+"')");
	//tableRow.setAttribute("onmouseleave", "highlightRegion('leave','"+arr[0]+"')");
	for(var i in arr){
		var tableData;
		if(i==0) {
			tableData = document.createElement("input");
			tableData.setAttribute("type", "checkbox");
			tableData.setAttribute("class", "w3-check w3-margin-left");
		} else {
			tableData = document.createElement("td");
			tableData.innerText = arr[i];
		}
		tableData.setAttribute("id",arr[0]+i); 	
		tableRow.appendChild(tableData);
	}

	var actionsArray = new Array(
		{"action":"play", "iconClass":"fa fa-play-circle-o"}, 
		{"action":"download", "iconClass":"fa fa-download"}, 
		{"action":"delete", "iconClass":"fa fa-times"});
	for(var i=0; i<actionsArray.length; i++) {
		var tableData = document.createElement("td");
		tableData.setAttribute("id", arr[0]+"-"+actionsArray[i].action);
		var dataIcon = document.createElement("button");
		dataIcon.setAttribute("title", actionsArray[i].action);
		dataIcon.setAttribute("class", actionsArray[i].iconClass+" w3-button w3-white w3-border w3-border-light-green w3-round-large");
		dataIcon.setAttribute("id", arr[0]+"-"+actionsArray[i].iconClass);
		dataIcon.setAttribute("onClick", actionsArray[i].action+"Track('"+arr[0].toString()+"')"); 	
		tableData.appendChild(dataIcon);
		tableRow.appendChild(tableData);
	}
	return tableRow;
}

function highlightRegion(eventName, regionId) {
	var region = wavesurfer.regions.list[regionId];
	if(eventName == "over") {
		region.color = "rgba(0, 255, 0, 0.1)";
	} else {
		wavesurfer.regions.list[regionId].color = "rgba(0, 0, 0, 0.1)";
	}
}

function playTrack(regionId) {
	wavesurfer.regions.list[regionId].play();
}

function mergeTrack() {
	var audioList = new Array();
	for( var i in wavesurfer.regions.list ) {
		var region = wavesurfer.regions.list[i];
		if( document.getElementById(region.id+'0').checked ) {
			document.getElementById(region.id+'0').checked = false;
			audioList.push(wavesurfer.regions.list[i]);
		}
	}
	if(audioList.length >= 2){
		mergeAudio(audioList);	
	} else {
		alert("Select more than 1 tracks");
	}
	
}

function downloadTrack(regionId) {
	trimAudio(wavesurfer.regions.list[regionId]);
}

function deleteTrack(regionId) {
	var track = document.getElementById(regionId);
	track.parentNode.removeChild(track);
	wavesurfer.regions.list[regionId].remove();
	showAndHideMergeOption();
}

function setPlayButton() {
	var icon = document.getElementById("play-pause-icon");
	icon.className = "fa fa-play";
};

function playAndPause() {
	var icon = document.getElementById("play-pause-icon");
	if(icon.className === "fa fa-play"){
		icon.className = "fa fa-pause";
		wavesurfer.play();
	} else {
		icon.className = "fa fa-play";
		wavesurfer.pause();
	}
}