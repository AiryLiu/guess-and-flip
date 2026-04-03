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
  lastTriggerTime: 0,
  isWaitingForNeutral: false
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
  countdownOverlay: document.getElementById('countdown-overlay'),
  countdownNumber: document.getElementById('countdown-number')
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
      gameState.duration = parseFloat(btn.dataset.duration);
    });
  });
}

// 格式化时间
function formatTime(seconds) {
  // 确保秒数不为负数，防止显示为负值
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
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

    // 根据词语长度自适应字号，基准 108px
    const len = word.length;
    let fontSize = 108;
    if (len <= 2) fontSize = 108;
    else if (len === 3) fontSize = 88;
    else if (len === 4) fontSize = 72;
    else if (len === 5) fontSize = 60;
    else if (len <= 7) fontSize = 52;
    else fontSize = 44;

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

// 开始倒计时动画
function startCountdown(callback) {
  const overlay = elements.countdownOverlay;
  const numberEl = elements.countdownNumber;

  overlay.classList.add('show');
  let count = 3;

  function animateNumber(text) {
    numberEl.classList.remove('animate');
    numberEl.textContent = text;
    // Force reflow
    void numberEl.offsetWidth;
    numberEl.classList.add('animate');
  }

  animateNumber(count);

  const interval = setInterval(function() {
    count--;
    if (count > 0) {
      animateNumber(count);
    } else if (count === 0) {
      animateNumber('开始!');
    } else {
      clearInterval(interval);
      overlay.classList.remove('show');
      if (callback) callback();
    }
  }, 1000);
}

// 开始游戏
function startGame() {
  gameState.words = getShuffledWords(gameState.category);
  gameState.currentIndex = 0;
  gameState.correctCount = 0;
  gameState.wrongCount = 0;
  gameState.timeLeft = gameState.duration * 60;
  gameState.isPlaying = false; // 倒计时期间不允许操作
  gameState.canTrigger = false;
  gameState.lastTriggerTime = 0;
  gameState.isWaitingForNeutral = false;

  elements.correctCount.textContent = 0;
  elements.wrongCount.textContent = 0;
  elements.timer.classList.remove('warning');
  updateTimer();
  
  elements.currentWord.style.opacity = 0; // 倒计时期间隐藏词语

  showPage('game');

  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  startCountdown(function() {
    gameState.isPlaying = true;
    gameState.canTrigger = true;
    showCurrentWord();

    // 开始游戏倒计时
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
  });
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
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(function(permission) {
        if (permission === 'granted') {
          gameState.hasGyro = true;
          window.addEventListener('devicemotion', handleMotion);
          console.log('运动传感器已启用 (iOS)');
        }
      })
      .catch(function(error) {
        console.log('运动传感器权限请求失败:', error);
      });
  } else if (window.DeviceMotionEvent) {
    // 非iOS设备直接启用
    gameState.hasGyro = true;
    window.addEventListener('devicemotion', handleMotion);
    console.log('运动传感器已启用 (非iOS)');
  }
}

// 处理方向变化
function handleMotion(event) {
  if (!gameState.isPlaying) return;

  const z = event.accelerationIncludingGravity?.z;

  if (z === null || z === undefined) return;

  // 等待玩家将手机恢复到正常横屏握持姿势（Z轴加速度接近0）
  if (gameState.isWaitingForNeutral) {
    if (Math.abs(z) < 3) {
      gameState.isWaitingForNeutral = false;
      console.log('姿态已重置，可以进行下一次判定');
    }
    return;
  }

  if (!gameState.canTrigger) return;

  const threshold = 6; // 触发阈值 (重力加速度最大约 9.8)

  // 检测翻转方向
  // 向上翻转（屏幕朝天花板）: z > threshold
  // 向下翻转（屏幕朝地面）: z < -threshold

  if (z > threshold) {
    // 向上翻转 = 答对
    console.log('检测到向上翻转, z:', z.toFixed(1));
    handleCorrect();
    gameState.isWaitingForNeutral = true;
  } else if (z < -threshold) {
    // 向下翻转 = 答错
    console.log('检测到向下翻转, z:', z.toFixed(1));
    handleWrong();
    gameState.isWaitingForNeutral = true;
  }
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
