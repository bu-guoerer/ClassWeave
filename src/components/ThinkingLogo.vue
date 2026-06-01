<template>
  <div class="thinking-wrapper" :class="{ 'is-thinking': isThinking, 'is-finished': !isThinking }">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="40 40 320 270"
      class="weave-logo"
    >
      <defs>
        <linearGradient id="blueGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#193a70" />
          <stop offset="50%" stop-color="#2c62a3" />
          <stop offset="100%" stop-color="#85B3E0" />
        </linearGradient>
      </defs>

      <!-- 书本外轮廓（4条线，无延迟，同时绘制） -->
      <g
        class="book-outlines"
        fill="none"
        stroke="url(#blueGradient)"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          class="draw-outline"
          stroke-width="8"
          d="M 105 105 Q 98 100 84 102 L 82 240 Q 142 270 202 273"
          pathLength="100"
        />
        <path
          class="draw-outline"
          stroke-width="6"
          d="M 202 124 Q 150 65 105 76 L 105 222 Q 150 250 202 255"
          pathLength="100"
        />
        <path
          class="draw-outline"
          stroke-width="8"
          d="M 304 106 Q 315 98 323 96 L 322 237 Q 262 270 202 273"
          pathLength="100"
        />
        <path
          class="draw-outline"
          stroke-width="6"
          d="M 202 124 Q 250 65 302 81 L 302 222 Q 250 250 202 255"
          pathLength="100"
        />
      </g>

      <!-- 内部交织线条（含斜线 + 垂直线，各自有延迟） -->
      <g
        class="weave-network"
        fill="none"
        stroke="url(#blueGradient)"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path class="weave-line line-1" d="M 141 117 L 254 215" pathLength="100" />
        <path class="weave-line line-2" d="M 202 124 L 277 187" pathLength="100" />
        <path class="weave-line line-3" d="M 129 150 L 220 239" pathLength="100" />
        <path class="weave-line line-4" d="M 202 124 L 129 190" pathLength="100" />
        <path class="weave-line line-5" d="M 266 120 L 157 223" pathLength="100" />
        <path class="weave-line line-6" d="M 278 162 L 187 242" pathLength="100" />
        <!-- 垂直辅助线（更粗） -->
        <path
          class="weave-line line-7 vertical-line"
          d="M 139 119 L 139 217"
          pathLength="100"
           stroke-width="6"
        />
        <path
          class="weave-line line-8 vertical-line"
          d="M 183 149 L 183 237"
          pathLength="100"
           stroke-width="6"
        />
        <path
          class="weave-line line-9 vertical-line"
          d="M 227 146 L 227 199"
          pathLength="100"
           stroke-width="6"
        />
        <path
          class="weave-line line-10 vertical-line"
          d="M 263 116 L 263 215"
          pathLength="100"
           stroke-width="6"
        />
      </g>

      <!-- 节点圆点（依次弹出） -->
      <g fill="url(#blueGradient)" class="weave-nodes">
        <circle
          class="node node-1"
          cx="141"
          cy="117"
          r="7"
          style="transform-origin: 141px 117px"
        />
        <circle
          class="node node-2"
          cx="178"
          cy="149"
          r="7"
          style="transform-origin: 178px 149px"
        />
        <circle
          class="node node-3"
          cx="267"
          cy="119"
          r="7"
          style="transform-origin: 267px 119px"
        />
        <circle
          class="node node-4"
          cx="229"
          cy="149"
          r="7"
          style="transform-origin: 229px 149px"
        />
        <circle
          class="node node-5"
          cx="181"
          cy="200"
          r="7"
          style="transform-origin: 181px 200px"
        />
        <circle
          class="node node-6"
          cx="232"
          cy="198"
          r="7"
          style="transform-origin: 232px 198px"
        />
      </g>
    </svg>
    <div v-if="isThinking" class="thinking-text">思考中<span class="dot-ani">...</span></div>
  </div>
</template>

<script setup>
// 保留 isThinking prop 以避免调用处报错，但动画不再依赖此状态（完全按 1.html 风格）
defineProps({
  isThinking: Boolean,
})
</script>

<style scoped>
.thinking-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.weave-logo {
  width: 32px;
  height: auto;
}

/* 基础状态：所有线条默认隐藏 */
.draw-outline,
.weave-line {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

/* ================== 状态 1：思考中 (无限循环呼吸) ================== */
/* 思考时，所有线条执行循环动画 */
.is-thinking .draw-outline,
.is-thinking .weave-line {
  animation: thinkingLoop 2s infinite ease-in-out;
}

/* 给不同线条一点交错感，让呼吸更自然 */
.is-thinking .draw-outline { animation-delay: 0s; }
.is-thinking .weave-line { animation-delay: 0.5s; }
.is-thinking .node { opacity: 0; } /* 思考时隐藏节点 */

@keyframes thinkingLoop {
  0% { stroke-dashoffset: 100; opacity: 0.3; }
  50% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -100; opacity: 0.3; }
}

/* ================== 状态 2：思考完毕 (完美还原 1.html) ================== */
.is-finished .draw-outline {
  animation: drawLine 1.5s ease-in-out forwards;
}

.is-finished .weave-line {
  animation: drawLine 1.2s ease-out forwards;
}

/* 严格按 1.html 还原延迟时间 */
.is-finished .line-1 { animation-delay: 1.0s; }
.is-finished .line-2 { animation-delay: 1.1s; }
.is-finished .line-3 { animation-delay: 1.2s; }
.is-finished .line-4 { animation-delay: 1.3s; }
.is-finished .line-5 { animation-delay: 1.4s; }
.is-finished .line-6 { animation-delay: 1.5s; }
.is-finished .line-7 { animation-delay: 1.6s; }
.is-finished .line-8 { animation-delay: 1.7s; }
.is-finished .line-9 { animation-delay: 1.8s; }
.is-finished .line-10 { animation-delay: 1.9s; }

/* 垂直线加粗 */
.is-finished .vertical-line {
  stroke-width: 6px !important;
  stroke: #2c62a3 !important;
  animation-delay: 2.0s !important;
}

/* 节点动画 */
.is-finished .node {
  opacity: 0;
  transform: scale(0);
  animation: popNode 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.is-finished .node-1, .is-finished .node-2 { animation-delay: 1.5s; }
.is-finished .node-3, .is-finished .node-4 { animation-delay: 1.7s; }
.is-finished .node-5, .is-finished .node-6 { animation-delay: 1.9s; }

/* 动画关键帧 */
@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

@keyframes popNode {
  0% { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}

/* 思考中文字的动画 */
.thinking-text {
  font-size: 14px;
  color: #2c62a3;
  font-weight: 500;
}
.dot-ani {
  display: inline-block;
  width: 1.5em;
  text-align: left;
  animation: dots 1.5s infinite steps(4);
}
@keyframes dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}
</style>