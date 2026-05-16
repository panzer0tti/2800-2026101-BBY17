const mockPlantData = {
    name: "Junberry",
    ripeStatus: "High (Deep Red)",
    inSeason: "Yes (May - July)",
    safety: "Safe",
    confidence: "94%",
    lookalike: "Goldberry (also edible)",
    allergy: "None known",
    prep: "Wash thoroughly. Best eaten raw or as jam."
};

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
    // ... existing canvas capture code ...

    // Populate the UI with your mock object data
    document.getElementById('plant-name').innerText = mockPlantData.name;
    document.getElementById('ripe-level').innerText = `Ripe Level: ${mockPlantData.ripeStatus}`;
    document.getElementById('season-indicator').innerText = `In Season: ${mockPlantData.inSeason}`;
    document.getElementById('safety-badge').innerText = mockPlantData.safety.toUpperCase();
    document.getElementById('confidence-level').innerText = mockPlantData.confidence;
    document.getElementById('lookalike-warning').innerHTML = `<strong>Lookalike Warning:</strong> ${mockPlantData.lookalike}`;
    document.getElementById('allergy-warning').innerHTML = `<strong>Allergy Warning:</strong> ${mockPlantData.allergy}`;
    document.getElementById('prep-guide').querySelector('p').innerText = mockPlantData.prep;

    // Show the result box
    document.getElementById('result-box').style.display = 'block';
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
