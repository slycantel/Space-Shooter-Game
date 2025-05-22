import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTailwind } from 'tailwind-rn';
import { GameEngine } from 'react-native-game-engine';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 40;
const BULLET_SIZE = 10;
const INITIAL_PLAYER = { x: width / 2 - PLAYER_SIZE / 2, y: height - 100, health: 3 };

const App = () => {
  const tailwind = useTailwind();
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [entities, setEntities] = useState({
    player: { ...INITIAL_PLAYER, renderer: <Player /> },
    enemies: [],
    bullets: [],
  });

  // Load high scores
  useEffect(() => {
    const loadHighScores = async () => {
      try {
        const stored = await AsyncStorage.getItem('highScores');
        if (stored) setHighScores(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading high scores:', error);
      }
    };
    loadHighScores();
  }, []);

  // Save high score
  const saveHighScore = async () => {
    try {
      const newScores = [...highScores, { score, date: new Date().toISOString() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      await AsyncStorage.setItem('highScores', JSON.stringify(newScores));
      setHighScores(newScores);
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  // Reset high scores
  const resetHighScores = async () => {
    try {
      await AsyncStorage.setItem('highScores', JSON.stringify([]));
      setHighScores([]);
      alert('High scores cleared!');
    } catch (error) {
      console.error('Error resetting high scores:', error);
    }
  };

  // Game systems
  const systems = {
    movePlayer: ({ entities, touches }) => {
      const player = entities.player;
      touches.forEach(touch => {
        player.x = Math.max(0, Math.min(width - PLAYER_SIZE, touch.event.pageX - PLAYER_SIZE / 2));
      });
      return entities;
    },
    spawnEnemies: ({ entities, time }) => {
      if (time.current % 2000 < 50) {
        entities.enemies.push({
          x: Math.random() * (width - ENEMY_SIZE),
          y: -ENEMY_SIZE,
          renderer: <Enemy />,
        });
      }
      entities.enemies = entities.enemies.map(enemy => ({
        ...enemy,
        y: enemy.y + 2,
      })).filter(enemy => enemy.y < height);
      return entities;
    },
    shootBullets: ({ entities, time }) => {
      if (time.current % 500 < 50) {
        entities.bullets.push({
          x: entities.player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
          y: entities.player.y - BULLET_SIZE,
          renderer: <Bullet />,
        });
      }
      entities.bullets = entities.bullets.map(bullet => ({
        ...bullet,
        y: bullet.y - 5,
      })).filter(bullet => bullet.y > -BULLET_SIZE);
      return entities;
    },
    checkCollisions: ({ entities }) => {
      const player = entities.player;
      entities.enemies = entities.enemies.filter(enemy => {
        const hit = Math.abs(player.x - enemy.x) < PLAYER_SIZE && Math.abs(player.y - enemy.y) < PLAYER_SIZE;
        if (hit) {
          player.health -= 1;
          if (player.health <= 0) {
            setGameState('gameOver');
            saveHighScore();
          }
          return false;
        }
        return true;
      });
      entities.bullets.forEach(bullet => {
        entities.enemies = entities.enemies.filter(enemy => {
          const hit = Math.abs(bullet.x - enemy.x) < ENEMY_SIZE && Math.abs(bullet.y - enemy.y) < ENEMY_SIZE;
          if (hit) {
            setScore(score + 10);
            return false;
          }
          return true;
        });
      });
      return entities;
    },
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setEntities({
      player: { ...INITIAL_PLAYER, renderer: <Player /> },
      enemies: [],
      bullets: [],
    });
  };

  // Render components
  const Player = () => {
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: withTiming(entities.player.x, { duration: 50 }) },
        { translateY: withTiming(entities.player.y, { duration: 50 }) },
      ],
    }));
    return <Reanimated.View style={[tailwind('w-12 h-12 bg-blue-500 rounded-full'), style]} />;
  };

  const Enemy = ({ x, y }) => {
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: withTiming(x, { duration: 50 }) },
        { translateY: withTiming(y, { duration: 50 }) },
      ],
    }));
    return <Reanimated.View style={[tailwind('w-10 h-10 bg-red-500 rounded-full'), style]} />;
  };

  const Bullet = ({ x, y }) => {
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: withTiming(x, { duration: 50 }) },
        { translateY: withTiming(y, { duration: 50 }) },
      ],
    }));
    return <Reanimated.View style={[tailwind('w-3 h-3 bg-yellow-500 rounded-full'), style]} />;
  };

  // Render screens
  const renderMenu = () => (
    <View style={tailwind('flex-1 justify-center items-center bg-gray-900')}>
      <Text style={tailwind('text-4xl text-white mb-8')}>Space Shooter</Text>
      <TouchableOpacity style={tailwind('bg-blue-500 p-4 rounded-lg mb-4')} onPress={startGame}>
        <Text style={tailwind('text-white text-lg')}>Start Game</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tailwind('bg-gray-500 p-4 rounded-lg mb-4')}
        onPress={() => setGameState('highScores')}
      >
        <Text style={tailwind('text-white text-lg')}>High Scores</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tailwind('bg-red-500 p-4 rounded-lg')} onPress={resetHighScores}>
        <Text style={tailwind('text-white text-lg')}>Reset Scores</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => (
    <View style={tailwind('flex-1 bg-gray-900')}>
      <GameEngine
        style={tailwind('flex-1')}
        systems={[systems.movePlayer, systems.spawnEnemies, systems.shootBullets, systems.checkCollisions]}
        entities={entities}
        running={gameState === 'playing'}
      />
      <Text style={tailwind('text-white text-2xl absolute top-4 left-4')}>
        Score: {score} | Health: {entities.player.health}
      </Text>
    </View>
  );

  const renderHighScores = () => (
    <View style={tailwind('flex-1 justify-center items-center bg-gray-900')}>
      <Text style={tailwind('text-3xl text-white mb-4')}>High Scores</Text>
      {highScores.length ? (
        highScores.map((entry, index) => (
          <Text key={index} style={tailwind('text-lg text-white')}>
            {index + 1}. {entry.score} points ({entry.date})
          </Text>
        ))
      ) : (
        <Text style={tailwind('text-lg text-white')}>No high scores yet.</Text>
      )}
      <TouchableOpacity
        style={tailwind('bg-blue-500 p-4 rounded-lg mt-4')}
        onPress={() => setGameState('menu')}
      >
        <Text style={tailwind('text-white text-lg')}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGameOver = () => (
    <View style={tailwind('flex-1 justify-center items-center bg-gray-900')}>
      <Text style={tailwind('text-3xl text-white mb-4')}>Game Over!</Text>
      <Text style={tailwind('text-2xl text-white mb-8')}>Score: {score}</Text>
      <TouchableOpacity style={tailwind('bg-blue-500 p-4 rounded-lg mb-4')} onPress={startGame}>
        <Text style={tailwind('text-white text-lg')}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tailwind('bg-gray-500 p-4 rounded-lg')}
        onPress={() => setGameState('menu')}
      >
        <Text style={tailwind('text-white text-lg')}>Main Menu</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={tailwind('flex-1')}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'highScores' && renderHighScores()}
      {gameState === 'gameOver' && renderGameOver()}
    </View>
  );
};

export default App;
