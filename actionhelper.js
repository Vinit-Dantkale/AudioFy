var wavesurfer;
var audioFile;
var totalAudioDuration;
var arrBuffer;
var audioBuffer;
var processedAudio;
var intro;

function showAndHideMergeOption() {
	var audioTracks = document.getElementById("audio-tracks");
	var mergeOption = document.getElementById('merge-option');
	if(audioTracks.childNodes.length >= 4) {
		mergeOption.setAttribute('class', 'w3-show');
	} else {
		mergeOption.setAttribute('class', 'w3-hide');
	}
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
			tableData.innerText = arr[i].toFixed(4);
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
	showIntro();
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
	if(intro != undefined) {
		intro.exit();
		intro = undefined;
	}
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
		var mergedTrackDiv = document.getElementById("merged-track-div");
		var mergedTrackDivClass = mergedTrackDiv.className.replace("w3-hide","w3-show");
		mergedTrackDiv.setAttribute("class",mergedTrackDivClass);
		var mergedTrack = document.getElementById("merged-track");
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

function preTrimUIChanges() {
	setPlayButton();
	var audioTracks = document.getElementById("audio-tracks");
	var tbody = document.createElement("tbody");
	audioTracks.tBodies[0].remove();
	audioTracks.insertBefore(tbody, audioTracks.tFoot[0]);
}

function showIntro() {
	var audioTracks = document.getElementById("audio-tracks").tBodies[0];
	if(intro != undefined && audioTracks.rows.length >= 3) {
		intro.goToStep(3).start();
		var tourButton = document.getElementById("tour-button");
		tourButton.setAttribute("class",tourButton.className+" w3-hide");
	} 
}

function showTour() {
	var n = localStorage.getItem('on_load_counter');
	if (n === null) {
	  intro = introJs().start();
	  n = 0;
	  localStorage.setItem("on_load_counter", n);
	} else {
		var tourButton = document.getElementById("tour-button");
		tourButton.setAttribute("class",tourButton.className+" w3-hide");	
	}
}

function startTour() {
	intro.nextStep();
}