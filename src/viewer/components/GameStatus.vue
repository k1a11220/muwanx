<template>
  <div v-if="isVisible" class="game-overlay">
    <div class="top-bar">
      <div class="mission-box">
        <span class="checkmark">✓</span>
        <span class="mission-text"
          >Mission: Deliver the pizza to the place!</span
        >
      </div>

      <div class="top-right">
        <div class="timer">{{ elapsedTime }}</div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="bottom-left">
        <div class="info-row">
          <span class="label">Distance:</span>
          <span class="value">{{ distanceToGoal }}m</span>
        </div>
        <div class="info-row">
          <span class="label">Pizza:</span>
          <span class="value" :class="pizzaStatusClass">{{
            pizzaStatusText
          }}</span>
        </div>
      </div>

      <div class="bottom-right">
        <div class="leaderboard">
          <div class="leaderboard-title">Leaderboard</div>
          <div
            class="leaderboard-item"
            v-for="(record, index) in topRecords"
            :key="index"
          >
            <span class="rank"
              >{{ index + 1 }}{{ getRankSuffix(index + 1) }}:</span
            >
            <span class="time">{{ record }}</span>
          </div>
          <div class="view-more">View more</div>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'success'" class="fullscreen-overlay">
      <div class="result-screen">
        <h1 class="result-title">Mission Success!</h1>

        <div class="result-stats">
          <div class="stat-item">
            <div class="stat-label">Time</div>
            <div class="stat-value">{{ elapsedTime }}</div>
          </div>

          <div class="pizza-icon">🍕</div>

          <div class="stat-item">
            <div class="stat-label">Rank</div>
            <div class="stat-value">{{ currentRank }}</div>
          </div>
        </div>

        <div class="result-buttons">
          <button class="result-btn retry-btn" @click="handleRetry">
            Retry
          </button>
          <button class="result-btn next-btn" @click="handleNext">
            Next level
          </button>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'failed'" class="fullscreen-overlay">
      <div class="result-screen failed-screen">
        <h1 class="result-title failed-title">Mission Failed!</h1>
        <p class="failed-message">Pizza lost...</p>
        <div class="result-buttons">
          <button class="result-btn retry-btn" @click="handleRetry">
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";

const props = defineProps({
  gameState: { type: String, default: "ready" },
  distanceToGoal: { type: String, default: "0.0" },
  pizzaStatus: { type: String, default: "safe" },
  elapsedTime: { type: String, default: "0.00" },
  stageId: { type: String, default: "4" },
});

const emit = defineEmits(["retry", "nextLevel"]);

const isVisible = computed(() => {
  return (
    props.gameState === "ready" ||
    props.gameState === "playing" ||
    props.gameState === "success" ||
    props.gameState === "failed"
  );
});

const levelText = computed(() => {
  return props.stageId === "5" ? "Lv2" : "Lv1";
});

const pizzaStatusClass = computed(() => {
  return `status-${props.pizzaStatus}`;
});

const pizzaStatusText = computed(() => {
  const statusMap = {
    safe: "Safe",
    warning: "Warning",
    danger: "Danger!",
  };
  return statusMap[props.pizzaStatus] || "Unknown";
});

const topRecords = computed(() => {
  const storageKey = `pizza_leaderboard_stage${props.stageId}`;
  const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const topThree = records.slice(0, 3);

  while (topThree.length < 3) {
    topThree.push("--:--");
  }

  return topThree;
});

const getRankSuffix = (rank) => {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

const currentRank = computed(() => {
  if (props.gameState !== "success") return "-";

  const storageKey = `pizza_leaderboard_stage${props.stageId}`;
  const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const currentTime = parseFloat(props.elapsedTime);

  const rank =
    records.filter((time) => parseFloat(time) < currentTime).length + 1;
  return rank;
});

const handleRetry = () => {
  emit("retry");
};

const handleNext = () => {
  emit("nextLevel");
};

watch(
  () => props.gameState,
  (newState, oldState) => {
    if (newState === "success") {
      const time = parseFloat(props.elapsedTime);
      const storageKey = `pizza_leaderboard_stage${props.stageId}`;
      const records = JSON.parse(localStorage.getItem(storageKey) || "[]");

      records.push(props.elapsedTime);
      records.sort((a, b) => parseFloat(a) - parseFloat(b));

      localStorage.setItem(storageKey, JSON.stringify(records));
    }

    if (newState === "failed" && oldState === "playing") {
      setTimeout(() => {
        emit("retry");
      }, 2000);
    }
  }
);
</script>

<style scoped>
.game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
  font-family: system-ui, -apple-system, sans-serif;
  color: white;
}

.top-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.top-left {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
}

.level {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 4px;
}

.robot-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.top-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.mission-box {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkmark {
  font-size: 20px;
  color: #10b981;
}

.mission-text {
  font-size: 14px;
  font-weight: 500;
}

.top-right {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 12px;
}

.timer {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.bottom-bar {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.bottom-left {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: rgba(255, 255, 255, 0.7);
}

.value {
  font-weight: 600;
}

.status-safe {
  color: #10b981;
}

.status-warning {
  color: #f59e0b;
}

.status-danger {
  color: #ef4444;
}

.bottom-right {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
}

.leaderboard {
  min-width: 180px;
}

.leaderboard-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #fbbf24;
}

.leaderboard-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}

.rank {
  color: rgba(255, 255, 255, 0.7);
}

.time {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.view-more {
  margin-top: 8px;
  font-size: 12px;
  color: #60a5fa;
  cursor: pointer;
  pointer-events: auto;
}

.view-more:hover {
  color: #93c5fd;
}

.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  pointer-events: auto;
}

.result-screen {
  text-align: center;
  padding: 48px;
  border-radius: 24px;
  background: rgba(30, 30, 30, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-title {
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 48px 0;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.failed-title {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.failed-message {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 48px 0;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  margin-bottom: 48px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-value {
  font-size: 64px;
  font-weight: 800;
  color: white;
  font-variant-numeric: tabular-nums;
}

.pizza-icon {
  font-size: 80px;
  animation: bounce 1s ease infinite;
}

.result-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.result-btn {
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.retry-btn {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@media (max-width: 768px) {
  .top-bar,
  .bottom-bar {
    flex-direction: column;
    gap: 12px;
    left: 10px;
    right: 10px;
  }

  .top-center {
    padding: 0;
  }

  .timer {
    font-size: 24px;
  }

  .result {
    font-size: 18px;
    padding: 16px 32px;
  }
}
</style>
