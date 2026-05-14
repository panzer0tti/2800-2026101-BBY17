const startBtn = document.getElementById('start-camera');
const captureBtn = document.getElementById('capture-plant'); // Add this line
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const backBtn = document.getElementById('back');

backBtn.addEventListener('click', () => {
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop hardware
    }
    video.srcObject = null;
    
    // Toggle everything back
    video.style.display = 'none';
    captureBtn.style.display = 'none';
    backBtn.style.display = 'none';
    startBtn.style.display = 'block'; 
    document.getElementById('results').innerText = "";
});

captureBtn.addEventListener('click', () => {
    // 1. Set the canvas size to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 2. Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 3. Convert the canvas to a data URL (the actual photo data)
    const photoData = canvas.toDataURL('image/png');
    
    console.log("Photo Captured!", photoData);
    document.getElementById('results').innerText = "Plant Captured! Ready to Identify.";
});

startBtn.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            video.style.display = "block";
            // ADD THIS LINE HERE:
            captureBtn.style.display = "inline-block"; 
            
            // Optional: Hide start button
            startBtn.style.display = "none";
            backBtn.style.display = 'inline-block';
        })
        .catch((err) => {
            console.error("Camera error: ", err);
            document.getElementById('results').innerText = "Camera access denied.";
        });
});