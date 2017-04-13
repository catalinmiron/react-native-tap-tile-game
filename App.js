import React, { Component } from 'react';
import Exponent, { Components, Font, Asset } from 'expo';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  LayoutAnimation
} from 'react-native';
import CountdownTimer from './Timer';
import BTN_NORMAL from './assets/btn_normal.png';
import BTN_SUCCESS from './assets/btn_success.png';
import BTN_ERROR from './assets/btn_error.png';
import GAME_BG from './assets/game_bg.png';

const { width, height } = Dimensions.get('window');
const CELL_HEIGHT = 100;
const GAME_WIDTH = width - 10;
const MULTIPLIER = 100;

function cacheImages(images) {
  return images.map(image => Asset.fromModule(image).downloadAsync());
}

function cacheFonts(fonts) {
  return fonts.map(font => Font.loadAsync(font));
}

export default class TapTile extends Component {
  constructor(props) {
    super(props);

    this.timer = null;

    this.state = {
      level: 1,
      game: this.makeMatrix(),
      moveTo: 0,
      finished: false,
      position: new Animated.ValueXY(),
      gameStarted: false,
      score: 0
    };
  }

  async componentWillMount() {
    LayoutAnimation.spring();
    await this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    const imageAssets = cacheImages([
      require('./assets/btn_normal.png'),
      require('./assets/btn_error.png'),
      require('./assets/btn_success.png'),
      require('./assets/game_bg.png')
    ]);

    await Promise.all([...imageAssets]);

    this.setState({
      appIsReady: true
    });
  }

  makeMatrix(grid = Math.round(Math.random() * 3) + 1) {
    let matrix = [];
    for (var i = 0; i < 9; i++) {
      matrix[i] = [];
      for (var j = 0; j < grid + 1; j++) {
        if (j === 0) {
          matrix[i][j] = i + 1;
        } else {
          let random = Math.round(Math.random() * 9);
          if (random === i + 1) {
            random = random + 1 === 10 ? random - 1 : random + 1;
          }
          matrix[i][j] = random;
        }
      }

      this.shuffle(matrix[i]);
    }

    return matrix;
  }

  getGameStyle() {
    return [
      styles.gameContent,
      { transform: this.state.position.getTranslateTransform() }
    ];
  }

  animateGame(moveTo) {
    Animated.timing(this.state.position, {
      duration: 200,
      toValue: { x: 0, y: moveTo * CELL_HEIGHT },
      useNativeDriver: true
    }).start();
  }

  shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
      j = Math.floor(Math.random() * i);
      x = a[i - 1];
      a[i - 1] = a[j];
      a[j] = x;
    }
  }

  reversedKeys() {
    return Object.keys(this.state.game).sort((a, b) => b - a);
  }

  async restartGame() {
    this.state.position.setValue({ x: 0, y: 0 });
    this.setState({
      game: this.makeMatrix(),
      moveTo: 0,
      gameStarted: false,
      finished: false,
      gameOver: false,
      level: 1,
      score: 0
    });
  }

  renderGameOver() {
    return (
      <View style={styles.topContent}>
        <Text style={styles.shadowSmall}>Game over</Text>
        <TouchableOpacity onPress={() => this.restartGame()}>
          <Text style={[styles.shadowSmall, styles.small]}>RESTART</Text>
        </TouchableOpacity>
      </View>
    );
  }

  renderCongrats() {
    return (
      <View style={styles.topContent}>
        <Text style={styles.shadowSmall}>CONGRATS!</Text>
        <TouchableOpacity onPress={() => this.restartGame()}>
          <Text style={[styles.shadowSmall, styles.small]}>RESTART</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const { score, gameOver, finished, appIsReady, gameStarted } = this.state;

    if (!appIsReady) {
      return <Components.AppLoading />;
    }

    return (
      <Image style={styles.backgroundImage} source={GAME_BG}>
        <View style={styles.container}>
          <Text
            style={[
              styles.shadowSmall,
              { fontSize: 24, paddingTop: 12, paddingBottom: 12 }
            ]}>
            Score: {score}
          </Text>
          {gameOver
            ? this.renderGameOver()
            : finished ? this.renderCongrats() : null}
          {gameStarted && !gameOver
            ? <CountdownTimer
                initialTimeRemaining={5000}
                interval={60}
                completeCallback={() => this.gameoverResetState()}
              />
            : null}
          {this.renderGame()}
        </View>
      </Image>
    );
  }

  getRandomRotation() {
    return `${[-1, 1][Math.random() * 2 | 0] * Math.round(Math.random() * 12)}deg`;
  }

  gameoverResetState() {
    this.setState({
      gameOver: true,
      gameStarted: false
    });

    setTimeout(() => this.animateGame(9.5), 500);
  }

  renderGame() {
    const { game, moveTo } = this.state;

    return (
      <View style={{ height: height * 3 / 4, overflow: 'hidden', width }}>
        <Animated.View style={this.getGameStyle()}>
          {this.reversedKeys().map(index => {
            return (
              <View style={styles.row} key={index}>
                {game[index].map((cell, i) => {
                  const parsedIndex = parseFloat(index);
                  const selectedStyle = (moveTo - 1 === parsedIndex &&
                    moveTo === cell) ||
                    (this.state.finished &&
                      moveTo === parsedIndex &&
                      moveTo + 1 === cell);
                  const gameOverStyle = this.state.gameOver;

                  let image = BTN_NORMAL;

                  if (selectedStyle) {
                    image = BTN_SUCCESS;
                  }
                  if (gameOverStyle) {
                    image = BTN_ERROR;
                  }

                  const cellWidth = GAME_WIDTH / game[index].length;

                  return (
                    <TouchableOpacity
                      focusedOpacity={0.7}
                      activeOpacity={0.7}
                      style={[styles.cell]}
                      key={index + cell + i}
                      onPress={() => {
                        this.setState({
                          gameStarted: true
                        });
                        if (
                          cell !== parsedIndex + 1 || moveTo !== parsedIndex
                        ) {
                          this.gameoverResetState();

                          return;
                        }

                        this.animateGame(moveTo);

                        if (moveTo === 8) {
                          this.setState({
                            finished: true,
                            gameStarted: false
                          });

                          return;
                        }
                        this.setState({
                          moveTo: moveTo + 1,
                          score: (this.state.moveTo + 1) * MULTIPLIER
                        });
                      }}>
                      <View
                        style={[
                          styles.cellContent,
                          {
                            transform: [
                              {
                                rotate: this.state.gameOver
                                  ? this.getRandomRotation()
                                  : '0deg'
                              }
                            ]
                          }
                        ]}>
                        <Image
                          source={image}
                          style={[styles.imageCell, { width: cellWidth }]}>
                          <Text
                            style={[
                              styles.cellText,
                              styles.shadow,
                              {
                                fontSize: Math.min(
                                  CELL_HEIGHT * 0.55,
                                  cellWidth
                                )
                              }
                            ]}>
                            {cell}
                          </Text>
                        </Image>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40
  },
  cellText: {
    fontFamily: 'Chalkboard SE',
    fontSize: 42,
    color: 'white'
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT
  },
  imageCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: CELL_HEIGHT,
    resizeMode: 'stretch'
  },

  cellContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  row: {
    flexDirection: 'row'
  },

  topContent: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },

  backgroundImage: {
    resizeMode: 'cover',
    height: height,
    width: width
  },

  gameContent: {
    flex: 8,
    width: GAME_WIDTH,
    height: 9 * CELL_HEIGHT,
    alignSelf: 'center',
    justifyContent: 'flex-end'
  },

  shadow: {
    fontSize: 42,
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 3
    },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    backgroundColor: 'transparent'
  },

  shadowSmall: {
    fontSize: 42,
    color: '#fff',
    fontWeight: '700',
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 2
    },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    backgroundColor: 'transparent'
  },

  small: {
    fontSize: 24
  }
});
