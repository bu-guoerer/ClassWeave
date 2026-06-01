<template>
  <div class="template-page">
    <!-- 顶部导航和分类 Tab -->
    <header class="tpl-header">
      <div class="header-top">
        <button class="back-btn" @click="goBack">◀ 返回工作台</button>
      </div>
      <div class="tab-list">
        <div 
          v-for="tab in tabs" 
          :key="tab"
          :class="['tab-item', { active: currentTab === tab }]"
          @click="currentTab = tab"
        >
          {{ tab }}
        </div>
        <div class="tab-divider"></div>
        <div class="tab-item my-tpl">
          <span>🔔 我的模板</span>
        </div>
      </div>
    </header>

    <!-- 模板网格内容区 -->
    <div class="tpl-content">
      <div class="tpl-grid">
        
        <!-- 特殊卡片 1：上传 PPTX -->
        <div class="tpl-card special-card" @click="openTemplateFilePicker">
          <input
            ref="templateFileInputRef"
            class="template-upload-input"
            type="file"
            accept=".ppt,.pptx"
            multiple
            @change="handleFakeTemplateUpload"
          >
          <div class="special-cover">
            <div class="icon-circle ppt-icon">P</div>
          </div>
          <div class="special-title">上传 PPTX 文件作为模板</div>
        </div>

        <!-- 真实模板卡片 -->
        <div class="tpl-card" v-for="tpl in filteredTemplates" :key="tpl.id">
          <div class="tpl-cover-wrapper" @click="previewTemplate(tpl)">
            <!-- 模板封面图 -->
            <div :class="['tpl-cover', `tpl-cover--${tpl.coverStyle}`]" :aria-label="tpl.title">
              <span v-if="tpl.badge" class="cover-badge">{{ tpl.badge }}</span>
              <div :class="['cover-copy', { 'has-badge': tpl.badge }]">
                <span class="cover-eyebrow">{{ tpl.eyebrow }}</span>
                <strong>{{ tpl.coverTitle }}</strong>
                <small>{{ tpl.coverDesc }}</small>
              </div>
              <span v-if="tpl.pageNo" class="cover-page">{{ tpl.pageNo }}</span>
            </div>
            
            <!-- 悬浮遮罩层 (Hover Mask) -->
            <div class="hover-mask">
              <button class="preview-template-btn" @click.stop="previewTemplate(tpl)">
                预览模板
              </button>
            </div>
          </div>
          
          <!-- 模板信息 -->
          <div class="tpl-info">
            <h4 class="tpl-title">{{ tpl.title }}</h4>
            <div class="tpl-meta">
              <span class="tpl-tag">Slides</span>
              <span class="tpl-uses">{{ tpl.uses }} 次使用</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="previewingTemplate" class="template-modal-mask" @click.self="closeTemplatePreview">
      <section class="template-modal" role="dialog" aria-modal="true" aria-label="模板预览">
        <button class="modal-close-btn" type="button" aria-label="关闭" @click="closeTemplatePreview">
          ×
        </button>
        <div class="template-modal-preview">
          <div
            :class="['tpl-cover', `tpl-cover--${previewingTemplate.coverStyle}`]"
            :aria-label="previewingTemplate.title"
          >
            <span v-if="previewingTemplate.badge" class="cover-badge">
              {{ previewingTemplate.badge }}
            </span>
            <div :class="['cover-copy', { 'has-badge': previewingTemplate.badge }]">
              <span class="cover-eyebrow">{{ previewingTemplate.eyebrow }}</span>
              <strong>{{ previewingTemplate.coverTitle }}</strong>
              <small>{{ previewingTemplate.coverDesc }}</small>
            </div>
            <span v-if="previewingTemplate.pageNo" class="cover-page">
              {{ previewingTemplate.pageNo }}
            </span>
          </div>
        </div>
        <div class="template-modal-body">
          <div>
            <span class="modal-kicker">模板预览</span>
            <h3>{{ previewingTemplate.title }}</h3>
            <p>{{ previewingTemplate.coverDesc }}</p>
          </div>
          <div class="modal-meta">
            <span>Slides</span>
            <strong>{{ previewingTemplate.uses }} 次使用</strong>
          </div>
        </div>
        <div class="template-modal-actions">
          <button class="modal-secondary-btn" type="button" @click="closeTemplatePreview">
            取消
          </button>
          <button class="modal-primary-btn" type="button" @click="selectTemplateAndReturn(previewingTemplate)">
            选定并返回
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/chat')
}

const tabs = ['全部模板', '简约风', '学术风', '科技风', '商务风', '清新风', '创意风', '活力风']
const currentTab = ref('全部模板')
const previewingTemplate = ref(null)
const templateFileInputRef = ref(null)

const templates = ref([
  {
    id: 1,
    title: '自由风格',
    category: '简约风',
    uses: 996,
    coverStyle: 'free',
    eyebrow: '通用',
    coverTitle: '自由风格',
    coverDesc: '简洁柔和的通用演示',
    badge: '',
    pageNo: ''
  },
  {
    id: 2,
    title: '蔚蓝冲击',
    category: '科技风',
    uses: '2.3w',
    coverStyle: 'blue',
    eyebrow: '2027 AI',
    coverTitle: '智能穿戴\n新品发布',
    coverDesc: '科技发布 / 商业路演',
    badge: '',
    pageNo: ''
  },
  {
    id: 3,
    title: '铅灰未来',
    category: '科技风',
    uses: '4,025',
    coverStyle: 'dark',
    eyebrow: 'AI TECH',
    coverTitle: '人工智能\n前沿技术',
    coverDesc: '趋势研究 / 技术分享',
    badge: '',
    pageNo: ''
  },
  {
    id: 4,
    title: '清风水蓝',
    category: '清新风',
    uses: '3,542',
    coverStyle: 'aqua',
    eyebrow: 'HEALTH SCIENCE',
    coverTitle: '健康科学\n专题讲座',
    coverDesc: '教育培训 / 科普课程',
    badge: '',
    pageNo: ''
  },
  {
    id: 5,
    title: '墨翠锋线',
    category: '活力风',
    uses: '1,286',
    coverStyle: 'mint',
    eyebrow: '',
    coverTitle: '新员工\n入职指南',
    coverDesc: '组织培训 / 制度宣讲',
    badge: '',
    pageNo: ''
  },
  {
    id: 6,
    title: '秒尝律动',
    category: '学术风',
    uses: '8,742',
    coverStyle: 'soft',
    eyebrow: 'WORLD HISTORY',
    coverTitle: '世界茶叶\n历史与文化',
    coverDesc: '人文课程 / 主题讲授',
    badge: '',
    pageNo: ''
  },
  {
    id: 7,
    title: '科研极简',
    category: '学术风',
    uses: '5,618',
    coverStyle: 'paper',
    eyebrow: 'RESEARCH',
    coverTitle: '学术研究\n开题汇报',
    coverDesc: '论文答辩 / 研究计划',
    badge: '',
    pageNo: '02'
  },
  {
    id: 8,
    title: '商业洞察',
    category: '商务风',
    uses: '6,901',
    coverStyle: 'coral',
    eyebrow: 'BUSINESS',
    coverTitle: '季度增长\n复盘报告',
    coverDesc: '数据洞察 / 运营汇报',
    badge: '',
    pageNo: ''
  },
  {
    id: 9,
    title: '战略规划',
    category: '商务风',
    uses: '2,097',
    coverStyle: 'navy',
    eyebrow: 'STRATEGY',
    coverTitle: '年度市场\n推广方案',
    coverDesc: '品牌策略 / 渠道规划',
    badge: '',
    pageNo: '03'
  },
  {
    id: 10,
    title: '产品蓝图',
    category: '创意风',
    uses: '1,742',
    coverStyle: 'violet',
    eyebrow: 'PRODUCT',
    coverTitle: '产品需求\n调研分析',
    coverDesc: '用户研究 / 竞品拆解',
    badge: '',
    pageNo: ''
  },
  {
    id: 11,
    title: '职场跃迁',
    category: '活力风',
    uses: '3,208',
    coverStyle: 'sun',
    eyebrow: 'CAREER',
    coverTitle: '个人成长\n述职汇报',
    coverDesc: '职业规划 / 能力展示',
    badge: '',
    pageNo: '04'
  },
  {
    id: 12,
    title: '几何灵感',
    category: '创意风',
    uses: '9,164',
    coverStyle: 'grid',
    eyebrow: 'DESIGN',
    coverTitle: '创意视觉\n灵感手册',
    coverDesc: '设计提案 / 作品展示',
    badge: '',
    pageNo: ''
  }
])

// 根据顶部 Tab 过滤
const filteredTemplates = computed(() => {
  if (currentTab.value === '全部模板') return templates.value
  return templates.value.filter(t => t.category === currentTab.value)
})

const formatTemplateFileSize = (bytes = 0) => {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

const getTemplateTitleFromFileName = (name = '') =>
  String(name).replace(/\.(pptx?|PPTX?)$/, '') || '上传模板'

const openTemplateFilePicker = () => {
  templateFileInputRef.value?.click()
}

const handleFakeTemplateUpload = (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  const uploadedTemplates = files.map((file, index) => {
    const title = getTemplateTitleFromFileName(file.name)
    return {
      id: `uploaded-${Date.now()}-${index}`,
      title,
      category: '简约风',
      uses: '本地',
      coverStyle: 'uploaded',
      eyebrow: 'UPLOADED PPTX',
      coverTitle: title,
      coverDesc: `本地上传 / ${formatTemplateFileSize(file.size)}`,
      badge: '',
      pageNo: '',
    }
  })
  templates.value = [...uploadedTemplates, ...templates.value]
  event.target.value = ''
}

// 点击预览模板
const previewTemplate = (tpl) => {
  previewingTemplate.value = tpl
}

const closeTemplatePreview = () => {
  previewingTemplate.value = null
}

const selectTemplateAndReturn = (tpl) => {
  if (!tpl) return
  router.push({ path: '/chat', query: { templateId: tpl.id, templateName: tpl.title } })
}
</script>

<style scoped>
.template-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

/* 顶部导航与 Tab */
.tpl-header {
  background: #fff;
  padding: 16px 40px 0;
  border-bottom: 1px solid #eaeaea;
}

.header-top {
  margin-bottom: 16px;
}

.back-btn {
  background: none; border: none; font-size: 14px; color: #666; cursor: pointer;
}
.back-btn:hover { color: #1677ff; }

.tab-list {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
}

.tab-item {
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tab-item.active {
  color: #333;
  font-weight: 600;
}

.tab-item.active::after {
  content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px;
  background-color: #333;
}

.tab-divider {
  width: 1px; height: 16px; background-color: #ddd; margin: 0 8px;
}

.my-tpl {
  color: #666;
}

/* 内容区与网格 */
.tpl-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}

.tpl-grid {
  display: grid;
  /* 响应式列，和你的截图类似，每行大致 3-4 个 */
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* 统一卡片样式 */
.tpl-card {
  cursor: pointer;
}

/* 1. 特殊卡片 (上传/新建) */
.special-card {
  display: flex; flex-direction: column;
}
.special-cover {
  height: 180px;
  background-color: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
}
.special-card:hover .special-cover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.icon-circle {
  width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: bold;
}
.ppt-icon { background: #ffe8e6; color: #ff4d4f; }
.add-icon { background: #e6f0ff; color: #1677ff; }
.special-title { font-size: 15px; color: #333; text-align: left; }

.template-upload-input {
  display: none;
}

/* 2. 真实模板卡片 & 悬浮遮罩 (核心功能) */
.tpl-cover-wrapper {
  position: relative;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #eaeaea;
}

.tpl-cover {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 24px 28px;
  transition: transform 0.3s;
}

.tpl-card:hover .tpl-cover {
  transform: scale(1.05); /* 鼠标移入图片微放大 */
}

.cover-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.cover-copy.has-badge {
  justify-content: flex-start;
  padding-top: 34px;
}

.cover-copy.has-badge .cover-eyebrow {
  min-height: 26px;
  margin-left: 52px;
  margin-bottom: 12px;
  line-height: 26px;
}

.cover-copy strong {
  white-space: pre-line;
  font-size: 28px;
  line-height: 1.18;
  letter-spacing: 0;
}

.cover-copy small {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.74;
}

.cover-eyebrow {
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  opacity: 0.72;
}

.cover-page {
  position: absolute;
  right: 24px;
  top: 18px;
  z-index: 1;
  font-size: 22px;
  font-weight: 700;
}

.cover-badge {
  position: absolute;
  left: 28px;
  top: 28px;
  z-index: 1;
  min-width: 38px;
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.tpl-cover--free {
  color: #4f4a45;
  background:
    radial-gradient(circle at 18% 28%, rgba(255, 188, 163, 0.72), transparent 30%),
    radial-gradient(circle at 86% 24%, rgba(204, 224, 255, 0.9), transparent 28%),
    linear-gradient(135deg, #efe2d9 0%, #d7d5d1 48%, #a19a91 100%);
}

.tpl-cover--blue {
  color: #fff;
  background:
    radial-gradient(circle at 90% 70%, rgba(12, 25, 94, 0.55), transparent 20%),
    linear-gradient(135deg, #2b55ff 0%, #4168ff 55%, #3156e8 100%);
}

.tpl-cover--blue::after {
  content: '';
  position: absolute;
  right: 24px;
  bottom: 28px;
  width: 26px;
  height: 26px;
  background: #0c1b5f;
  transform: rotate(45deg);
}

.tpl-cover--dark {
  color: #f8fbff;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 38%),
    linear-gradient(135deg, #242424 0%, #171717 100%);
}

.tpl-cover--dark .cover-copy strong {
  color: #c8f0ff;
}

.tpl-cover--dark::after {
  content: '';
  position: absolute;
  right: 24px;
  bottom: 22px;
  width: 84px;
  height: 1px;
  background: rgba(255, 255, 255, 0.42);
}

.tpl-cover--aqua {
  color: #27384f;
  background:
    radial-gradient(circle at 100% 0%, rgba(127, 214, 255, 0.7), transparent 32%),
    linear-gradient(135deg, #effaff 0%, #d9f0ff 55%, #c6e8fb 100%);
}

.tpl-cover--aqua::after {
  content: '';
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 34px;
  height: 2px;
  background: rgba(39, 56, 79, 0.16);
}

.tpl-cover--mint {
  color: #12392f;
  background:
    radial-gradient(circle at 82% 74%, rgba(143, 226, 195, 0.78), transparent 27%),
    linear-gradient(135deg, #f4fff8 0%, #dff7ed 58%, #c3eadb 100%);
}

.tpl-cover--mint .cover-badge {
  color: #fff;
  background: #18b47c;
}

.tpl-cover--mint::after {
  content: '';
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 26px;
  height: 1px;
  background: rgba(18, 57, 47, 0.2);
}

.tpl-cover--soft {
  color: #32404b;
  background:
    radial-gradient(circle at 18% 12%, rgba(209, 230, 232, 0.92), transparent 28%),
    radial-gradient(circle at 94% 92%, rgba(196, 218, 220, 0.86), transparent 31%),
    linear-gradient(135deg, #fbfaf4 0%, #eef4f2 100%);
}

.tpl-cover--paper {
  color: #1f2f3f;
  background:
    linear-gradient(90deg, rgba(80, 167, 138, 0.12) 1px, transparent 1px),
    linear-gradient(0deg, rgba(80, 167, 138, 0.12) 1px, transparent 1px),
    linear-gradient(135deg, #fffdf6 0%, #f4f1e8 100%);
  background-size: 22px 22px, 22px 22px, auto;
}

.tpl-cover--coral {
  color: #fff;
  background:
    radial-gradient(circle at 78% 30%, rgba(255, 217, 160, 0.46), transparent 24%),
    linear-gradient(135deg, #ff6b57 0%, #ff9d66 100%);
}

.tpl-cover--coral::after {
  content: '';
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 64px;
  height: 64px;
  border: 12px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
}

.tpl-cover--navy {
  color: #f5f8ff;
  background:
    linear-gradient(115deg, rgba(95, 158, 255, 0.28), transparent 40%),
    linear-gradient(135deg, #101828 0%, #243b68 100%);
}

.tpl-cover--navy::after {
  content: '';
  position: absolute;
  right: 26px;
  top: 28px;
  width: 92px;
  height: 54px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
}

.tpl-cover--violet {
  color: #221b4f;
  background:
    radial-gradient(circle at 15% 26%, rgba(255, 255, 255, 0.8), transparent 23%),
    linear-gradient(135deg, #eee8ff 0%, #cdbdff 50%, #9db5ff 100%);
}

.tpl-cover--violet::after {
  content: '';
  position: absolute;
  right: 26px;
  bottom: 26px;
  width: 24px;
  height: 24px;
  background: #6e55dd;
  border-radius: 8px;
}

.tpl-cover--sun {
  color: #3d2a10;
  background:
    radial-gradient(circle at 85% 22%, rgba(255, 255, 255, 0.75), transparent 23%),
    linear-gradient(135deg, #fff3ce 0%, #ffd36b 54%, #f3a634 100%);
}

.tpl-cover--grid {
  color: #20242e;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.38)),
    conic-gradient(from 45deg at 24% 26%, #ffcfdb, #c9defe, #d2f7e7, #ffcfdb);
}

.tpl-cover--grid::after {
  content: '';
  position: absolute;
  right: 22px;
  bottom: 20px;
  width: 76px;
  height: 76px;
  background:
    linear-gradient(90deg, rgba(32, 36, 46, 0.16) 1px, transparent 1px),
    linear-gradient(0deg, rgba(32, 36, 46, 0.16) 1px, transparent 1px);
  background-size: 14px 14px;
}

.tpl-cover--uploaded {
  color: #22304a;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 116, 116, 0.18), transparent 26%),
    linear-gradient(135deg, #fff7f4 0%, #f2f6ff 52%, #dce9ff 100%);
}

.tpl-cover--uploaded::after {
  content: 'P';
  position: absolute;
  right: 28px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #ff4d4f;
  color: #fff;
  font-size: 28px;
  font-weight: 800;
}

/* 遮罩层 UI */
.hover-mask {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.65); /* 半透明黑底 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s ease; /* 渐隐渐现动画 */
}

.tpl-cover-wrapper:hover .hover-mask {
  opacity: 1; /* 鼠标悬浮时显示 */
}

/* 遮罩层上的按钮 */
.preview-template-btn {
  min-width: 112px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #fff;
  color: #1f2d3d;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.preview-template-btn:hover {
  transform: translateY(-1px);
  background: #f6f8fb;
}

/* 模板信息文字 */
.tpl-title { margin: 0 0 6px 0; font-size: 15px; color: #333; }
.tpl-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #999; }
.tpl-tag { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; color: #666; }

.template-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.42);
  backdrop-filter: blur(6px);
}

.template-modal {
  position: relative;
  width: min(760px, 92vw);
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(17, 24, 39, 0.24);
}

.modal-close-btn {
  position: absolute;
  right: 16px;
  top: 14px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #2f3b4a;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.12);
}

.template-modal-preview {
  height: 290px;
  padding: 18px;
  background: #f5f7fb;
}

.template-modal-preview .tpl-cover {
  border-radius: 16px;
}

.template-modal-preview .cover-copy strong {
  font-size: 38px;
}

.template-modal-preview .cover-copy small {
  font-size: 14px;
}

.template-modal-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 26px 16px;
}

.modal-kicker {
  color: #1677ff;
  font-size: 13px;
  font-weight: 700;
}

.template-modal-body h3 {
  margin: 8px 0 8px;
  color: #1f2d3d;
  font-size: 24px;
  letter-spacing: 0;
}

.template-modal-body p {
  margin: 0;
  color: #6b778c;
  font-size: 14px;
}

.modal-meta {
  flex-shrink: 0;
  min-width: 128px;
  border-radius: 14px;
  background: #f7f9fc;
  padding: 12px 14px;
  color: #68768a;
  font-size: 13px;
}

.modal-meta span,
.modal-meta strong {
  display: block;
}

.modal-meta strong {
  margin-top: 5px;
  color: #1f2d3d;
  font-size: 15px;
}

.template-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 26px 24px;
}

.modal-secondary-btn,
.modal-primary-btn {
  min-width: 108px;
  height: 40px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.modal-secondary-btn {
  background: #f1f4f8;
  color: #4b5d73;
}

.modal-primary-btn {
  background: #1677ff;
  color: #fff;
  box-shadow: 0 10px 22px rgba(22, 119, 255, 0.22);
}
</style>
