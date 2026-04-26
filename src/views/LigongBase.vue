<template>
  <div class="knowledge-base-page">
    <!-- 顶部导航 -->
    <header class="kb-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回对话
        </button>
        <div class="title-wrapper">
          <h2 class="page-title">理工大学 AI & RL 核心文献库</h2>
          <span class="db-status">
            <span class="status-dot"></span> 数据库已连接 (共 {{ totalItems }} 篇文献)
          </span>
        </div>
      </div>
      <div class="header-right">
        <!-- 新增：隐藏的文件选择框 -->
        <input
          type="file"
          ref="fileInputRef"
          style="display: none"
          accept=".pdf,.doc,.docx,.txt"
          @change="handleFileImport"
        />

        <div class="search-box">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="#999"
            stroke-width="2"
            fill="none"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <!-- 新增：v-model="searchQuery" 双向绑定搜索词 -->
          <input type="text" v-model="searchQuery" placeholder="检索书名、作者或 分类..." />
        </div>
        <!-- 新增：@click="triggerImport" 触发文件上传 -->
        <button class="upload-btn" @click="triggerImport">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          导入文献
        </button>
      </div>
    </header>

    <!-- 文献列表主体 -->
    <div class="kb-content" ref="contentContainer">
      <div class="list-container">
        <!-- 列表表头 -->
        <div class="list-header">
          <div class="col-title">文献名称 (Title)</div>
          <div class="col-author">作者 / 来源 (Author/Source)</div>
          <div class="col-category">分类 (Category)</div>
          <div class="col-tags">领域标签 (Tags)</div>
          <div class="col-actions">操作</div>
        </div>

        <!-- 列表数据行 -->
        <div class="list-row" v-for="(item, index) in paginatedData" :key="index">
          <div class="col-title">
            <span class="type-icon" v-html="getIcon(item.type)"></span>
            <span class="item-name" :title="item.title">{{ item.title }}</span>
          </div>
          <div class="col-author" :title="item.author">{{ item.author }}</div>
          <div class="col-category">
            <span class="category-badge" :class="getCategoryClass(item.category)">
              {{ item.category }}
            </span>
          </div>
          <div class="col-tags">
            <span class="tag" v-for="tag in item.tags" :key="tag">{{ tag }}</span>
          </div>
          <div class="col-actions">
            <button class="action-btn read-btn" title="在线阅读">PDF</button>
            <button class="action-btn code-btn" title="代码/引用" v-if="item.type !== 'book'">
              { }
            </button>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div class="pagination">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
        <div class="page-numbers">
          <button
            v-for="page in displayPages"
            :key="page"
            :class="{ active: currentPage === page }"
            @click="typeof page === 'number' ? changePage(page) : null"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          下一页
        </button>
        <span class="page-info">共 {{ totalPages }} 页</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
const router = useRouter()
const goBack = () => {
  router.push('/chat')
}

// 核心硬核书单和论文数据（基础库）
const baseKnowledgeData = [
  // 机器学习基础
  {
    title: '机器学习 (西瓜书)',
    author: '周志华',
    category: '经典理论',
    type: 'book',
    tags: ['ML', '国内标配', '必修'],
  },
  {
    title: '统计学习方法 (第2版)',
    author: '李航',
    category: '经典理论',
    type: 'book',
    tags: ['极简硬核', '考研', '面试'],
  },
  {
    title: 'Pattern Recognition and Machine Learning (PRML)',
    author: 'Christopher M. Bishop',
    category: '经典理论',
    type: 'book',
    tags: ['偏数学', '研究生标配'],
  },
  {
    title: 'Machine Learning: A Probabilistic Perspective (MLAPP)',
    author: 'Kevin P. Murphy',
    category: '经典理论',
    type: 'book',
    tags: ['概率编程', '圣经', '深度拉满'],
  },

  // 强化学习核心
  {
    title: 'Reinforcement Learning: An Introduction (2nd Ed)',
    author: 'Richard S. Sutton & Andrew G. Barto',
    category: '经典理论',
    type: 'book',
    tags: ['RL第一圣经', 'C位'],
  },
  {
    title: '深度强化学习',
    author: '王树森、黎彧君、张志华',
    category: '经典理论',
    type: 'book',
    tags: ['DRL入门', '高校实验室'],
  },
  {
    title: 'Deep Reinforcement Learning Hands-On',
    author: 'Maxim Lapan',
    category: '工程实践',
    type: 'book',
    tags: ['理论+落地', 'PyTorch'],
  },
  {
    title: 'Algorithms for Reinforcement Learning',
    author: 'Csaba Szepesvári',
    category: '经典算法',
    type: 'book',
    tags: ['偏算法', '理论严谨'],
  },

  // 深度学习
  {
    title: '深度学习 (花书)',
    author: 'Ian Goodfellow / Yoshua Bengio',
    category: '经典理论',
    type: 'book',
    tags: ['全球标准', 'DL源头'],
  },
  {
    title: 'Dive into Deep Learning (D2L)',
    author: 'Aston Zhang, 李沐等',
    category: '开源框架',
    type: 'book',
    tags: ['动手学', '代码驱动'],
  },
  {
    title: '神经网络与深度学习',
    author: '邱锡鹏',
    category: '经典理论',
    type: 'book',
    tags: ['复旦教材', '体系完善'],
  },

  // 进阶理论与数学（硬核感来源）
  {
    title: 'Dynamic Programming and Optimal Control',
    author: 'Dimitri P. Bertsekas',
    category: '经典理论',
    type: 'book',
    tags: ['最优控制', 'RL源头'],
  },
  {
    title: 'Markov Decision Processes: Discrete Stochastic Dynamic Programming',
    author: 'Martin L. Puterman',
    category: '数学基础',
    type: 'book',
    tags: ['MDP天花板', '博士级别'],
  },
  {
    title: 'Convex Optimization',
    author: 'Stephen Boyd, Lieven Vandenberghe',
    category: '数学基础',
    type: 'book',
    tags: ['凸优化', '底层原理'],
  },
  {
    title: 'Numerical Optimization',
    author: 'Jorge Nocedal & Stephen J. Wright',
    category: '数学基础',
    type: 'book',
    tags: ['数值优化', '算法基石'],
  },
  {
    title: 'Linear Algebra and Its Applications',
    author: 'Gilbert Strang',
    category: '数学基础',
    type: 'book',
    tags: ['线性代数', 'MIT神课'],
  },

  // 工程落地
  {
    title: '强化学习实战：Python 入门',
    author: '刘建平',
    category: '工程实践',
    type: 'doc',
    tags: ['代码解析', '快速上手'],
  },
  {
    title: 'Hands-On Reinforcement Learning with Python',
    author: 'Sudharsan Ravichandiran',
    category: '工程实践',
    type: 'doc',
    tags: ['实战导向'],
  },
  {
    title: 'OpenAI SpinningUp 官方文档',
    author: 'OpenAI',
    category: '开源框架',
    type: 'doc',
    tags: ['核心算法', '源码剖析'],
  },
  {
    title: 'Stable Baselines3 / CleanRL / Tianshou Docs',
    author: 'Open Source Community',
    category: '开源框架',
    type: 'doc',
    tags: ['强化学习库', '工业级'],
  },

  // 经典论文（学术高度）
  {
    title: 'Human-level control through deep reinforcement learning (DQN)',
    author: 'Mnih et al. (Nature 2015)',
    category: '经典论文',
    type: 'paper',
    tags: ['RL+DL', '里程碑'],
  },
  {
    title: 'Proximal Policy Optimization Algorithms (PPO)',
    author: 'Schulman et al. (OpenAI 2017)',
    category: '经典算法',
    type: 'paper',
    tags: ['目前主流', 'ChatGPT基石'],
  },
  {
    title: 'Continuous control with deep reinforcement learning (DDPG)',
    author: 'Lillicrap et al. (ICLR 2016)',
    category: '经典算法',
    type: 'paper',
    tags: ['Actor-Critic', '连续动作'],
  },
  {
    title: 'Trust Region Policy Optimization (TRPO)',
    author: 'Schulman et al. (ICML 2015)',
    category: '经典算法',
    type: 'paper',
    tags: ['信赖域', '单调递增'],
  },
  {
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning (SAC)',
    author: 'Haarnoja et al. (ICML 2018)',
    category: '经典算法',
    type: 'paper',
    tags: ['最大熵', '样本效率'],
  },
  {
    title: 'Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)',
    author: 'Lowe et al. (NIPS 2017)',
    category: '经典论文',
    type: 'paper',
    tags: ['多智能体', 'MARL'],
  },
]

// 模拟无限循环的大型数据库 (生成约150条数据，满足10页以上的分页需求)
const generateLargeDatabase = () => {
  let largeData = []
  const loops = 6 // 26 * 6 = 156 条数据
  for (let i = 0; i < loops; i++) {
    const loopData = baseKnowledgeData.map((item, index) => ({
      ...item,
      // 稍微改动一点ID确保key唯一
      id: `${i}-${index}`,
    }))
    largeData = largeData.concat(loopData)
  }
  return largeData
}

const allData = ref(generateLargeDatabase())

// 分页逻辑
const searchQuery = ref('')
const filteredData = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allData.value
  
  return allData.value.filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.author.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query) ||
    item.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 当用户输入搜索词时，自动把页码切回第一页
watch(searchQuery, () => {
  currentPage.value = 1
})

// 3. 动态计算分页参数（基于过滤后的数据 filteredData）
const currentPage = ref(1)
const pageSize = 12
const totalItems = computed(() => filteredData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize) || 1)
const contentContainer = ref(null)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredData.value.slice(start, end)
})

// 4. 导入文献逻辑
const fileInputRef = ref(null)

const triggerImport = () => {
  fileInputRef.value?.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 模拟将上传的文件组装成一条文献记录
  const newDocument = {
    id: `upload-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ""), // 自动去掉文件后缀作为标题
    author: '本地上传',
    category: '工程实践',
    type: file.name.endsWith('.pdf') ? 'paper' : 'doc',
    tags: ['最新导入', '本地']
  }

  // 插入到总数据的最前面
  allData.value.unshift(newDocument)
  
  // 重置状态：清空搜索框、回到第一页，以便用户立刻看到新导入的文献
  searchQuery.value = ''
  currentPage.value = 1
  event.target.value = '' // 清空 input 防止重复传同名文件失效
  
  ElMessage.success(`成功导入文献：${file.name}`)
}

// 分页器显示的页码计算
const displayPages = computed(() => {
  const current = currentPage.value
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // 切换页面时回到顶部
    if (contentContainer.value) {
      contentContainer.value.scrollTop = 0
    }
  }
}

// 分类样式映射
const getCategoryClass = (category) => {
  const map = {
    经典理论: 'badge-theory',
    经典算法: 'badge-algorithm',
    数学基础: 'badge-math',
    工程实践: 'badge-engineering',
    开源框架: 'badge-framework',
    经典论文: 'badge-paper',
  }
  return map[category] || 'badge-default'
}

// SVG 图标映射
const getIcon = (type) => {
  if (type === 'book') {
    return `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#1677ff" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
  } else if (type === 'paper') {
    return `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#eb2f96" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  } else {
    return `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#52c41a" stroke-width="2" fill="none"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`
  }
}
</script>

<style scoped>
.knowledge-base-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; /* 更偏向学术界界面的冷灰底色 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

/* 顶部栏 */
.kb-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: #586069;
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #24292e;
  letter-spacing: 0.5px;
}

.db-status {
  font-size: 12px;
  color: #586069;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f8ff;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid #c8e1ff;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #28a745;
  border-radius: 50%;
  display: inline-block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  padding: 6px 12px;
  border-radius: 6px;
  width: 260px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #24292e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background-color: #444d56;
}

/* 列表容器 */
.kb-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.list-container {
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(27, 31, 35, 0.04);
  display: flex;
  flex-direction: column;
  min-width: 1000px; /* 防止过分挤压 */
}

/* CSS Grid 控制列宽 */
.list-header,
.list-row {
  display: grid;
  grid-template-columns: 3.5fr 2fr 1.5fr 2.5fr 1fr;
  align-items: center;
  padding: 0 20px;
}

.list-header {
  height: 48px;
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  font-size: 13px;
  font-weight: 600;
  color: #586069;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.list-row {
  height: 64px;
  border-bottom: 1px solid #eaecef;
  transition: background-color 0.15s ease;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background-color: #f1f8ff; /* 浅蓝色学术风悬浮 */
}

/* 列内容样式 */
.col-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #0366d6;
  font-size: 14px;
  padding-right: 16px;
}

.item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.item-name:hover {
  text-decoration: underline;
}

.type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-author {
  font-size: 13px;
  color: #24292e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 16px;
}

/* 分类徽章 */
.col-category {
  display: flex;
  align-items: center;
}

.category-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid transparent;
}

.badge-theory {
  background: #e6f7ff;
  color: #096dd9;
  border-color: #91d5ff;
}
.badge-algorithm {
  background: #fff0f6;
  color: #c41d7f;
  border-color: #ffadd2;
}
.badge-math {
  background: #f9f0ff;
  color: #531dab;
  border-color: #d3adf7;
}
.badge-engineering {
  background: #fcffe6;
  color: #389e0d;
  border-color: #e2f0a8;
}
.badge-framework {
  background: #e6ffed;
  color: #22863a;
  border-color: #8ed081;
}
.badge-paper {
  background: #fff1f0;
  color: #cf1322;
  border-color: #ffa39e;
}
.badge-default {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #d1d5db;
}

/* 标签列 */
.col-tags {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  padding-right: 16px;
}

.tag {
  background: #f1f2f6;
  color: #586069;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 操作按钮 */
.col-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 10px;
  transition: all 0.2s;
}

.read-btn {
  color: #d73a49;
  border-color: #d73a49;
}
.read-btn:hover {
  background: #d73a49;
  color: white;
}

.code-btn {
  color: #24292e;
  border-color: #e1e4e8;
  background: #fafbfc;
}
.code-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* 分页器 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 20px;
  gap: 16px;
}

.pagination button {
  background: #fff;
  border: 1px solid #e1e4e8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #24292e;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  border-color: #0366d6;
  color: #0366d6;
}

.pagination button:disabled {
  background: #f6f8fa;
  color: #959da5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-numbers button.active {
  background: #0366d6;
  color: white;
  border-color: #0366d6;
}

.page-info {
  font-size: 13px;
  color: #586069;
  margin-left: 8px;
}
</style>