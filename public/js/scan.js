const startBtn = document.getElementById('start-camera');
const captureBtn = document.getElementById('capture-plant'); // Add this line
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

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
            
            // ADD THIS LINE HERE:
            captureBtn.style.display = "inline-block"; 
            
            // Optional: Hide start button
            startBtn.style.display = "none";
        })
        .catch((err) => {
            console.error("Camera error: ", err);
            document.getElementById('results').innerText = "Camera access denied.";
        });
});