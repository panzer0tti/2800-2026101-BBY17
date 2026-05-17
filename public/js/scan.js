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

captureBtn.addEventListener('click', async () => {

    try {
        // 1. Tell the user it's loading
        document.getElementById('plant-name').innerText = "Scanning...";
        document.getElementById('result-box').style.display = 'block';
        // 2. Fetch the live data from your backend API route
        const response = await fetch('/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
            // If your backend expects a base64 image string from the canvas, 
            // you would pass it in the body here.
        });
        if (!response.ok) {
            throw new Error('API server returned an error');
        }
        // 3. Grab the live JSON response data from the server
        
        const livePlantData = await response.json();

        // 4. Populate your UI elements dynamically using the live server data
        document.getElementById('plant-name').innerText = livePlantData.name;
        document.getElementById('ripe-level').innerText = `Ripe Level: ${livePlantData.ripeStatus}`;
        document.getElementById('season-indicator').innerText = `In Season: ${livePlantData.inSeason}`;
        document.getElementById('safety-badge').innerText = livePlantData.safety.toUpperCase();
        document.getElementById('confidence-level').innerText = livePlantData.confidence;
        document.getElementById('lookalike-warning').innerHTML = `<strong>Lookalike Warning:</strong> ${livePlantData.lookalike}`;
        document.getElementById('allergy-warning').innerHTML = `<strong>Allergy Warning:</strong> ${livePlantData.allergy}`;
        document.getElementById('prep-guide').querySelector('p').innerText = livePlantData.prep;

    } catch (err) {

        console.error("Failed to fetch live AI data:", err);
        document.getElementById('plant-name').innerText = "Scan Failed";
        document.getElementById('results').innerText = "Unable to connect to the AI API service.";

    }
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

// --- ADD THIS TO THE VERY BOTTOM OF SCAN.JS ---

// 1. FILE UPLOAD EVENT LISTENER
const uploadInput = document.getElementById('upload-plant');

uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        document.getElementById('plant-name').innerText = "Scanning...";
        document.getElementById('result-box').style.display = 'block';

        const formData = new FormData();
        formData.append('plantImage', file);

        const response = await fetch('/api/scan', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('API error');

        const livePlantData = await response.json();
        
        // Pass server data to our reusable helper function
        updatePlantUI(livePlantData);

    } catch (err) {
        console.error(err);
        document.getElementById('plant-name').innerText = "Scan Failed";
    }
});

// 2. SHARED REUSABLE UI HELPER
function updatePlantUI(data) {
    document.getElementById('plant-name').innerText = data.name;
    document.getElementById('ripe-level').innerText = `Ripe Level: ${data.ripeStatus}`;
    document.getElementById('season-indicator').innerText = `In Season: ${data.inSeason}`;
    document.getElementById('safety-badge').innerText = data.safety.toUpperCase();
    document.getElementById('confidence-level').innerText = data.confidence;
    document.getElementById('lookalike-warning').innerHTML = `<strong>Lookalike Warning:</strong> ${data.lookalike}`;
    document.getElementById('allergy-warning').innerHTML = `<strong>Allergy Warning:</strong> ${data.allergy}`;
    document.getElementById('prep-guide').querySelector('p').innerText = data.prep;
}