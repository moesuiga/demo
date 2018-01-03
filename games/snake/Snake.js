(function(global){
  var cvs = null,       // 画布元素
    ctx = null,         // 画布环境
    size = 10,          // 每个组成块的大小
    moved = false,      // 蛇是否移动了
    score = 0,          // 得分
    level = 0,          // 等级
    timerId,            // 定时器id
    time = 200,         // 定时间隔
    cache = {           // 缓存初始位置
      body: [],
      direction: '',
    },
    apple = {           // 苹果
      sizeR: size / 2,
      draw: function() {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(this.posX * size + this.sizeR, this.posY * size + this.sizeR, this.sizeR, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = 'black';
      }
    };

  var Block = function(col, row, size) { // 组成块
    this.col = col;
    this.row = row;
    this.size = size;
  }
  Block.prototype.draw = function() {
    ctx.beginPath();
    ctx.fillRect(this.col * this.size, this.row * this.size, this.size, this.size);
    ctx.fill();
  }

  var showInfo = function() {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${level}`, 5, 5);
    ctx.fillText(`Score:${score}`, 5, 30);
  }

  var Snake = function(bodyPoint, direction) {
    // bodyPoint => [{x: 20, y: 20}, {x: 20, y: 21}, {x: 20, y: 22}]
    this.body = bodyPoint.map(function(item){
      cache.body.push(new Block(item.x, item.y, size));
      return new Block(item.x, item.y, size);
    });
    cache.direction = direction;
    this.direction = direction;
  }
  var checkApple = function(snake) {
    while(true) {
      var check = true;
      apple.posX = Math.floor(Math.random() * (cvs.width / size));
      apple.posY = Math.floor(Math.random() * (cvs.height / size));
      for (var i = 0; i < snake.body.length; i++) {
        if (snake.body[i].col === apple.posX && snake.body[i].row === apple.posY) { // 如果新苹果出现在了蛇身上
          check = false;
          break;
        }
      }
      if (check) { // 如果苹果位置正常，跳出循环
        break;
      }
    }
  }
  var levelUp = function(snake, newLevel) {
    time = 200 - newLevel * 10;
    if (time < 50) time = 50;
    clearInterval(timerId);
    updateState(snake);
  }
  var updateState = function(snake) {
    timerId = setInterval(function(){
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      showInfo();
      snake.draw();
      apple.draw();
      snake.move();
      ctx.strokeRect(0, 0, cvs.width, cvs.height);
    }, time)
  }

  Snake.prototype = {
    constructor: Snake,
    init: function(canvas) {
      cvs = canvas;                    // 初始化时，记录当前画布和环境
      ctx = canvas.getContext('2d');

      checkApple(this);

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.beginPath();
      showInfo();
      snake.draw();
      apple.draw();
      ctx.font = '40px "Comic Sans MS"';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'orange';
      ctx.fillText('GAME START', cvs.width / 2, cvs.height / 3);
      ctx.fillStyle = '#000';
      ctx.strokeRect(0, 0, cvs.width, cvs.height);
      return this;
    },
    start: function () {
      var snake = this;
      var body = document.getElementsByTagName('body')[0];
      var changeDirection = function(e) { // 控制移动
        if (!moved) return; // 如果蛇在上次按键之后还没有移动，按键无效
        var kc = e.keyCode;
        if (kc === 37 && snake.direction !== 'right') { // 向左
          snake.direction = 'left';
        }
        if (kc === 38 && snake.direction !== 'down') {  // 向上
          snake.direction = 'top';
        }
        if (kc === 39 && snake.direction !== 'left') {  // 项右
          snake.direction = 'right';
        }
        if (kc === 40 && snake.direction !== 'top') {   // 向下
          snake.direction = 'down';
        }
        // BUG: 如果按键较快，比如在向左时，快速向下或向上，然后在快速的向右，可以改变方向，而此时原本向左的蛇，在按上或下时，还未移动，又换到了向右，蛇会从向左改为向右移动，然后自食，GAMEOVER。
        // 修复方案，每次按键需要等蛇移动一次之后再按才可以
        // console.log(snake.direction,snake.body[0].col,snake.body[0].row,snake.body[1].col,snake.body[1].row,snake.body[2].col,snake.body[2].row)
        moved = false; // 按键之后蛇还没有移动
      }
      body.addEventListener('keydown', changeDirection);
      updateState(snake)
    },
    draw: function() {
      this.body.forEach(function(item) {
        item.draw();
      })
    },
    move: function() { // 移动
      var d = this.direction,
        head = this.body[0],
        newHead = null;

      if (d === 'top') {
        newHead = new Block(head.col, head.row - 1, size);
      } else if (d === 'down') {
        newHead = new Block(head.col, head.row + 1, size);
      } else if (d === 'left') {
        newHead = new Block(head.col - 1, head.row, size);
      } else if (d === 'right') {
        newHead = new Block(head.col + 1, head.row, size);
      }

      this.body.unshift(newHead);

      if (newHead.col === apple.posX && newHead.row === apple.posY) { // 吃到了苹果
        score += 100;
        var newLevel = Math.floor(score / 2000)
        if(level !== newLevel){
          level = newLevel;
          levelUp(this, level);
        }
        // 新苹果的位置不能出现在蛇身上
        checkApple(this);
      } else {
        this.body.pop();
      }
      moved = true; // 移动了
      this.gameOver(); // 移动后判断是否游戏结束
    },
    pause: function() { // 游戏暂停
      clearInterval(timerId);
      ctx.beginPath();
      ctx.font = '40px "Comic Sans MS"';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'orange';
      ctx.fillText('PAUSE', cvs.width / 2, cvs.height / 3);
      ctx.fillStyle = '#000';
    },
    goOn: function() {  // 游戏继续
      updateState(this);
    },
    gameOver: function() { // 结束判断
      var head = this.body[0],
        isOver = false;
      if (head.col < 0 || head.row < 0 || head.col * size >= cvs.width || head.row * size >= cvs.height) { // 蛇头碰到边界
        isOver = true;
      }
      if (!isOver) {
        for (var i = 1; i < this.body.length; i++) {
          if (head.col === this.body[i].col && head.row === this.body[i].row) { // 头撞身体上
            isOver = true;
            break;
          }
        }
      }
      if (isOver) { // 如果结束了
        clearInterval(timerId); // 清除定时器
        ctx.fillStyle = 'orange';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '60px "Comic Sans MS"';
        ctx.fillText('GAME OVER!', cvs.width / 2, cvs.height / 2); // 提醒 游戏结束
        ctx.fillStyle = 'black';
      }
      return isOver;
    },
    restart: function() {
      this.body = [];
      for (var i = 0; i < cache.body.length; i++) {
        this.body.push(cache.body[i]);
      }
      this.direction = cache.direction;
      score = 0;
      level = 0;
      time = 200;
      this.init(cvs).start();
    }
  }

  global.Snake = Snake;
})(window)
