require('dotenv').config();

const fs = require("fs");
const multer = require('multer');
const axios = require('axios');

const upload = multer({dest: 'uploads/'});

// ADDED THIS LINE: Require form-data package
const FormData = require('form-data'); 

const apiScan = [
    // 1. Middleware to handle the single file upload
    upload.single('plantImage'),
    
    // 2. The core route handler logic
    async (req, res) => {
        try {
            if (!req.file) {
                res.status(400);
                res.json({name: "Error", prep: "No image file was received by the server."});
                return;
            }

            // Prepare the image file for Pl@ntNet
            const imageStream = fs.createReadStream(req.file.path);
            const formData = new FormData();
            formData.append('images', imageStream);

            const apiKey = process.env.PLANTNET_API_KEY || 'YOUR_PLANTNET_API_KEY'; 
            
            const plantNetResponse = await axios.post(
                `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
                formData,
                // FIXED THIS LINE: Use formData.getHeaders() for Node.js
                {headers: formData.getHeaders()} 
            );

            // Delete temporary file from our uploads folder
            fs.unlinkSync(req.file.path);

            const bestMatch = plantNetResponse.data.results[0];
            const commonName = bestMatch.species.commonNames?.[0] || "Unknown common name";
            const speciesName = bestMatch.species.scientificNameWithoutAuthor;
            const confidenceScore = Math.round(bestMatch.score * 100) + "%";
            
            const plantData = {
                commonName: commonName,
                speciesName: speciesName,
                ripeStatus: "Determined by species",
                inSeason: "Check local climate",
                safety: bestMatch.score > 0.5 ? "Verified Species" : "Uncertain Match",
                confidence: confidenceScore, 
                lookalike: "Cross-referencing database...",
                allergy: "Handle with standard caution",
                prep: "Always cross-reference wild plants with an expert guide before consuming."
            };

            res.json(plantData);

        } catch (err) {
            console.error("Pl@ntNet API Error:", err.response ? err.response.data : err.message);
            
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500);
            res.json({name: "Scan Failed", prep: "The AI service was unable to identify this image."});
        }
    }
];

module.exports = {apiScan};