const video=document.getElementById("camera");
const canvas =document.getElementById("canvas");
const captureBtn = document.getElementById("capture-btn");
const problemText = document.getElementById("problem");
const solutionText = document.getElementById("solution");
const stepsList = document.getElementById("steps");
const speakBtn = document.getElementById("speak-btn");
const languageSelector = document.getElementById("language");
const stopBtn =document.getElementById("stopspeak");

const languages = [
    { code: "en-US", name: "English" },
    { code: "hi-IN", name: "Hindi" },
    { code: "mr-IN", name: "Marathi" }
];

//language selection

languages.forEach(lang=>{
    const option = document.createElement("option");
    option.value=lang.code;
    option.textContent=lang.name;
    languageSelector.appendChild(option);
});

//start camera
navigator.mediaDevices.getUserMedia({video:true})
.then(stream=>{
    video.srcObject=stream;
})
.catch(error=>{
    console.error("Camera access denied", error);
});

//capture image and send to api
captureBtn.addEventListener("click",async()=>{
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    imageData=canvas.toDataURL("image/jpeg");//converts base64 image
    analyzeMathProblem(imageData);
});

//call to gemini api

async function analyzeMathProblem(imageData) {
    const API_KEY = 'AIzaSyAwg5jOFRdJEZQ-NrUttto5M9JPW4QcvxA'; // Replace with your actual Gemini API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: "Analyze this math problem from the image and return JSON with problem, solution, and steps." },
                    { inlineData: { mimeType: "image/jpeg", data: imageData.split(",")[1] } }
                ]
            }
        ]
    };

    try{
        const response=await fetch(url,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        const textResponse = result.candidates[0]?.content?.parts[0]?.text || "";
        // Extract JSON response from AI output
        const cleanedText = textResponse.replace(/```json|```/g, "").trim();
        const parsedData = JSON.parse(cleanedText);

        displaySolution(parsedData);
    } catch (error) {
        console.error("Error analyzing math problem:", error);
        problemText.textContent = "Error occurred";
        solutionText.textContent = "Try again";
    }


    
}

//display solution

function displaySolution(data){
    problemText.textContent=data.problem||"Unknown";
    solutionText.textContent=data.solution || "solution not found";
    stepsList.innerHTML = "";
    if (data.steps && Array.isArray(data.steps)) {
        data.steps.forEach(step => {
            const li = document.createElement("li");
            li.textContent = step;
            stepsList.appendChild(li);
        });
    }
}

//text to speech 

let utterance; // Declare globally

speakBtn.addEventListener("click", () => {
    const selectedLang = languageSelector.value;
    if (!problemText.textContent) return;

    // Stop any ongoing speech before starting a new one
    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance();
    utterance.text = `Problem: ${problemText.textContent}. Solution: ${solutionText.textContent}. Steps: ${Array.from(stepsList.children).map(li => li.textContent).join(", ")}`;
    utterance.lang = selectedLang;
    
    window.speechSynthesis.speak(utterance);
});

// Stop button event
stopBtn.addEventListener("click", () => {
    if (utterance) {
        window.speechSynthesis.cancel(); // Immediately stop speech
        console.log("Speech synthesis stopped.");
    }
});