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
        showScanningState();
        
        // 2. Fetch the live data from your backend API route
        const livePlantData = await scanPlant({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
            // If your backend expects a base64 image string from the canvas, 
            // you would pass it in the body here.
        });

        // 3. Grab the live JSON response data from the server
        // (already handled by scanPlant)

        // 4. Populate your UI elements dynamically using the live server data
        updatePlantUI(livePlantData);
    } catch (err) {
        console.error("Failed to fetch live AI data:", err);
        showScanError();
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
    if (!file) {
        return;
    }

    try {
        showScanningState();

        const formData = new FormData();
        formData.append('plantImage', file);

        const livePlantData = await scanPlant({
            method: 'POST',
            body: formData
        });
        
        // Pass server data to our reusable helper function
        updatePlantUI(livePlantData);
    } catch (err) {
        console.error(err);
        showScanError();
    }
});

// 2. SHARED REUSABLE UI HELPER
function updatePlantUI(data) {
    document.getElementById('plant-name').innerText = data.commonName || "Unknown Plant";
    document.getElementById('scientific-name').innerText = `Scientific Name: ${data.speciesName || "Unknown"}`;
    document.getElementById('ripe-level').innerText = `Ripe Level: ${data.ripeStatus}`;
    document.getElementById('season-indicator').innerText = `In Season: ${data.inSeason}`;
    document.getElementById('safety-badge').innerText = data.safety.toUpperCase();
    document.getElementById('confidence-level').innerText = data.confidence;
    document.getElementById('lookalike-warning').innerHTML = `<strong>Lookalike Warning:</strong> ${data.lookalike}`;
    document.getElementById('allergy-warning').innerHTML = `<strong>Allergy Warning:</strong> ${data.allergy}`;
    document.getElementById('prep-guide').querySelector('p').innerText = data.prep;
}

function showScanningState() {
    document.getElementById('plant-name').innerText = "Scanning...";
    document.getElementById('result-box').style.display = 'block';
}

function showScanError(message = "Scan Failed") {
    document.getElementById('plant-name').innerText = "Scan Failed";
    document.getElementById('results').innerText = message;
}

async function scanPlant(options = {}) {
    try {
        const response = await fetch('/scanningPlant', options);
        if (!response.ok) {
            throw new Error('API error');
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Scan API error:", err);
    }
}
