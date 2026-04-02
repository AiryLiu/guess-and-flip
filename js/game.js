// 游戏状态
const gameState = {
  category: null,
  duration: 5,
  words: [],
  currentIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  timeLeft: 0,
  timerInterval: null,
  isPlaying: false,
  canTrigger: true,
  hasGyro: false,
  // 陀螺仪相关
  baselineBeta: 0,
  baselineGamma: 0,
  lastTriggerTime: 0,
  calibrationSamples: []
};

// DOM 元素
const pages = {
  home: document.getElementById('page-home'),
  category: document.getElementById('page-category'),
  duration: document.getElementById('page-duration'),
  game: document.getElementById('page-game'),
  result: document.getElementById('page-result')
};

const elements = {
  btnStart: document.getElementById('btn-start'),
  btnGuide: document.getElementById('btn-guide'),
  modalGuide: document.getElementById('modal-guide'),
  btnCloseGuide: document.getElementById('btn-close-guide'),
  categoryList: document.getElementById('category-list'),
  btnBackCategory: document.getElementById('btn-back-category'),
  btnBackDuration: document.getElementById('btn-back-duration'),
  btnBegin: document.getElementById('btn-begin'),
  durationBtns: document.querySelectorAll('.duration-btn'),
  timer: document.getElementById('timer'),
  correctCount: document.getElementById('correct-count'),
  wrongCount: document.getElementById('wrong-count'),
  currentWord: document.getElementById('current-word'),
  btnCorrect: document.getElementById('btn-correct'),
  btnSkip: document.getElementById('btn-skip'),
  resultCorrect: document.getElementById('result-correct'),
  resultWrong: document.getElementById('result-wrong'),
  btnReplay: document.getElementById('btn-replay'),
  btnHome: document.getElementById('btn-home'),
  feedbackOverlay: document.getElementById('feedback-overlay'),
  orientationOverlay: document.getElementById('orientation-overlay')
};

// 页面切换
function showPage(pageName) {
  Object.values(pages).forEach(function(page) {
    page.classList.remove('active');
  });
  pages[pageName].classList.add('active');
}

// 初始化分类列表
function initCategories() {
  const categories = getCategories();
  elements.categoryList.innerHTML = '';

  categories.forEach(function(cat, index) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.category = cat.key;

    const icon = document.createElement('span');
    icon.className = 'category-icon';
    icon.textContent = cat.icon;

    const name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = cat.name;

    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = cat.count + '词';

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(count);

    card.addEventListener('click', function() {
      gameState.category = cat.key;
      showPage('duration');
    });

    elements.categoryList.appendChild(card);
  });
}

// 初始化时长选择
function initDurationSelection() {
  elements.durationBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      elements.durationBtns.forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      gameState.duration = parseInt(btn.dataset.duration);
    });
  });
}

// 格式化时间
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// 更新计时器显示
function updateTimer() {
  elements.timer.textContent = formatTime(gameState.timeLeft);
  if (gameState.timeLeft <= 30) {
    elements.timer.classList.add('warning');
  } else {
    elements.timer.classList.remove('warning');
  }
}

// 显示当前词语
function showCurrentWord() {
  if (gameState.currentIndex >= gameState.words.length) {
    endGame();
    return;
  }

  const word = gameState.words[gameState.currentIndex];
  elements.currentWord.style.opacity = 0;

  setTimeout(function() {
    elements.currentWord.textContent = word;

    const len = word.length;
    let fontSize = 80;
    if (len <= 2) fontSize = 80;
    else if (len <= 3) fontSize = 64;
    else if (len <= 4) fontSize = 52;
    else if (len <= 5) fontSize = 44;
    else fontSize = 36;

    elements.currentWord.style.fontSize = fontSize + 'px';
    elements.currentWord.style.opacity = 1;
  }, 150);
}

// 处理答对
function handleCorrect() {
  if (!gameState.canTrigger || !gameState.isPlaying) return;

  const now = Date.now();
  if (now - gameState.lastTriggerTime < 1000) return;
  gameState.lastTriggerTime = now;

  gameState.canTrigger = false;
  gameState.correctCount++;
  elements.correctCount.textContent = gameState.correctCount;

  showFeedback('correct');
  triggerHaptic('correct');

  setTimeout(function() {
    nextWord();
    gameState.canTrigger = true;
  }, 800);
}

// 处理答错
function handleWrong() {
  if (!gameState.canTrigger || !gameState.isPlaying) return;

  const now = Date.now();
  if (now - gameState.lastTriggerTime < 1000) return;
  gameState.lastTriggerTime = now;

  gameState.canTrigger = false;
  gameState.wrongCount++;
  elements.wrongCount.textContent = gameState.wrongCount;

  showFeedback('wrong');
  triggerHaptic('wrong');

  setTimeout(function() {
    nextWord();
    gameState.canTrigger = true;
  }, 800);
}

// 切换下一个词
function nextWord() {
  gameState.currentIndex++;
  if (gameState.currentIndex >= gameState.words.length) {
    endGame();
    return;
  }
  showCurrentWord();
}

// 显示反馈效果
function showFeedback(type) {
  elements.feedbackOverlay.className = 'feedback-overlay ' + type;
  setTimeout(function() {
    elements.feedbackOverlay.className = 'feedback-overlay';
  }, 400);
}

// 触发触觉反馈
function triggerHaptic(type) {
  // Android 设备使用 Vibration API
  if (navigator.vibrate) {
    if (type === 'correct') {
      navigator.vibrate([80, 40, 80]);
    } else {
      navigator.vibrate([100, 30, 100]);
    }
  }

  // iOS 设备使用 Haptic Feedback (需要用户交互触发)
  // 通过播放静音音频并触发振动来模拟
  try {
    if (type === 'correct') {
      // 轻触反馈
      if (window.TapticEngine) {
        window.TapticEngine.impact('light');
      }
    } else {
      // 错误反馈
      if (window.TapticEngine) {
        window.TapticEngine.notification('error');
      }
    }
  } catch (e) {
    // 忽略不支持的情况
  }
}

// 开始游戏
function startGame() {
  gameState.words = getShuffledWords(gameState.category);
  gameState.currentIndex = 0;
  gameState.correctCount = 0;
  gameState.wrongCount = 0;
  gameState.timeLeft = gameState.duration * 60;
  gameState.isPlaying = true;
  gameState.canTrigger = true;
  gameState.lastTriggerTime = 0;
  gameState.calibrationSamples = [];

  elements.correctCount.textContent = 0;
  elements.wrongCount.textContent = 0;
  elements.timer.classList.remove('warning');
  updateTimer();
  showCurrentWord();

  showPage('game');

  // 检查横屏状态
  checkOrientation();

  // 开始倒计时
  gameState.timerInterval = setInterval(function() {
    if (gameState.isPlaying) {
      gameState.timeLeft--;
      updateTimer();
      if (gameState.timeLeft <= 0) {
        endGame();
      }
    }
  }, 1000);

  startGyroscope();
}

// 结束游戏
function endGame() {
  gameState.isPlaying = false;

  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  elements.resultCorrect.textContent = gameState.correctCount;
  elements.resultWrong.textContent = gameState.wrongCount;

  showPage('result');
}

// 启动陀螺仪检测
function startGyroscope() {
  // iOS 13+ 需要请求权限
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(function(permission) {
        if (permission === 'granted') {
          gameState.hasGyro = true;
          window.addEventListener('deviceorientation', handleOrientation);
          console.log('陀螺仪已启用 (iOS)');
        }
      })
      .catch(function(error) {
        console.log('陀螺仪权限请求失败:', error);
      });
  } else if (window.DeviceOrientationEvent) {
    // 非iOS设备直接启用
    gameState.hasGyro = true;
    window.addEventListener('deviceorientation', handleOrientation);
    console.log('陀螺仪已启用 (非iOS)');
  }
}

// 处理方向变化
function handleOrientation(event) {
  if (!gameState.isPlaying) return;

  const beta = event.beta;   // 前后倾斜: -180 到 180 (绕X轴)
  const gamma = event.gamma; // 左右倾斜: -90 到 90 (绕Y轴)

  if (beta === null || gamma === null) return;

  // 校准阶段：收集前20个样本作为基准
  if (gameState.calibrationSamples.length < 20) {
    gameState.calibrationSamples.push({ beta: beta, gamma: gamma });
    if (gameState.calibrationSamples.length === 20) {
      // 计算基准值
      let sumBeta = 0, sumGamma = 0;
      gameState.calibrationSamples.forEach(function(s) {
        sumBeta += s.beta;
        sumGamma += s.gamma;
      });
      gameState.baselineBeta = sumBeta / 20;
      gameState.baselineGamma = sumGamma / 20;
      console.log('校准完成, 基准 beta:', gameState.baselineBeta.toFixed(1), 'gamma:', gameState.baselineGamma.toFixed(1));
    }
    return;
  }

  if (!gameState.canTrigger) return;

  // 计算相对于基准的偏移
  const deltaBeta = beta - gameState.baselineBeta;
  const deltaGamma = gamma - gameState.baselineGamma;

  const threshold = 50; // 触发阈值（度）

  // 检测翻转方向
  // 横屏握持时：
  // - 向上翻转（屏幕上边缘抬起，朝向天花板）: deltaBeta 显著变正
  // - 向下翻转（屏幕上边缘下压，朝向地面）: deltaBeta 显著变负

  if (deltaBeta > threshold) {
    // 向上翻转 = 答对
    console.log('检测到向上翻转, deltaBeta:', deltaBeta.toFixed(1));
    handleCorrect();
    // 更新基准
    gameState.baselineBeta = beta;
  } else if (deltaBeta < -threshold) {
    // 向下翻转 = 答错
    console.log('检测到向下翻转, deltaBeta:', deltaBeta.toFixed(1));
    handleWrong();
    // 更新基准
    gameState.baselineBeta = beta;
  }
}

// 检查屏幕方向
function checkOrientation() {
  // 仅在游戏页面检查
  if (!pages.game.classList.contains('active')) {
    return;
  }

  const isLandscape = window.innerWidth > window.innerHeight;

  if (isLandscape) {
    // 横屏：隐藏提示，继续游戏
    elements.orientationOverlay.classList.remove('show');
    if (!gameState.isPlaying && gameState.timeLeft > 0) {
      resumeGame();
    }
  } else {
    // 竖屏：显示提示，暂停游戏
    elements.orientationOverlay.classList.add('show');
    if (gameState.isPlaying) {
      pauseGame();
    }
  }
}

// 暂停游戏
function pauseGame() {
  gameState.isPlaying = false;
}

// 继续游戏
function resumeGame() {
  gameState.isPlaying = true;
  // 重新校准陀螺仪基准
  gameState.calibrationSamples = [];
}

// 绑定事件
function bindEvents() {
  elements.btnStart.addEventListener('click', function() {
    showPage('category');
  });

  elements.btnGuide.addEventListener('click', function() {
    elements.modalGuide.classList.add('show');
  });

  elements.btnCloseGuide.addEventListener('click', function() {
    elements.modalGuide.classList.remove('show');
  });

  elements.btnBackCategory.addEventListener('click', function() {
    showPage('home');
  });

  elements.btnBackDuration.addEventListener('click', function() {
    showPage('category');
  });

  elements.btnBegin.addEventListener('click', function() {
    startGame();
  });

  elements.btnCorrect.addEventListener('click', function() {
    handleCorrect();
  });

  elements.btnSkip.addEventListener('click', function() {
    handleWrong();
  });

  elements.btnReplay.addEventListener('click', function() {
    showPage('category');
  });

  elements.btnHome.addEventListener('click', function() {
    showPage('home');
  });

  elements.modalGuide.addEventListener('click', function(e) {
    if (e.target === elements.modalGuide) {
      elements.modalGuide.classList.remove('show');
    }
  });

  // 横屏检测
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', function() {
    setTimeout(checkOrientation, 100);
  });

  // 阻止默认滚动
  document.addEventListener('touchmove', function(e) {
    if (!e.target.closest('.modal-content')) {
      e.preventDefault();
    }
  }, { passive: false });
}

// 初始化
function init() {
  initCategories();
  initDurationSelection();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
