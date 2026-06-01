<template>
  <div class="advantages">
    <div class="title">极速体验，专业操控</div>
    <div class="chart">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>功能</th>
              <th class="name">ClassWeave织课</th>
              <th>其他工具</th>
            </tr>
          </thead>
          <tbody>
            <!-- 第1行：AI生成与基础（有副标题） -->
            <tr>
              <td>AI生成与基础<br /><span class="desc">根据提示/文档生成</span></td>
              <td class="support">✅ 支持</td>
              <td class="unsupport">❌ 不支持</td>
            </tr>
            <!-- 第2行：AI布局建议（有副标题） -->
            <tr>
              <td>AI布局建议<br /><span class="desc">编辑与灵活性</span></td>
              <td class="support">✅ 支持</td>
              <td class="unsupport">❌ 不支持</td>
            </tr>
            <!-- 第3行：高级编辑工具（括号内整合） -->
            <tr>
              <td>高级编辑工具（形状、表格、对齐方式）</td>
              <td class="support">✅ 完整套件</td>
              <td class="unsupport">❌ 数量极少</td>
            </tr>
            <!-- 第4行：精细AI控制（括号内整合） -->
            <tr>
              <td>精细AI控制（更新单个元素）</td>
              <td class="support">✅ 精准</td>
              <td class="unsupport">❌ 不可预测</td>
            </tr>
            <!-- 第5行：全方位布局自由（括号内整合） -->
            <tr>
              <td>全方位布局自由（拖动、放置、调整大小）</td>
              <td class="support">✅ 支持</td>
              <td class="unsupport">❌ 不支持</td>
            </tr>
            <!-- 第6行：完全可编辑的原生图表 -->
            <tr>
              <td>完全可编辑的原生图表</td>
              <td class="support">✅ 动态的</td>
              <td class="unsupport">❌ 静态图片</td>
            </tr>
            <!-- 第7行：集成数据分析流程 -->
            <tr>
              <td>集成数据分析流程</td>
              <td class="support">✅ 支持</td>
              <td class="unsupport">❌ 不支持</td>
            </tr>
            <!-- 第8行：严格遵循模板（括号内整合） -->
            <tr>
              <td>严格遵循模板（遵循上传的PPTX文件）</td>
              <td class="support">✅ 精确</td>
              <td class="unsupport">❌ 结果不佳</td>
            </tr>
            <!-- 第9行：完美导出PPTX（括号内整合） -->
            <tr>
              <td>完美导出PPTX（格式无损坏）</td>
              <td class="support">✅ 完美无瑕</td>
              <td class="unsupport">❌ 格式问题</td>
            </tr>
            <!-- 第10行：专业“原生PPT”外观 -->
            <tr>
              <td>专业“原生PPT”外观</td>
              <td class="support">✅ 支持</td>
              <td class="unsupport">❌ 通用“AI外观”</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="title">为何 ClassWeave织课 是史上最佳的 AI 幻灯片工具</div>

    <!-- 卡片区块：使用了 left/right 组件，并通过插槽传入自定义内容 -->
    <left>
      <template #video>
        <img src="" class="custom-video" alt="video placeholder" />
      </template>
      <template #title>
        <h3 class="custom-title">点击、输入并更改所有元素</h3>
      </template>
      <template #content>
        <p class="custom-content">
          AI 生成的幻灯片不应让你局限于固定布局。ClassWeave织课 让你可以像在 PowerPoint
          中一样编辑每个元素。你可以进行拖动、调整大小、替换视觉元素、调整网格等操作。
        </p>
      </template>
    </left>

    <right>
      <template #video>
        <img src="" class="custom-video" alt="video placeholder" />
      </template>
      <template #title>
        <h3 class="custom-title">以像素级精度导出到 PowerPoint</h3>
      </template>
      <template #content>
        <p class="custom-content">
          ClassWeave织课 不仅兼容
          PowerPoint，还能生成完美匹配的幻灯片。布局、间距、字体、图表和颜色都能得以保留。无需担心格式损坏或重新编辑，每次都能生成完美的
          PPT 文件。
        </p>
      </template>
    </right>

    <left>
      <template #video>
        <img src="" class="custom-video" alt="video placeholder" />
      </template>
      <template #title>
        <h3 class="custom-title">始终贴合品牌，始终模板完美</h3>
      </template>
      <template #content>
        <p class="custom-content">
          ClassWeave织课
          能精准贴合你的设计系统和演示模板。它采用一致的排版、对齐的网格和品牌配色方案。幻灯片就像手工制作的一样，即使在编辑后也始终与你的模板保持一致。
        </p>
      </template>
    </left>

    <right>
      <template #video>
        <img src="" class="custom-video" alt="video placeholder" />
      </template>
      <template #title>
        <h3 class="custom-title">可完全编辑的图表 —— 非图片形式</h3>
      </template>
      <template #content>
        <p class="custom-content">
          ClassWeave织课 可以生成真实且可编辑的 PPT
          图表。无需调整布局，即可更新数值、重新设置颜色和切换图表类型。数据始终精确，幻灯片保持简洁，编辑轻松不费力。
        </p>
      </template>
    </right>
  </div>
</template>

<script setup>
import left from '../Advantage/left.vue'
import right from '../Advantage/right.vue'
</script>

<style scoped>
.advantages {
  width: 100%;
  min-height: 100vh; /* 改为自适应高度 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 40px 5%; /* 左右留白 5% */
  text-align: center;
  gap: 3rem; /* 卡片之间间距加大 */
}

.advantages .title {
  margin: 0 auto;
  width: 100%;
  font-size: 48px;
  font-weight: 400; /* 适度加粗 */
  color: #1e293b; /* 深灰色 */
  text-align: center;
  letter-spacing: -0.02em;
}

/* 表格区域 */
.chart {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.table-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: auto;
}

/* 表格固定布局 + 列宽比例 4:1:1 */
table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  text-align: center;
}

/* 第一列宽度 60% */
th:first-child,
td:first-child {
  width: 60%;
  text-align: left;
}

/* 第二、三列宽度各 20% */
th:nth-child(2),
td:nth-child(2),
th:nth-child(3),
td:nth-child(3) {
  width: 20%;
}

/* 表头基础样式 */
th {
  background-color: #f8f9fc;
  font-weight: 600;
  font-size: 16px;
  padding: 16px 12px;
}

/* 第二列表头：纯绿背景、白字 */
.table-wrapper .name {
  color: white;
  background-color: rgb(70, 176, 121);
}

/* 第二列所有单元格（含表头）仅左右边框，无上下边框 */
tr > *:nth-child(2) {
  border-left: 2px solid rgb(70, 176, 121);
  border-right: 2px solid rgb(70, 176, 121);
  border-top: none;
  border-bottom: none;
}

/* 最后一行的第二列单元格添加下边框 */
tbody tr:last-child > td:nth-child(2) {
  border-bottom: 2px solid rgb(70, 176, 121);
}

/* 单元格基础样式 */
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

/* 第二列正文背景色：半透明浅绿 */
tbody tr > td:nth-child(2) {
  background-color: rgba(144, 238, 144, 0.3);
  border-left: 2px solid rgb(70, 176, 121);
  border-right: 2px solid rgb(70, 176, 121);
  border-top: none;
  border-bottom: none;
}

/* 最后一行的第二列单元格重新强调下边框 */
tbody tr:last-child > td:nth-child(2) {
  border-bottom: 2px solid rgb(70, 176, 121) !important;
}

/* 描述文字（仅用于前两行的小字） */
.desc {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
  font-weight: normal;
  text-align: left;
}

.support {
  color: #2e7d32;
  font-weight: 500;
}

.unsupport {
  color: #c62828;
  font-weight: 500;
}

/* 悬停效果 */
tbody tr:hover {
  background-color: #f9fafc;
}

/* 首列文字强调 */
td:first-child {
  font-weight: 500;
  color: #1e293b;
}

/* 自定义插槽样式 */
.custom-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #8b5cf6, #c084fc, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.2;
  max-width: 600px;
  width: 100%;
}

.custom-content {
  color: #4b5563;
  line-height: 1.625;
  font-size: 1.125rem;
  margin: 0 0 1rem 0;
  max-width: 600px;
  width: 100%;
}

.custom-video {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: block;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .advantages .title {
    font-size: 36px;
  }

  th,
  td {
    padding: 10px 8px;
    font-size: 12px;
  }
}
</style>
