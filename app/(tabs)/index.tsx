import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause } from 'lucide-react-native';

const GRID_SIZE = 15;
const CELL_SIZE = 10;
const GAME_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameState = 'SPLASH' | 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>('SPLASH');
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const gameLoop = useRef<NodeJS.Timeout>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState === 'SPLASH') {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Wait 2 seconds at full opacity
      const timer = setTimeout(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setGameState('MENU');
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
  };

  const resetGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    setScore(0);
    generateFood();
  };

  const moveSnake = () => {
    const head = snake[0];
    const newHead = { ...head };

    switch (direction) {
      case 'UP':
        newHead.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'DOWN':
        newHead.y = (head.y + 1) % GRID_SIZE;
        break;
      case 'LEFT':
        newHead.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'RIGHT':
        newHead.x = (head.x + 1) % GRID_SIZE;
        break;
    }

    // Check collision with food
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(prev => prev + 1);
      generateFood();
      setSnake([newHead, ...snake]);
    } else {
      // Check collision with self
      if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState('GAME_OVER');
        return;
      }
      setSnake([newHead, ...snake.slice(0, -1)]);
    }
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoop.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoop.current) clearInterval(gameLoop.current);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [gameState, snake, direction]);

  const renderCell = (rowIndex: number, colIndex: number) => {
    const isSnake = snake.some(segment => segment.x === colIndex && segment.y === rowIndex);
    const isFood = food.x === colIndex && food.y === rowIndex;

    return (
      <View
        key={`${rowIndex}-${colIndex}`}
        style={[
          styles.cell,
          isSnake && styles.snakeCell,
          isFood && styles.foodCell,
        ]}
      />
    );
  };

  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const rowCells = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        rowCells.push(renderCell(row, col));
      }
      grid.push(
        <View key={row} style={styles.row}>
          {rowCells}
        </View>
      );
    }
    return grid;
  };

  const renderSplash = () => (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Text style={styles.splashText}>MEZZ Studios</Text>
    </Animated.View>
  );

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>SNAKE</Text>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          resetGame();
          setGameState('PLAYING');
        }}>
        <Text style={styles.menuButtonText}>START GAME</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>GAME OVER</Text>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          resetGame();
          setGameState('PLAYING');
        }}>
        <Text style={styles.menuButtonText}>PLAY AGAIN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setGameState('MENU')}>
        <Text style={styles.menuButtonText}>MAIN MENU</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8ba060', '#577c43']}
        style={styles.gameboy}>
        {gameState === 'SPLASH' ? (
          renderSplash()
        ) : (
          <>
            <View style={styles.screen}>
              <View style={styles.screenInner}>
                {gameState === 'MENU' && renderMenu()}
                {gameState === 'GAME_OVER' && renderGameOver()}
                {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                  <>
                    <View style={styles.gameHeader}>
                      <Text style={styles.scoreText}>Score: {score}</Text>
                      <TouchableOpacity
                        onPress={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')}>
                        {gameState === 'PLAYING' ? (
                          <Pause size={20} color="#577c43" />
                        ) : (
                          <Play size={20} color="#577c43" />
                        )}
                      </TouchableOpacity>
                    </View>
                    <View style={styles.grid}>{renderGrid()}</View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.controls}>
              <View style={styles.dpad}>
                <TouchableOpacity
                  style={[styles.dpadButton, styles.dpadUp]}
                  onPress={() => direction !== 'DOWN' && setDirection('UP')}>
                  <View style={styles.dpadArrow} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dpadButton, styles.dpadRight]}
                  onPress={() => direction !== 'LEFT' && setDirection('RIGHT')}>
                  <View style={styles.dpadArrow} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dpadButton, styles.dpadDown]}
                  onPress={() => direction !== 'UP' && setDirection('DOWN')}>
                  <View style={styles.dpadArrow} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dpadButton, styles.dpadLeft]}
                  onPress={() => direction !== 'RIGHT' && setDirection('LEFT')}>
                  <View style={styles.dpadArrow} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionButtons}>
                <View style={styles.startSelect}>
                  <TouchableOpacity
                    style={styles.systemButton}
                    onPress={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')}>
                    <Text style={styles.systemButtonText}>START</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.systemButton}
                    onPress={() => setGameState('MENU')}>
                    <Text style={styles.systemButtonText}>SELECT</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.abButtons}>
                  <TouchableOpacity style={[styles.actionButton, styles.buttonB]}>
                    <Text style={styles.buttonText}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.buttonA]}>
                    <Text style={styles.buttonText}>A</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  gameboy: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2d3a1e',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  screen: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#9ca04c',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  screenInner: {
    flex: 1,
    backgroundColor: '#8ba060',
    borderRadius: 4,
    padding: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  grid: {
    flex: 1,
    backgroundColor: '#577c43',
    padding: 2,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 1,
    backgroundColor: '#8ba060',
  },
  snakeCell: {
    backgroundColor: '#2d3a1e',
  },
  foodCell: {
    backgroundColor: '#a01c1c',
  },
  controls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  dpad: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  dpadButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#2d3a1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadUp: {
    top: 0,
    left: 40,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dpadRight: {
    top: 40,
    right: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  dpadDown: {
    bottom: 0,
    left: 40,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  dpadLeft: {
    top: 40,
    left: 0,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  dpadArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderTopColor: '#4a5d32',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  actionButtons: {
    alignItems: 'center',
  },
  startSelect: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  systemButton: {
    backgroundColor: '#2d3a1e',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 10,
    transform: [{ rotate: '-25deg' }],
  },
  systemButtonText: {
    color: '#8ba060',
    fontSize: 12,
    fontWeight: 'bold',
  },
  abButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2d3a1e',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonA: {
    transform: [{ translateY: -20 }],
  },
  buttonB: {
    transform: [{ translateY: 20 }],
  },
  buttonText: {
    color: '#8ba060',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3a1e',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#2d3a1e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  menuButtonText: {
    color: '#8ba060',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#2d3a1e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});