<template>
  <aside :class="['sidebar-container', { 'is-collapsed': !isOpen }]">
    <div class="sidebar-header">
      <button
        class="toggle-btn"
        :title="isOpen ? '收起侧边栏' : '展开侧边栏'"
        :aria-label="isOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="$emit('toggle')"
      >
        <svg
          v-if="isOpen"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>

    <div v-if="isOpen" class="sidebar-content">
      <button class="new-chat-btn" @click="$emit('new-chat')">
        <span class="plus-icon">+</span>
        <span>新建对话</span>
      </button>

      <section class="history-section">
        <div class="section-title">历史记录</div>
        <div class="history-list-shell">
          <div v-if="history.length" class="list-items">
            <div
              v-for="item in history"
              :key="item.id"
              class="item"
              :class="{ 'is-active': item.id === activeId }"
            >
              <button
                type="button"
                class="item-main"
                @click="$emit('load-history', item)"
              >
                <span class="item-title">{{ item.title }}</span>
              </button>

              <button
                type="button"
                class="delete-btn"
                title="删除对话"
                aria-label="删除对话"
                @click.stop="$emit('delete-history', item)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="empty-text">还没有历史对话，先新建一个吧。</div>
        </div>
      </section>
    </div>

    <div v-if="isOpen" class="sidebar-footer-nav">
      <button type="button" class="footer-link" @click="router.push('/knowledge')">
        个人知识库
      </button>
      <button type="button" class="footer-link" @click="router.push('/templates')">
        模板库
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  isOpen: Boolean,
  history: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: [String, Number],
    default: '',
  },
})

defineEmits(['toggle', 'new-chat', 'load-history', 'delete-history'])

const router = useRouter()
</script>

<style scoped>
.sidebar-container {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #eef1f6;
  overflow: hidden;
  transition: width 0.25s ease;
}

.sidebar-container.is-collapsed {
  width: 56px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 14px;
  border-bottom: 1px solid #f1f3f8;
}

.sidebar-container.is-collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
}

.toggle-btn {
  border: none;
  background: #f5f7fb;
  color: #4b5b76;
  border-radius: 999px;
  width: 38px;
  height: 38px;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #eaf1ff;
  color: #1f4fd6;
}

.sidebar-content {
  flex: 1;
  min-height: 0;
  padding: 18px 12px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.new-chat-btn {
  position: relative;
  overflow: hidden;
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #1f4fd6, #1677ff);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 22px rgba(22, 119, 255, 0.18);
  transform: translateY(0) scale(1);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.new-chat-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
  opacity: 0;
  transform: translateX(-22px);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(22, 119, 255, 0.24);
  filter: saturate(1.04);
}

.new-chat-btn:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.new-chat-btn:active {
  transform: translateY(1px) scale(0.985);
  box-shadow: 0 8px 16px rgba(22, 119, 255, 0.18);
}

.new-chat-btn > * {
  position: relative;
  z-index: 1;
}

.plus-icon {
  font-size: 18px;
  line-height: 1;
}

.history-section {
  flex: 1;
  min-height: 0;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 10px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #8a94a6;
  letter-spacing: 0.04em;
}

.history-list-shell {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.history-list-shell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), #fff);
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  overflow-y: auto;
  padding: 0 2px 28px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 154, 180, 0.45) transparent;
}

.list-items::-webkit-scrollbar {
  width: 6px;
}

.list-items::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(139, 154, 180, 0.45);
}

.item {
  position: relative;
}

.item-main {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 40px 10px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.item:hover .item-main {
  background: #f3f5f8;
}

.item.is-active .item-main {
  background: #eceff4;
}

.item-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.delete-btn {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #9aa4b5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease;
}

.item:hover .delete-btn,
.item.is-active .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fff1f1;
  color: #d74c4c;
}

.empty-text {
  margin: 0 6px;
  padding: 14px 12px;
  border-radius: 12px;
  background: #fafbfd;
  color: #7a889d;
  font-size: 12px;
  line-height: 1.6;
}

.sidebar-footer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid #f1f3f8;
  background: #fff;
}

.footer-link {
  display: block;
  box-sizing: border-box;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 12px 10px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.footer-link + .footer-link {
  margin-top: 2px;
}

.footer-link:hover {
  background: #f3f5f8;
}
</style>
