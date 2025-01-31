const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateAIResponse, generateReport, validatePrompt} = require('./promptLLM'); // Import the function
const runPrediction = require("./predict.js");

const app = express();
const PORT = 8080;
var cost = 0;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express!' });
  });

  app.get('/cost', (req, res) => {
    // try {
    //     const { prompt } = req.body;
    //     const aiResponse = await generateAIResponse(prompt);
    //     const responseArray = aiResponse.split(',').map(Number);
    //     const resML = await runPrediction(responseArray);
    //     res.json({ success: true, prediction: resML });
    // } catch (error) {
        
    // }
    res.json({ cost: cost });
  });

  app.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    // Validate prompt
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt must be a non-empty string' });
    }

    const isRelatedPrompt = await validatePrompt(prompt);
    console.log("is related prompt : " + isRelatedPrompt+ ";")

    if (isRelatedPrompt === "No\n"){
        console.log(isRelatedPrompt)
        return res.status(400).json({ error: 'Prompt must be a car related problem' });
    }

    else {

        try {
            const aiResponse = await generateAIResponse(prompt);
            console.log("AI Response:", aiResponse);
    
            // Convert aiResponse string to array of numbers
            const responseArray = aiResponse.split(',').map(Number);
    
            if (responseArray.some(isNaN)) {
                return res.status(400).json({ error: 'AI response contains invalid data' });
            }
    
            try {
                const resML = await runPrediction(responseArray);
                cost = resML;
                const report = await generateReport(prompt, resML);
                console.log("Predicted Repair Cost:", resML); // Log the prediction result
                console.log("Report:", report); // Log the report result
    
                // Send the prediction back in the response
                res.json({ success: true, prediction: report });
            } catch (predictionError) {
                console.error("Prediction error:", predictionError);
                res.status(500).json({ success: false, error: 'Failed to run prediction' });
            }
    
        } catch (error) {
            console.error("AI response generation error:", error);
            res.status(500).json({ success: false, error: 'Failed to generate AI response' });
        }
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// jsdjakdkx