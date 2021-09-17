// 
// init 
// 
let phone;
let session;
let watchStatus;
let duration = new Timer();

let localDevice = $("#localVoice");
let localDetail = localDevice[0];

let localDevice1 = $("#localVoice1");
let localDetail1 = localDevice1[0];



let remoteDevice = $("#remoteVoice");
let remoteDetail = remoteDevice[0];

let soundDevice = $("#songs");
let soundDetail = soundDevice[0];

let callOptions = {
	pcConfig: {
		hackStripTcp: true,
		iceServers: []
	},
	mediaConstraints: {
		audio: true, 
		video: false
	},
	rtcOfferConstraints: {
		offerToReceiveAudio: true,
		offerToReceiveVideo: false
	}
}

let DTMFOptions = {
	duration: 100,
	interToneGap: 500,
	transportType: "RFC2833"
}

// 
// update timer
// 
duration.addEventListener("secondsUpdated", function() {
    $("#duration").html(duration.getTimeValues().toString());
});

// 
// init
// 
$(document).ready(function() {
	

	setInterval(function function_name(argument) {
		// body...
	},1000);

	$('#exampleModal').modal('show');

	$('#exampleModal').on('hidden.bs.modal', function () {
		console.log('Modal Close....');
		if ( !($("#host").val() == "" || $("#port").val() == "" || $("#user").val() == "" || $("#secret").val() == "") ) $("#status").click();
	});
});

// 
// streaming
// 
function streamReroute() {
	session.connection.addEventListener("addstream", function(e) {
		console.log('Adding stream for remote from device.....');
		let localStream = session.connection.getLocalStreams();
		console.log('localStream.length : '+localStream.length);
		if (localStream.length) localDetail.srcObject = localStream[0];

		if (e.stream) remoteDetail.srcObject = (e.stream);

		//if (e.stream) localDetail1.srcObject =localStream[0];

		
	});
}

// 
// update status
//
function statusOff() {
	$("#status").html("Unregistered");
	$("#status").removeClass("btn-outline-success").addClass("btn-outline-danger");
}

function statusOn() {
	$("#status").html("Registered");
	$("#status").removeClass("btn-outline-danger").addClass("btn-outline-success");
}

function statusChecker() {
	watchStatus = setInterval(function() {
		if(phone == null || !phone.isRegistered()){
			statusOff();
		} else {
			statusOn();
		}
	}, 5000);
}

// 
// system audio
// 
function playSong(src="", loop=false) {
	soundDevice.prop("loop", loop);
	soundDevice.attr("src", src);
	setTimeout(function() {
		soundDevice.trigger("play");
	}, 100);
}

function stopSong(){
	soundDevice.trigger("pause");
}


$('#songs').on('pause',function(e){
	console.log('Song stopped......');
})
$('#songs').on('play',function(e){
	console.log('9999999999999999999999999999999999999999999999999999999999999999999999999999 Song played......');
})
$('#songs').on('playing',function(e){
	console.log('Song playing......');
})

$('#localVoice').on('pause',function(e){
	console.log('localVoice stopped......');
})
$('#localVoice').on('play',function(e){
	console.log('localVoice played......');
})
$('#localVoice').on('playing',function(e){
	console.log('localVoice playing......');
})

$('#remoteVoice').on('pause',function(e){
	console.log('remoteVoice stopped......');
})
$('#remoteVoice').on('play',function(e){
	console.log('9999999999999999999999999999999999999999999999999999999999999999999999999999 remoteVoice played......');
})
$('#remoteVoice').on('playing',function(e){
	console.log('remoteVoice playing......');
})
//
// form
//

// register
$("#status").click(function() {

	console.log($(this).html());
	if( $(this).html() === "Unregistered" || $(this).html() === "Trying..." ) {
		let host = $("#host").val();
		let port = $("#port").val();
		let user = $("#user").val();
		let secret = $("#secret").val();
		let sipPort = $("#sip-port").val();
		console.log('sipPort = '+sipPort);
		let peer;

		if(sipPort!='') {
			 peer = "sip:" + user + "@" + host + ":" + sipPort;
			console.log('1 peer = '+peer);
		}else {
			 peer = "sip:" + user + "@" + host;
			console.log('2 peer = '+peer);
		}

		//let peer = "sip:9560700235@sip.antisip.com";

		let socket = new JsSIP.WebSocketInterface("wss://" + host + ":" + port);
		//let socket = new JsSIP.WebSocketInterface("wss://sip.antisip.com:4443");

		let regOptions = {
			"sockets"			: [ socket ],
			"uri"      			: peer,
			"contact_uri"		: peer,
			"password"			: secret,
			//"register_expires"	: 180
		};

		JsSIP.debug.enable("JsSIP:*");
		phone = new JsSIP.UA(regOptions);

		phone.on("registered", () => {
			statusOn();
			statusChecker();
		});

		phone.on("registrationFailed", (e) => {
			swal("Error", e.cause, "error");
		});

		phone.on("unregistered", () => {
			clearInterval(watchStatus);
			statusOff();
		});
		
		phone.on("newRTCSession", (e) => {
			let newSession = e.session;
			if (session) session.terminate();
			session = newSession;

			session.on('peerconnection', function() {
				if (session.direction === 'incoming') streamReroute();
			});

			session.on("progress", () => {
				clearInterval(watchStatus);
				//playSong("sounds/ringing.mp3", true);
				$("#status").html("Ringing...");
			});

			session.on("confirmed", () => {
				console.log('Session Confirmed, going to stopSong...');
				stopSong();
				clearInterval(watchStatus);
				$("#status").html("In call");
				duration.start();
			});

	        session.on("ended", (e) => {
	        	session = null;
				$("#status").html(e.cause);
	        	duration.stop();
	        	playSong("sounds/busy.mp3", false);
	        	setTimeout(function() {
	        		statusOn();
	        		statusChecker();
	        		$("#duration").html("00:00:00");
	        	}, 2000);
	        });

	        session.on("failed", (e) => {
	        	session = null;
	        	playSong("sounds/busy.mp3", false);
				$("#status").html(e.cause);
				setTimeout(function() {
					statusOn();
					statusChecker()
				}, 2000);
	        });

			if(session.direction === "incoming"){
				swal({
					closeOnEsc: false,
					closeOnClickOutside: false,
					title: "Incoming call",
					text: "from: " + session.remote_identity.display_name,
					icon: "info",
					buttons: {
						cancel: "Reject",
						catch: {
							text: "Accept",
							value: "true"
						},
					},
				})
				.then(function(value) {
					if (value) {
						session.answer(callOptions);
					} else {
						session.terminate();
					}
				});
	        }
		});

		phone.start();
		$("#status").html("Trying...");
	} else {
		phone.stop();
		$("#status").html("Trying...");
	}	
});

// handle call
$("#call").click(function() {
	number = $("#number").val();
	console.log('Calling number : '+number);
	if (number != "") {
		session = phone.call(number, callOptions);
		streamReroute();
	}
});

$("#number").keypress(function(e) {
	if(e.which === 13) $("#call").click();
});

// clear number
$("#clear").click(function() {
	$("#number").val("");
});

// Call reset
$("#hangup").click(function() {
	if (session && (session.isEstablished() || session.isInProgress())) session.terminate();
});

// set phone number
$("[name=key]").click(function() { 
	$("#number").val( $("#number").val() + $(this).val() );
	if (session && session.isEstablished()) {
		session.sendDTMF( $(this).val().toString(), DTMFOptions );
		playSong("sounds/tone.mp3", false);
	}
});

// set volume
$("#volume").on("change", function() {
	let level = $(this).val();
	let icon = (level == 0) ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>' ;
	remoteDetail.volume = level;
	soundDetail.volume = level;
	$("#icon").html(icon);
});

// mute
$("#mute").click(function(){
	if (session && session.isEstablished) {
		if ( $(this).html() === "Mute" && !session.isMuted().audio){
			$(this).html("UnMute");
			session.mute();
		} else {
			$(this).html("Mute");
			session.unmute();
		}
	}
});

// transfer
$("#transfer").click(function(){
	if (session && session.isEstablished) {
		swal("Перевод на номер:", {
			content: "input",
		})
		.then(function(e) {
			session.refer(e);
			session.terminate();
			// session.sendDTMF( "##"+e.toString()+"#", DTMFOptions );
		});
	}
});

// hold
$("#hold").click(function(){
	if (session && session.isEstablished) {
		if ( $(this).html() === "Hold" && !session.isOnHold().local){
			$(this).html("UnHold");
			session.hold();
		} else {
			$(this).html("Hold");
			session.unhold();
		}
	}
});