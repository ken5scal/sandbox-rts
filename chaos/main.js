const width = 300;
const height = 300;

let a, b, c, d, x, y;
const countMap = [];
let totalCount = 0;
const generateConstants = () => {
  a = Math.random() * 6 - 3;
  b = Math.random() * 6 - 3;
  c = Math.random() * 6 - 3;
  d = Math.random() * 6 - 3;
  x = 0;
  y = 0;

  countMap.length = 0;
  for (let j = 0; j <= height; j++) {
    countMap[j] = [];
    for (let i = 0; i <= width; i++) {
      countMap[j][i] = 0;
    }
  }
  totalCount = 0;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
};

const step = () => {
  const nx = Math.sin(a * y) - Math.cos(b * x);
  const ny = Math.sin(c * x) - Math.cos(d * y);

  x = nx;
  y = ny;

  const px = Math.floor(((x + 2) / 4) * width);
  const py = Math.floor(((y + 2) / 4) * height);

  countMap[py][px]++;
  totalCount++;
};

const plot = () => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  let count = 0;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const ratio = (countMap[j][i] / totalCount) * width;
      if (ratio) {
        const k = 1 - (1 - ratio) ** 100;
        ctx.fillStyle = `rgba(${255 * k},${255 * k},${255 * k},${k})`;
        ctx.fillRect(i, j, 1, 1);
        if (k > 0.1) {
          count++;
        }
      }
    }
  }
  if (count < width * height * 0.01) {
    generateConstants();
  }
};

let ctx;
const init = () => {
  const canvas = document.getElementById("canvas");
  canvas.width = width;
  canvas.height = height;

  ctx = canvas.getContext("2d");
  generateConstants();

  document.getElementById("reset").onclick = () => {
    generateConstants();
  };
};

window.onload = async () => {
  init();
  while (true) {
    await new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < 100000; i++) {
      step();
    }
    plot();
  }
};
