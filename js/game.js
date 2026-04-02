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
  lastBeta: 0
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
  btnSkip: document.getElementById('btn-skip'),
  resultCorrect: document.getElementById('result-correct'),
  resultWrong: document.getElementById('result-wrong'),
  btnReplay: document.getElementById('btn-replay'),
  btnHome: document.getElementById('btn-home'),
  feedbackOverlay: document.getElementById('feedback-overlay')
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

    // 自适应字体大小
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

  gameState.canTrigger = false;
  gameState.correctCount++;
  elements.correctCount.textContent = gameState.correctCount;

  showFeedback('correct');
  vibrate([80, 40, 80]);

  setTimeout(function() {
    nextWord();
    gameState.canTrigger = true;
  }, 800);
}

// 处理答错
function handleWrong() {
  if (!gameState.canTrigger || !gameState.isPlaying) return;

  gameState.canTrigger = false;
  gameState.wrongCount++;
  elements.wrongCount.textContent = gameState.wrongCount;

  showFeedback('wrong');
  vibrate([100, 30, 100]);

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

// 振动反馈
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
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
  gameState.lastBeta = 0;

  elements.correctCount.textContent = 0;
  elements.wrongCount.textContent = 0;
  elements.timer.classList.remove('warning');
  updateTimer();
  showCurrentWord();

  // 开始倒计时
  gameState.timerInterval = setInterval(function() {
    gameState.timeLeft--;
    updateTimer();
    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  showPage('game');
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
        }
      })
      .catch(function(error) {
        console.log('陀螺仪权限请求失败:', error);
      });
  } else if (window.DeviceOrientationEvent) {
    // 非iOS设备直接启用
    gameState.hasGyro = true;
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

// 处理方向变化
function handleOrientation(event) {
  if (!gameState.isPlaying || !gameState.canTrigger) return;

  const beta = event.beta; // 前后倾斜: -180 to 180
  if (beta === null) return;

  const threshold = 45;

  // 检测向上翻转（答对）- beta < -45
  if (beta < -threshold && gameState.lastBeta >= -threshold) {
    console.log('向上翻转, beta:', beta);
    handleCorrect();
  }
  // 检测向下翻转（答错）- beta > 45
  else if (beta > threshold && gameState.lastBeta <= threshold) {
    console.log('向下翻转, beta:', beta);
    handleWrong();
  }

  gameState.lastBeta = beta;
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
