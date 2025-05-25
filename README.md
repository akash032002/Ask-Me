# Ask Me - AI-Powered Q&A App

A modern React application that leverages Google's Gemini AI to answer questions, analyze images, and provide text-to-speech responses.

## Features

- 🤖 Ask questions to Gemini AI
- 📸 Upload images for visual context
- 🗣️ Text-to-speech functionality
- 🎚️ Adjustable speech rate
- 🎨 Modern, responsive UI
- 🌐 Real-time AI responses

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ask-me.git
   cd ask-me
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

The app will open in your default browser at `http://localhost:3000`.

## Project Structure

```
ask-me/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Usage

1. Type your question in the text area
2. (Optional) Upload an image for visual context
3. Click "Ask Gemini" to get an AI response
4. Use the speech controls to listen to the answer:
   - 🔊 Speak: Start text-to-speech
   - ⏸️ Pause: Pause the speech
   - ⏹️ Stop: Stop the speech
   - 🎚️ Speed: Adjust speech rate (0.5x - 2.0x)

## Environment Variables

The app requires a Gemini API key to function. Create a `.env` file in the root directory with:

```
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

⚠️ Never commit your API key to version control. The `.env` file is included in `.gitignore`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini AI](https://deepmind.google/technologies/gemini/) for the AI capabilities
- [React](https://reactjs.org/) for the frontend framework
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for text-to-speech functionality