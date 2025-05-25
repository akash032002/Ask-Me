import React, { useState, useEffect, useRef } from 'react';

// Main App component
const App = () => {
  // State to store the user's question
  const [question, setQuestion] = useState('');
  // State to store Gemini's answer
  const [answer, setAnswer] = useState('');
  // State to manage loading status during API call
  const [loading, setLoading] = useState(false);
  // State to store any error messages
  const [error, setError] = useState('');
  // State to store the selected image file
  const [selectedImage, setSelectedImage] = useState(null);
  // State to store the Base64 representation of the image
  const [imageData, setImageData] = useState('');
  // State to track if text-to-speech is currently active
  const [isSpeaking, setIsSpeaking] = useState(false);
  // State to control the speech rate (speed)
  const [speechRate, setSpeechRate] = useState(1.0); // Default to normal speed

  // Ref to store the SpeechSynthesisUtterance instance for TTS
  const utteranceRef = useRef(null);
  // Ref to store the SpeechSynthesis interface for TTS
  const synthRef = useRef(null);

  // Initialize Web Speech API (TTS) on component mount
  useEffect(() => {
    // --- Text-to-Speech (TTS) Setup ---
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      // Append error message if TTS is not supported
      setError(prev => prev ? prev + ' | Text-to-speech not supported.' : 'Text-to-speech not supported.');
    }

    // --- Cleanup Function ---
    return () => {
      // Cancel any ongoing text-to-speech
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Effect to manage TTS state when answer changes
  useEffect(() => {
    // If the answer changes, stop any ongoing speech
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [answer]);


  /**
   * Handles the file input change event.
   * Reads the selected image file and converts it to a Base64 string.
   * @param {Object} event - The file input change event.
   */
  const handleImageChange = (event) => {
    setError(''); // Clear previous errors when a new image is selected
    const file = event.target.files[0];
    if (file) {
      // Check if the file type is an image
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (e.g., PNG, JPG).');
        setSelectedImage(null);
        setImageData('');
        return;
      }
      // Check file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size exceeds 5MB. Please choose a smaller image.');
        setSelectedImage(null);
        setImageData('');
        return;
      }

      setError(''); // Clear previous errors
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the Base64 string (data URL)
        setImageData(reader.result);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
        setSelectedImage(null);
        setImageData('');
      };
      reader.readAsDataURL(file); // Read the file as a data URL (Base64)
    } else {
      setSelectedImage(null);
      setImageData('');
      setError('');
    }
  };

  /**
   * Clears the selected image and its Base64 data.
   */
  const clearImage = () => {
    setSelectedImage(null);
    setImageData('');
    // Reset the file input value to allow re-uploading the same file
    document.getElementById('imageUpload').value = '';
    setError('');
  };

  /**
   * Handles the submission of the question and image to Gemini AI.
   * This function is asynchronous as it involves a network request.
   */
  const askGemini = async () => {
    // Clear previous answer and error messages
    setAnswer('');
    setError('');
    // Stop any ongoing speech before making a new request
    stopSpeech();
    // Set loading to true to show a loading indicator
    setLoading(true);

    try {
      // Prepare the parts for the Gemini API request
      const parts = [{ text: question }];

      // If an image is selected, add its inline data to the parts
      if (imageData) {
        parts.push({
          inlineData: {
            // Extract mimeType from the data URL (e.g., "image/png")
            mimeType: selectedImage.type,
            // Extract the Base64 data part (remove "data:image/png;base64," prefix)
            data: imageData.split(',')[1]
          }
        });
      }

      // Construct the chat history for the Gemini API call
      let chatHistory = [{ role: "user", parts: parts }];

      // Construct the payload for the Gemini API call
      const payload = { contents: chatHistory };

      // Get API key from environment variables
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        setError('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file.');
        setLoading(false);
        return;
      }
      // Define the API URL for the gemini-2.0-flash model (supports image understanding)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Make the fetch request to the Gemini API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Parse the JSON response from the API
      const result = await response.json();

      // Check if the response contains valid content
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        // Extract the text from Gemini's response
        const text = result.candidates[0].content.parts[0].text;
        // Update the answer state with Gemini's response
        setAnswer(text);
      } else {
        // If the response structure is unexpected, set an error message
        setError('Received an unexpected response from Gemini. Please try again.');
        console.error('Unexpected Gemini API response:', result);
      }
    } catch (err) {
      // Catch and display any network or API errors
      setError('Failed to connect to Gemini AI. Please check your network or try again later.');
      console.error('Error calling Gemini API:', err);
    } finally {
      // Always set loading to false once the request is complete (success or failure)
      setLoading(false);
    }
  };

  /**
   * Initiates text-to-speech for the current answer.
   */
  const speakAnswer = () => {
    if (!answer || !synthRef.current) {
      setError('No answer to speak or text-to-speech not supported.');
      return;
    }

    // If already speaking, stop and restart to ensure new utterance is used
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = 'en-US'; // Set language
    utterance.rate = speechRate; // Use the controlled speech rate
    utterance.pitch = 1; // Pitch of speech

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setError('Error during speech synthesis.');
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
    utteranceRef.current = utterance; // Store reference to the current utterance
  };

  /**
   * Pauses the ongoing speech.
   */
  const pauseSpeech = () => {
    if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsSpeaking(false); // Update state to reflect paused status
    }
  };

  /**
   * Resumes the paused speech.
   */
  const resumeSpeech = () => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsSpeaking(true); // Update state to reflect speaking status
    }
  };

  /**
   * Stops the ongoing or paused speech.
   */
  const stopSpeech = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 font-inter">
          Ask Me
        </h1>

        {/* Input section for the question */}
        <div className="mb-6">
          <label htmlFor="question" className="block text-lg font-medium text-gray-700 mb-2 font-inter">
            Your Question:
          </label>
          <div className="flex items-center space-x-2">
            <textarea
              id="question"
              className="flex-grow p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 resize-y min-h-[120px] font-inter"
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows="5"
              disabled={loading} // Disable textarea while loading
            ></textarea>
          </div>
        </div>

        {/* Image upload section */}
        <div className="mb-6">
          <label htmlFor="imageUpload" className="block text-lg font-medium text-gray-700 mb-2 font-inter">
            Upload an Image (Optional):
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer font-inter"
            disabled={loading}
          />
          {selectedImage && (
            <div className="mt-4 flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <img
                src={imageData}
                alt="Selected Preview"
                className="w-24 h-24 object-cover rounded-lg shadow-md border border-gray-300"
              />
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-700 font-inter">{selectedImage.name}</p>
                <p className="text-xs text-gray-500 font-inter">{(selectedImage.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={clearImage}
                className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 ease-in-out"
                title="Clear Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>


        {/* Button to submit the question */}
        <button
          onClick={askGemini}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out text-lg font-semibold font-inter"
          disabled={loading || (!question.trim() && !imageData)} // Disable if loading or both question and image are empty
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </div>
          ) : (
            'Ask Gemini'
          )}
        </button>

        {/* Display section for error messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg font-inter">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Display section for Gemini's answer */}
        {answer && (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-gray-800 mb-3 font-inter">Gemini's Answer:</h2>
            <div className="prose max-w-none text-gray-700 font-inter leading-relaxed">
              {answer.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
            {/* Text-to-Speech Controls */}
            <div className="mt-4 flex justify-end items-center space-x-2">
              <label htmlFor="speechRate" className="text-sm font-medium text-gray-700 font-inter">
                Speed: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                id="speechRate"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm"
                disabled={isSpeaking}
              />

              {!isSpeaking && synthRef.current && (
                <button
                  onClick={speakAnswer}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300 ease-in-out text-sm font-semibold font-inter"
                  title="Speak Answer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.064A1 1 0 0110 3.064v13.872a1 1 0 01-1.617.781L5 14.5V5.5l3.383-3.064zM11 12a1 1 0 100-2v2zm2-2a1 1 0 100-2v2zm2-2a1 1 0 100-2v2z" clipRule="evenodd" />
                  </svg>
                  Speak
                </button>
              )}
              {isSpeaking && synthRef.current && (
                <>
                  <button
                    onClick={pauseSpeech}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition duration-300 ease-in-out text-sm font-semibold font-inter"
                    title="Pause Speech"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </button>
                  <button
                    onClick={stopSpeech}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 ease-in-out text-sm font-semibold font-inter"
                    title="Stop Speech"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;