# Space-Shooter-Game
Create a 2D space shooter game where players control a spaceship, dodge enemy bullets, and destroy enemy ships to score points, with increasing difficulty and power-ups.
Create a new React Native project:
npx react-native init SpaceShooter
cd SpaceShooter
Install dependencies:
npm install @react-native-async-storage/async-storage react-native-reanimated react-native-game-engine tailwind-rn react-native-sensors
Set up Tailwind CSS:
npm install tailwindcss
npx tailwindcss init
Update tailwind.config.js:
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
Create tailwind.json:
{
  "tailwindCSS.includeLanguages": { "javascript": "javascript" }
}
Replace App.js with the provided code.
Enable Reanimated in babel.config.js:
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
Start the development server:
npm start
Run on an Android emulator or device:
npx react-native run-android
# Space Shooter Game
A professional 2D space shooter game for Android, built with React Native.

## Installation
```bash
npm install
npm install @react-native-async-storage/async-storage react-native-reanimated react-native-game-engine tailwind-rn react-native-sensors
Usage
Start the app: npm start
Run on Android: npx react-native run-android
Move your spaceship to shoot enemies and avoid bullets. Score points by destroying enemies.
Features
Dynamic 2D gameplay with animated sprites.
High score tracking with AsyncStorage.
Touch and tilt controls.
Power-up system (planned for future updates).
Monetization-ready with optional ads.
