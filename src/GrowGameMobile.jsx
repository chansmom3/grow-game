import { useState, useRef } from "react";

const GRID_SIZE = 4;

const COLORS = {
  2: "#a8e6cf",
  4: "#88d8b0",
  8: "#6cc9a1",
  16: "#4db892",
  32: "#ffd93d",
  64: "#ffb347",
  128: "#ff8243",
  256: "#ff6b6b",
  512: "#c44569",
  1024: "#9b59b6",
  2048: "#8e44ad",
};

const STAGES = [
  {
    score: 0,
    bg: "linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)",
    height: 25,
    zone: "🌱 땅",
    scale: 0.4,
  },
  {
    score: 500,
    bg: "linear-gradient(180deg, #87CEEB 0%, #228B22 100%)",
    height: 40,
    zone: "🏠 마을",
    scale: 0.55,
  },
  {
    score: 2000,
    bg: "linear-gradient(180deg, #4A90D9 0%, #87CEEB 100%)",
    height: 55,
    zone: "🏙️ 도시",
    scale: 0.7,
  },
  {
    score: 5000,
    bg: "linear-gradient(180deg, #2E5090 0%, #87CEEB 100%)",
    height: 70,
    zone: "☁️ 구름",
    scale: 0.85,
  },
  {
    score: 10000,
    bg: "linear-gradient(180deg, #1a1a2e 30%, #4A90D9 100%)",
    height: 85,
    zone: "✈️ 하늘",
    scale: 1,
  },
  {
    score: 30000,
    bg: "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)",
    height: 100,
    zone: "🚀 우주",
    scale: 1.2,
  },
];

function initGrid() {
  const g = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
  addRandom(g);
  addRandom(g);
  return g;
}

function addRandom(g) {
  const empty = [];
  for (let i = 0; i < GRID_SIZE; i++)
    for (let j = 0; j < GRID_SIZE; j++) if (g[i][j] === 0) empty.push([i, j]);
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
}

export default function GrowGameMobile() {
  const [screen, setScreen] = useState("upload"); // upload, adjust, game
  const [faceImage, setFaceImage] = useState(null);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, scale: 1 });
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFaceImage(event.target.result);
        setScreen("adjust");
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustFace = (direction) => {
    setFacePosition((prev) => {
      switch (direction) {
        case "up":
          return { ...prev, y: prev.y - 5 };
        case "down":
          return { ...prev, y: prev.y + 5 };
        case "left":
          return { ...prev, x: prev.x - 5 };
        case "right":
          return { ...prev, x: prev.x + 5 };
        case "zoomIn":
          return { ...prev, scale: Math.min(2, prev.scale + 0.1) };
        case "zoomOut":
          return { ...prev, scale: Math.max(0.5, prev.scale - 0.1) };
        default:
          return prev;
      }
    });
  };

  function move(dir) {
    if (gameOver) return;
    const newGrid = grid.map((row) => [...row]);
    let moved = false,
      gained = 0;

    const rotate = (g, times) => {
      let result = g;
      for (let t = 0; t < times; t++) {
        result = result[0].map((_, i) => result.map((row) => row[i]).reverse());
      }
      return result;
    };

    const slideLeft = (g) => {
      for (let i = 0; i < GRID_SIZE; i++) {
        let row = g[i].filter((x) => x !== 0);
        for (let j = 0; j < row.length - 1; j++) {
          if (row[j] === row[j + 1]) {
            row[j] *= 2;
            gained += row[j];
            row.splice(j + 1, 1);
          }
        }
        while (row.length < GRID_SIZE) row.push(0);
        if (g[i].some((v, idx) => v !== row[idx])) moved = true;
        g[i] = row;
      }
    };

    const rotations = { left: 0, up: 1, right: 2, down: 3 };
    const rotated = rotate(newGrid, rotations[dir]);
    slideLeft(rotated);
    const final = rotate(rotated, (4 - rotations[dir]) % 4);

    if (moved) {
      addRandom(final);
      setGrid(final);
      setScore((s) => s + gained);

      let hasMove = false;
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (final[i][j] === 0) hasMove = true;
          if (i < GRID_SIZE - 1 && final[i][j] === final[i + 1][j])
            hasMove = true;
          if (j < GRID_SIZE - 1 && final[i][j] === final[i][j + 1])
            hasMove = true;
        }
      }
      if (!hasMove) setGameOver(true);
    }
  }

  const handleTouchStart = (e) => {
    if (screen !== "game") return;
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e) => {
    if (screen !== "game") return;
    // Prevent the browser from scrolling while swiping the board
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || screen !== "game") return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const minSwipe = 30;

    if (Math.abs(dx) > minSwipe || Math.abs(dy) > minSwipe) {
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    }
    setTouchStart(null);
  };

  const restart = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
  };

  const stage = [...STAGES].reverse().find((s) => score >= s.score) || STAGES[0];

  if (screen === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center p-6">
        <div className="text-center text-white mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold mb-2">나의 성장 2048</h1>
          <p className="opacity-80">점수가 오를수록 내가 커진다!</p>
        </div>

        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 border-4 border-dashed border-gray-300">
              <span className="text-5xl">🤳</span>
            </div>
            <p className="text-gray-600">내 얼굴 사진을 올려주세요!</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg mb-3 active:scale-95 transition-transform"
          >
            📷 사진 선택하기
          </button>

          <button
            onClick={() => setScreen("game")}
            className="w-full py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
          >
            기본 캐릭터로 시작
          </button>
        </div>
      </div>
    );
  }

  if (screen === "adjust") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center p-6">
        <div className="text-white text-center mb-4">
          <h2 className="text-xl font-bold">얼굴 위치 조절</h2>
          <p className="text-sm opacity-80">원 안에 얼굴이 오도록 조절하세요</p>
        </div>

        <div className="relative w-64 h-64 bg-white rounded-3xl overflow-hidden shadow-2xl mb-6">
          <div
            className="absolute w-full h-full"
            style={{
              backgroundImage: `url(${faceImage})`,
              backgroundSize: `${facePosition.scale * 100}%`,
              backgroundPosition: `${50 + facePosition.x}% ${50 + facePosition.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-48 h-48 border-4 border-blue-500 rounded-full"
              style={{ boxShadow: "0 0 0 999px rgba(0,0,0,0.5)" }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xl mb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div></div>
            <button
              onClick={() => adjustFace("up")}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200"
            >
              ⬆️
            </button>
            <div></div>
            <button
              onClick={() => adjustFace("left")}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200"
            >
              ⬅️
            </button>
            <div className="p-3 bg-blue-100 rounded-xl text-center">👤</div>
            <button
              onClick={() => adjustFace("right")}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200"
            >
              ➡️
            </button>
            <div></div>
            <button
              onClick={() => adjustFace("down")}
              className="p-3 bg-gray-100 rounded-xl active:bg-gray-200"
            >
              ⬇️
            </button>
            <div></div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => adjustFace("zoomOut")}
              className="flex-1 p-3 bg-gray-100 rounded-xl active:bg-gray-200 font-bold"
            >
              ➖
            </button>
            <button
              onClick={() => adjustFace("zoomIn")}
              className="flex-1 p-3 bg-gray-100 rounded-xl active:bg-gray-200 font-bold"
            >
              ➕
            </button>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => setScreen("upload")}
            className="flex-1 py-4 bg-white/20 text-white rounded-2xl font-bold active:scale-95 transition-transform"
          >
            다시 선택
          </button>
          <button
            onClick={() => setScreen("game")}
            className="flex-1 py-4 bg-white text-blue-600 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            게임 시작! 🎮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: stage.bg,
        touchAction: "none",
        overscrollBehavior: "contain",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 text-white text-center">
        <div className="text-2xl font-bold">⭐ {score.toLocaleString()}</div>
        <div className="text-sm opacity-80">{stage.zone}</div>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-end justify-center pb-4">
        {score >= 2000 && (
          <div className="absolute top-10 w-full flex justify-around opacity-50 text-4xl">
            <span>☁️</span>
            <span>☁️</span>
          </div>
        )}
        {score >= 10000 && (
          <div className="absolute top-4 w-full flex justify-around text-2xl">
            <span>✨</span>
            <span>⭐</span>
            <span>✨</span>
          </div>
        )}

        <div
          className="relative transition-all duration-700 ease-out"
          style={{
            transform: `scale(${stage.scale})`,
            transformOrigin: "bottom center",
          }}
        >
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-yellow-300 shadow-lg bg-yellow-100">
            {faceImage ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${faceImage})`,
                  backgroundSize: `${facePosition.scale * 100}%`,
                  backgroundPosition: `${50 + facePosition.x}% ${
                    50 + facePosition.y
                  }%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                😊
              </div>
            )}
          </div>
          <div className="w-20 h-28 bg-blue-500 mx-auto -mt-2 rounded-b-lg">
            <div className="w-full h-8 bg-blue-400 rounded-t-sm" />
          </div>
          <div className="flex justify-center gap-3 -mt-1">
            <div className="w-6 h-16 bg-gray-700 rounded-b-lg" />
            <div className="w-6 h-16 bg-gray-700 rounded-b-lg" />
          </div>
        </div>

        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-green-800 to-green-600" />
      </div>

      <div
        className="p-4 bg-black/30"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)",
        }}
      >
        <div
          className="bg-gray-800 p-2 rounded-xl mx-auto"
          style={{ width: "fit-content" }}
        >
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {grid.flat().map((val, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg flex items-center justify-center font-bold transition-all duration-100"
                style={{
                  backgroundColor: val ? COLORS[val] || "#8e44ad" : "#374151",
                  color: val >= 8 ? "white" : "#1a1a2e",
                  fontSize: val >= 1000 ? 12 : val >= 100 ? 14 : 18,
                }}
              >
                {val || ""}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-white/60 text-sm mt-2">스와이프로 이동</p>
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 text-center w-full max-w-sm">
            <div className="text-6xl mb-4">
              {score >= 10000 ? "🚀" : score >= 5000 ? "✈️" : "🎮"}
            </div>
            <div className="text-2xl font-bold mb-2">게임 오버!</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {score.toLocaleString()}점
            </div>
            <div className="text-gray-500 mb-6">{stage.zone}까지 성장!</div>
            <button
              onClick={restart}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform"
            >
              🔄 다시 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
