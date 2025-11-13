var isDarkOn = false;
var value = 1;
let alt1 = "Me and My Mother";
let alt2 = "My brother and a friend playing around";
let alt3 = "My brother and a friend playing around, with a beer";
let alt4 = "My family uwu";
let alt5 = "My brother, again";
let alt6 = "My father and my brother";
let currentalt = alt1;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const myIdSpan = document.getElementById('my-id');
const theirIdInput = document.getElementById('their-id');
const callButton = document.getElementById('call-button');

// Set up the AudioContext.
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
const mute = document.getElementById("mute");
const analyser = audioCtx.createAnalyser();
const canvas = document.getElementById("canvaDraw");
const canvasCtx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;


// functions for filters; these allow for the buttons to turn on and off each individual filter, 
let gs = 0;
let inv = 0;
let blr = 0;
document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
document.getElementById("grayscale").addEventListener("click", function grayScale(){
  if (gs == 100){
    gs = 0;
     document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  } else {
 gs = 100;
 document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  }
});

document.getElementById("normal").addEventListener("click", function normal(){
 gs = 0;
 inv = 0;
 blr = 0;
 document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"

});

document.getElementById("inversion").addEventListener("click", function invert(){
   if (inv == 100){
    inv = 0;
     document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  } else {
 inv = 100;
 document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  }

});

document.getElementById("blur").addEventListener("click", function blur(){
   if (blr == 5){
    blr = 0;
     document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  } else {
 blr = 5;
 document.getElementById("localVideo").style.filter="grayscale("+ gs +") invert("+inv+") blur("+blr+"px)"
  }

});


let localStream;

// 1. Initialize PeerJS.
//    (Without arguments = uses the public signaling server from PeerJS)
const peer = new Peer();

// 2. Displays our ID when we are connected to the signaling server
peer.on('open', (id) => {
    console.log('Connected to the signal with the ID:', id);
    myIdSpan.textContent = id;
});

// 3. Requests access to the camera and starts
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(err => {
        console.error('Error accessing the camera:', err);
    });

// 4. Connect (Button listener)
callButton.addEventListener('click', () => {
    const theirId = theirIdInput.value;
    console.log('Calling to:', theirId);

    // Starts the call and sends our stream
    const call = peer.call(theirId, localStream);

    // Displays their stream when they answer
    call.on('stream', (remoteStream) => {
        console.log('Stream remoto recebido');
        remoteVideo.srcObject = remoteStream;
    });
});

// 5. Answer (Incoming call listener)
peer.on('call', (call) => {
    console.log('Receiving a call from:', call.peer);

    // Answers the call and sends our stream
    call.answer(localStream);

    // Displays their stream
    call.on('stream', (remoteStream) => {
        console.log('Remote stream received');
        remoteVideo.srcObject = remoteStream;
    });
});

// Handle errors
peer.on('error', (err) => {
    console.error('Error on PeerJS:', err);
});

// Top-level variable keeps track of whether we are recording or not.
let recording = false;


// Ask user for access to the microphone.
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({"audio": true}).then((stream) => {

    // Instantiate the media recorder.
    const mediaRecorder = new MediaRecorder(stream);

    // Create a buffer to store the incoming data.
    let chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    }


    // When you stop the recorder, create a empty audio clip.
    mediaRecorder.onstop = (event) => {
      const audio = new Audio();
      audio.setAttribute("controls", "");
      $("#sound-clip").append(audio);
      $("#sound-clip").append("<br />");

      // Combine the audio chunks into a blob, then point the empty audio clip to that blob.
      const blob = new Blob(chunks, {"type": "audio/ogg; codecs=opus"});
      audio.src = window.URL.createObjectURL(blob);

      // Clear the `chunks` buffer so that you can record again.
      chunks = [];
    };

    // Set up event handler for the "Record" button.
    $("#record").on("click", () => {
      if (recording) {
        mediaRecorder.stop();
        recording = false;
        $("#record").html("Record");
      } else {
        if (audioCtx.state === "suspended") {
        audioCtx.resume();
        }  
        mediaRecorder.start();
        recording = true;
        $("#record").html("Stop");
      }
    });

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioCtx.destination);


analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    function draw() {
  requestAnimationFrame(draw);
  analyser.getByteTimeDomainData(dataArray);
  // Fill solid color
  canvasCtx.fillStyle = "rgb(85, 6, 149)";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  // Begin the path
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(17, 224, 52)";
  canvasCtx.beginPath();
  // Draw each point in the waveform
  const sliceWidth = WIDTH / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (HEIGHT / 2);

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  // Finish the line
  canvasCtx.lineTo(WIDTH, HEIGHT / 2);
  canvasCtx.stroke();
}

draw()


  }).catch((err) => {
    // Throw alert when the browser is unable to access the microphone.
    alert("Oh no! Your browser cannot access your computer's microphone.");
  });
} else {
  // Throw alert when the browser cannot access any media devices.
  alert("Oh no! Your browser cannot access your computer's microphone. Please update your browser.");
}

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia(
    // constraints - only audio needed for this app
    {
      audio: true,
    },

    // Success callback
    (stream) => {
      source = audioCtx.createMediaStreamSource(stream);
    },

    // Error callback
    (err) => {
      console.error(`The following gUM error occurred: ${err}`);
    },
  );
} else {
  console.error("getUserMedia not supported on your browser!");
}

mute.onclick = () => {
  if (mute.id === "mute") {
    // 0 means mute. If you still hear something, make sure you haven't
    // connected your source into the output in addition to using the GainNode.
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    mute.id = "activated";
    mute.textContent = "Unmute";
  } else {
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    mute.id = "mute";
    mute.textContent = "Mute";
  }
};

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true}).then((stream) => {
    const videoElement = document.getElementById("localVideo");
    videoElement.srcObject = stream;
  }).catch((error) => {
    console.error("error accessing webcam:", error);
  })
}

window.addEventListener("DOMContentLoaded", startVideo);



    document.getElementById("gallery").alt= currentalt;
    document.getElementById("galleryText").innerHTML= currentalt;

function LightandDark(){
    if (isDarkOn == false){
            document.getElementById("mode").innerHTML="Light Mode";
            document.body.style.backgroundColor="rgb(0, 0, 0)";
            document.getElementById("main").style.backgroundColor="black";
            document.getElementById("main").style.border="1rem double rgba(255, 255, 255, 0.86)";
            document.getElementById("mainText").style.color="white";
            document.getElementById("title").style.color="white";
            isDarkOn = true;
    }

    else {
            document.getElementById("mode").innerHTML="Dark Mode";
            document.body.style.backgroundColor="rgb(85, 6, 149)";
            document.getElementById("main").style.backgroundColor="rgb(78, 255, 158)";
            document.getElementById("main").style.border="1rem double rgb(85, 6, 149)";
            document.getElementById("mainText").style.color="rgb(91, 91, 91)";
            document.getElementById("title").style.color="rgb(85, 6, 149)";            
            isDarkOn = false;
    }
}

function galleryPlus(imageval){
    value = value+1;
    imageval = value;

    if (imageval > 6){
        value=1
        imageval=value
    }
    if (value == 1){
    currentalt = alt1;
        }
    if (value == 2){
    currentalt = alt2;
    }
    if (value == 3){
    currentalt = alt3;
    }
    if (value == 4){
    currentalt = alt4;
    }
    if (value == 5){
    currentalt = alt5;
    }
    if (value == 6){
    currentalt = alt6;
    }
    document.getElementById("gallery").alt= currentalt;
    document.getElementById("galleryText").innerHTML= currentalt;
    document.getElementById("gallery").src="david_pinto_202005722_gallery_"+imageval+".jpg";
}

function galleryMinus(imageval){
    value = value-1;
    imageval = value;

    if (imageval == 0){
        value=6;
        imageval=value;
    }
    if (imageval == 1){
    currentalt = alt1;
}
if (imageval == 2){
    currentalt = alt2;
}
if (imageval == 3){
    currentalt = alt3;
}
if (imageval == 4){
    currentalt = alt4;
}
if (imageval == 5){
    currentalt = alt5;
}
if (imageval == 6){
    currentalt = alt6;
}
    document.getElementById("gallery").alt=currentalt;
    document.getElementById("galleryText").innerHTML=currentalt;
    document.getElementById("gallery").src="david_pinto_202005722_gallery_"+imageval+".jpg";
}

document.getElementById("mode").addEventListener("click", LightandDark);
document.getElementById("galleryRight").addEventListener("click", galleryPlus);
document.getElementById("galleryLeft").addEventListener("click", galleryMinus);

