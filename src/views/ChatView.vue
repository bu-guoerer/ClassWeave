<template>
  <div ref="layoutRef" class="chat-app-layout">
    <SideBar
      :is-open="sidebarOpen"
      :history="historyList"
      :active-id="activeConversationId"
      @toggle="sidebarOpen = !sidebarOpen"
      @new-chat="startNewChat"
      @load-history="handleLoadHistory"
      @delete-history="deleteConversation"
      @pin-history="handlePinHistory"
      @rename-history="handleRenameHistory"
      @mention="handleMention"
      @preview-doc="handlePreviewDoc"
      @quote-lesson="handleQuoteLesson"
      @start-course-design="handleStartCourseDesign"
      @delete-course-design="handleDeleteCourseDesign"
    />

    <div :class="['chat-main-area', { 'is-welcome': isWelcomeMode }]">
      <div v-show="!isWelcomeMode" ref="chatListRef" class="chat-messages" @scroll="handleChatScroll">
        <div
          v-for="(msg, index) in messages"
          :key="`${msg.type}-${index}`"
          :class="['message', msg.role === 'user' ? 'message-user' : 'message-ai']"
        >
          <div class="message-wrapper">
            <div v-if="msg.role === 'user'" class="user-content-wrapper">
              <div v-if="msg.quotedLesson" class="sent-quote-card">
                <i class="iconfont quote-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                </i>
                <span>
                  正在基于 <b>{{ msg.quotedLesson.courseName }}</b> 生成：
                  <strong>{{ msg.quotedLesson.lessonTitle }}</strong>
                </span>
              </div>
              <div v-if="msg.attachments?.length" class="msg-attachments">
                <div
                  v-for="(att, attIndex) in msg.attachments"
                  :key="attIndex"
                  class="msg-attach-card"
                >
                  <i v-if="att.type === 'audio'" class="iconfont att-icon audio-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </i>
                  <i v-else class="iconfont icon-wendang att-icon file-icon"></i>
                  <div class="att-info">
                    <span class="att-name">{{ att.name }}</span>
                    <span class="att-size">{{
                      att.type === 'audio' ? '音频文件' : '参考文档'
                    }}</span>
                  </div>
                </div>
              </div>
              <div v-if="msg.content" class="text-content">{{ msg.content }}</div>
            </div>

            <ThinkingLogo v-if="msg.role === 'ai'" :is-thinking="msg.isThinking" />

            <div
              v-if="msg.role === 'ai' && (msg.isThinking || msg.thoughtText)"
              class="deep-thinking-container"
            >
              <!-- 头部控制栏 (点击展开/折叠) -->
              <div class="deep-thinking-header" @click="toggleThought(msg)">
                <div class="header-left">
                  <!-- 旋转的原子/思考图标 -->
                  <svg
                    class="thinking-spin-icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="10 4"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span class="header-title">{{ msg.isThinking ? '深度思考中' : '思考完成' }}</span>
                  <span class="header-stage">{{ msg.progressTitle || '正在整理生成任务' }}</span>
                  <span class="header-timer">（用时 {{ msg.elapsedLabel || '1 秒' }}）</span>
                </div>
                <!-- 展开/折叠箭头 -->
                <svg
                  class="header-chevron"
                  :class="{ 'is-collapsed': !msg.isThoughtExpanded }"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              <!-- 内容区：左侧灰线 + 灰色文字 (受 isThoughtExpanded 控制) -->
              <div
                class="deep-thinking-content"
                v-show="msg.isThoughtExpanded && (msg.thoughtText || msg.isThinking)"
              >
                <div class="typewriter-text">
                  <template v-if="msg.thoughtText">
                    {{ msg.thoughtText }}<span v-if="msg.isThinking" class="typing-cursor"></span>
                  </template>
                  <template v-else-if="msg.isThinking">
                    <span class="thinking-waiting-text">正在等待后端返回可展示的思考过程</span>
                    <span class="typing-cursor"></span>
                  </template>
                </div>
              </div>
            </div>
            <div
              v-if="msg.role === 'ai' && msg.type === 'text' && String(msg.content || '').trim()"
              class="content ai-text"
            >
              {{ msg.content }}
            </div>

            <div v-if="msg.type === 'clarification'" class="content form-card clarification-card">
              <div class="form-group">
                <div class="clarification-question">
                  <h4>还需要补充一点信息</h4>
                  <span v-if="msg.roundLabel" class="clarification-picked">{{ msg.roundLabel }}</span>
                </div>
                <div class="clarification-prompt">
                  {{ getClarificationDisplayPrompt(msg) }}
                </div>
              </div>

              <div class="clarification-footer">
                <div class="clarification-progress">
                  请在下方输入框回复。
                </div>
                <div v-if="msg.progressPercent != null" class="clarification-progress-bar" aria-hidden="true">
                  <span :style="{ width: `${msg.progressPercent}%` }"></span>
                </div>
              </div>
            </div>

            <div v-if="msg.type === 'outline-review'" class="content form-card outline-review-card">
              <div class="outline-review-head">
                <div>
                  <div class="outline-review-eyebrow">大纲预览</div>
                  <h4>课程结构已整理完成</h4>
                </div>
                <div class="outline-review-count">
                  {{ msg.slideCount || msg.slides?.length || 0 }} 页
                </div>
              </div>

              <div class="outline-summary-row">
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{
                    msg.slideCount || msg.slides?.length || 0
                  }}</span>
                  <span class="outline-summary-label">页面</span>
                </div>
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{ getOutlineBulletCount(msg) }}</span>
                  <span class="outline-summary-label">要点</span>
                </div>
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{
                    getVisibleOutlineSlides(msg).length
                  }}</span>
                  <span class="outline-summary-label">当前展示</span>
                </div>
              </div>

              <div v-if="msg.slides?.length" class="outline-grid">
                <article
                  v-for="slide in getVisibleOutlineSlides(msg)"
                  :key="slide.slideId"
                  class="outline-item"
                >
                  <div class="outline-item-head">
                    <span class="outline-page-badge">P{{ slide.index }}</span>
                    <span class="outline-point-count">{{ slide.bullets?.length || 0 }} 个要点</span>
                  </div>
                  <div class="outline-title">{{ slide.title || `第 ${slide.index} 页` }}</div>
                  <div v-if="slide.bullets?.length" class="outline-bullets">
                    <div
                      v-for="(bullet, bulletIndex) in getOutlinePreviewBullets(slide)"
                      :key="bulletIndex"
                      class="outline-bullet"
                    >
                      {{ bullet }}
                    </div>
                    <div v-if="getHiddenOutlineBulletCount(slide)" class="outline-more-bullets">
                      还有 {{ getHiddenOutlineBulletCount(slide) }} 个要点
                    </div>
                  </div>
                </article>
              </div>

              <div v-else class="outline-empty">暂时没有可展示的大纲内容</div>

              <div v-if="getHiddenOutlineSlideCount(msg)" class="outline-expand-row">
                <button
                  type="button"
                  class="outline-expand-btn"
                  @click="toggleOutlineExpanded(msg)"
                >
                  {{ msg.isOutlineExpanded ? '收起大纲' : `展开全部 ${msg.slides.length} 页` }}
                </button>
              </div>

              <div class="form-actions">
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="acceptOutline(msg)"
                >
                  {{ msg.isSubmitted ? '处理中...' : '接受大纲' }}
                </button>
              </div>
            </div>

            <div
              v-if="msg.type === 'file'"
              class="content file-card"
              @click="
                openPreview(msg.previewPayload || msg.fileUrl, {
                  sessionId: msg.sessionId,
                  taskId: msg.taskId,
                  fileName: msg.content,
                  previewType: msg.previewType,
                  fileUrl: msg.fileUrl,
                })
              "
            >
              <div :class="['file-cover', `file-cover--${msg.previewType || 'ppt'}`]">
                {{ msg.fileBadge || 'PPT' }}
              </div>
              <div class="file-info">
                <div class="file-name">{{ msg.content }}</div>
                <div class="file-desc">{{ msg.description || '点击查看预览' }}</div>
              </div>
            </div>

            <div v-if="msg.type === 'draft-actions'" class="content form-card">
              <div class="form-group">
                <h4>初版课件已就绪</h4>
                <div class="card-tip">
                  可以先预览当前初版。若想继续优化，直接在输入框输入修改意见；每次修改都会生成新的版本，之前的版本会继续保留并保持可预览。
                </div>
              </div>
              <div v-if="getDraftVersions(msg).length" class="draft-version-list">
                <div
                  v-for="version in getDraftVersions(msg)"
                  :key="version.key"
                  class="draft-version-item"
                >
                  <div class="draft-version-meta">
                    <div class="draft-version-title-row">
                      <span class="draft-version-title">{{ version.title }}</span>
                      <span v-if="version.isLatest" class="draft-version-badge">最新</span>
                    </div>
                    <div class="draft-version-desc">{{ version.description }}</div>
                  </div>
                  <div class="draft-action-row">
                    <button
                      class="secondary-btn"
                      @click="
                        openPreview(version.previewPayload || version.downloadUrl, {
                          sessionId: msg.sessionId,
                          taskId: version.taskId || msg.taskId,
                          fileName: version.fileName || 'initial-version.pptx',
                          fileUrl: version.downloadUrl,
                        })
                      "
                    >
                      预览
                    </button>
                    <button
                      class="secondary-btn"
                      :disabled="!version.downloadUrl"
                      @click="openExternalLink(version.downloadUrl)"
                    >
                      下载
                    </button>
                  </div>
                </div>
              </div>
              <div class="draft-action-row draft-action-row--footer">
                <button
                  class="secondary-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="generateAfterClassHomework(msg)"
                >
                  生成课后作业
                </button>
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="finalizeCurrentSession(msg)"
                >
                  {{ msg.isSubmitted ? '导出中...' : '导出最终结果' }}
                </button>
              </div>
            </div>

            <div v-if="msg.type === 'artifact-links'" class="content form-card">
              <div class="form-group">
                <h4>{{ msg.title || '最终产物' }}</h4>
                <div class="artifact-links">
                  <button
                    v-for="link in msg.links"
                    :key="link.label"
                    type="button"
                    class="artifact-link"
                    @click="downloadArtifactLink(link)"
                  >
                    {{ link.label }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="msg.type === 'digital-human-actions'" class="content form-card digital-human-card">
              <div class="form-group">
                <h4>数字人讲解</h4>
                <div class="card-tip">
                  当前课件已经准备好，可以继续生成数字人讲解。
                </div>
              </div>

              <div class="choice-row">
                <button
                  :class="['choice-btn', msg.choice === 'yes' ? 'is-active' : '']"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="selectDigitalHumanChoice(msg, 'yes')"
                >
                  需要数字人
                </button>
                <button
                  :class="['choice-btn', msg.choice === 'no' ? 'is-active is-muted' : 'is-muted']"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="selectDigitalHumanChoice(msg, 'no')"
                >
                  暂不需要
                </button>
              </div>

              <div v-if="msg.choice === 'yes'" class="card-tip card-tip--quiet">
                请在下方输入框补充讲解要求，也可以直接发送开始生成。
              </div>

              <div v-else-if="msg.choice === 'no'" class="card-tip card-tip--quiet">
                好的，当前先不生成数字人讲解。
              </div>
            </div>

            <div v-if="msg.suggestions?.length" class="suggestions-list">
              <div
                v-for="(suggestion, suggestionIndex) in msg.suggestions"
                :key="suggestionIndex"
                class="suggestion-item"
                @click="fillSuggestion(suggestion)"
              >
                <span class="sug-text">{{ suggestion }}</span>
                <span class="sug-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="welcome-fade">
        <div v-show="isWelcomeMode" class="welcome-brand-wrapper">
          <h1 class="welcome-brand">ClassWeave 织课</h1>
        </div>
      </Transition>

      <div :class="['chat-input-area', { 'is-welcome': isWelcomeMode }]">
        <div :class="['input-wrapper', { 'is-recording': isListening }]">
          <div class="quoted-box" v-if="quotedLessonData">
            <div class="quote-content">
              <i class="iconfont quote-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
              </i>
              <span class="quote-text">
                正在基于 <b>{{ quotedLessonData.courseName }}</b> 生成：
                <span style="color: #1677ff">{{ quotedLessonData.lessonTitle }}</span>
              </span>
            </div>
            <button class="close-quote-btn" @click="cancelQuote">×</button>
          </div>
          <div
            class="course-design-reopen-box"
            v-if="lastCourseDesignPanel && currentPreviewType !== 'course-design'"
          >
            <div class="quote-content">
              <i class="iconfont quote-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </i>
              <span class="quote-text">
                已保存 <b>{{ lastCourseDesignPanel.title }}</b>，可随时回到右侧查看或选择课时。
              </span>
            </div>
            <button class="reopen-panel-btn" type="button" @click="showCourseDesignPanel()">
              查看整门课程设计
            </button>
          </div>
          <div v-if="pendingAttachments.length" class="selected-attachments">
            <div
              v-for="(att, index) in pendingAttachments"
              :key="`${att.name}-${index}`"
              class="att-tag"
            >
              <i v-if="att.type === 'audio'" class="iconfont audio-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </i>
              <i v-else class="iconfont icon-wendang file-icon"></i>
              <span class="att-name">{{ att.name }}</span>
              <button class="remove-att" @click="removeAttachment(index)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            :placeholder="inputPlaceholder"
            @keydown.enter.prevent="handleSend"
          />

          <div class="input-toolbar">
            <div class="toolbar-left">
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,audio/*"
                style="display: none"
                @change="handleFileSelect"
              />
              <button
                :class="['tool-btn', { 'recording-active': isFileSelecting }]"
                @click="triggerFileInput"
              >
                <svg class="tool-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4a2 2 0 0 1 2-2h4.586a2 2 0 0 1 1.414.586l2.828 2.828A2 2 0 0 1 16 6.828V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 2v4a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="tool-btn__label">文件上传</span>
              </button>
              <button
                :class="['tool-btn', 'mic-btn', { 'recording-active': isListening }]"
                :disabled="isRecordingBusy"
                :aria-busy="isRecordingBusy ? 'true' : 'false'"
                :aria-pressed="isListening ? 'true' : 'false'"
                @click="toggleListening"
              >
                <svg class="tool-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3" />
                  <path d="M8.5 21h7" />
                </svg>
                <span v-if="!isListening" class="tool-btn__label">语音输入</span>
                <div v-if="isListening" class="mic-wave" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
            <button class="send-btn" :disabled="sendDisabled" @click="handleSend">发送</button>
          </div>
        </div>
      </div>

      <!-- 欢迎模式下的介绍信息 -->
      <Transition name="welcome-fade">
        <div v-show="isWelcomeMode" class="welcome-intro-area">
        <div class="intro-cards">
          <div class="intro-card" @click="fillSuggestion('帮我设计一门人工智能导论课程')">
            <div class="intro-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="intro-title">智能课程设计</div>
            <div class="intro-desc">输入课程主题，AI 自动规划教学大纲与课时安排</div>
          </div>
          <div class="intro-card" @click="fillSuggestion('根据这份PDF生成PPT')">
            <div class="intro-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="intro-title">资料上传生成</div>
            <div class="intro-desc">上传 PDF、音频等资料，AI 提炼内容生成课件</div>
          </div>
          <div class="intro-card" @click="fillSuggestion('帮我优化这节课的课件')">
            <div class="intro-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v10"/>
                <path d="M21 12h-6m-6 0H1"/>
                <path d="M19.07 4.93L14.83 9.17M9.17 14.83l-4.24 4.24"/>
                <path d="M19.07 19.07L14.83 14.83M9.17 9.17L4.93 4.93"/>
              </svg>
            </div>
            <div class="intro-title">课件智能优化</div>
            <div class="intro-desc">基于现有课件，AI 辅助优化内容与教学设计</div>
          </div>
        </div>
      </div>
      </Transition>
    </div>

    <template v-if="showPreviewRegion">
      <div
        class="preview-resizer"
        :class="{ 'is-dragging': isPreviewResizing }"
        title="拖动调整预览宽度"
        @mousedown.prevent="startPreviewResize"
      >
        <span class="preview-resizer__handle"></span>
      </div>

      <div
        v-if="currentPreviewType === 'course-design' && courseDesignPanel"
        class="preview-panel course-design-preview-panel"
        :style="previewPanelStyle"
      >
        <div class="course-design-panel">
          <div class="course-design-panel__head">
            <div>
              <span class="course-design-panel__eyebrow">整门课程设计</span>
              <h3>{{ courseDesignPanel.title }}</h3>
            </div>
            <button class="panel-close-btn" type="button" @click="closePreview">关闭</button>
          </div>

          <div class="course-design-panel__meta">
            <span>{{ courseDesignPanel.totalHours || courseDesignPanel.lessons.length }} 学时</span>
            <span>{{ courseDesignPanel.periodMinutes || 45 }} 分钟/学时</span>
            <span>{{ courseDesignPanel.targetAudience || '授课对象待定' }}</span>
          </div>

          <div v-if="courseDesignPanel.objectives?.length" class="course-design-objectives">
            <span v-for="objective in courseDesignPanel.objectives" :key="objective">
              {{ objective }}
            </span>
          </div>

          <div class="course-design-lessons">
            <article
              v-for="lesson in courseDesignPanel.lessons"
              :key="lesson.key"
              :class="['course-design-lesson', { 'is-active': selectedCourseDesignLessonKey === lesson.key }]"
              @click="selectCourseDesignLesson(lesson)"
            >
              <div class="course-design-lesson__head">
                <span>{{ lesson.hourIndex ? `第 ${lesson.hourIndex} 学时` : '课时' }}</span>
                <button type="button" @click.stop="useCourseDesignLesson(lesson)">做这一节</button>
              </div>
              <h4>{{ lesson.title }}</h4>
              <p v-if="lesson.unitTitle">{{ lesson.unitTitle }}</p>
              <div class="course-design-lesson__points">
                <span v-for="point in lesson.keyPoints.slice(0, 4)" :key="point">{{ point }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div v-else-if="currentPreviewConfig" class="preview-panel" :style="previewPanelStyle">
        <component
          :is="activePreviewComponent"
          :key="currentPreviewKey"
          :document-config="currentPreviewConfig"
          @close="closePreview"
        />
      </div>

      <div v-else class="preview-panel preview-panel--placeholder" :style="previewPanelStyle">
        <div class="preview-panel__status-card">
          <div class="preview-panel__status-title">
            {{ previewLoading ? '正在打开 PPT 预览' : 'PPT 预览暂时无法打开' }}
          </div>
          <div class="preview-panel__status-text">
            {{
              previewLoading
                ? '正在请求 ONLYOFFICE 预览配置，请稍候...'
                : previewError || '预览配置获取失败，请稍后重试。'
            }}
          </div>
          <div class="preview-panel__status-actions">
            <button v-if="previewError" class="secondary-btn" @click="closePreview">关闭</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SideBar from '@/components/SideBar.vue'
import ThinkingLogo from '@/components/ThinkingLogo.vue'
import PptPreview from '@/components/PptPreview.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { readCourseDesignLesson, upsertCourseDesignPlan } from '@/utils/courseDesignStore'
import {
  appendPptSessionAssetsApi,
  createCourseDesignSessionApi,
  createPptDigitalHumanApi,
  createPptSessionApi,
  fetchCourseDesignArtifactsApi,
  fetchCourseDesignPlanApi,
  fetchCourseDesignProgressStreamApi,
  fetchCourseDesignSessionApi,
  fetchAfterClassHomeworkApi,
  fetchPptArtifactsApi,
  fetchPptDigitalHumanApi,
  fetchPptDraftApi,
  fetchPptOutlineApi,
  fetchPptProgressStreamApi,
  fetchPptRevisionsApi,
  fetchPptSessionApi,
  finalizePptApi,
  generateAfterClassHomeworkApi,
  refreshCourseDesignProgressStreamApi,
  refreshPptProgressStreamApi,
  reviewCourseDesignPlanApi,
  reviewPptOutlineApi,
  revisePptDraftApi,
  submitCourseDesignClarificationsApi,
  submitCourseDesignNaturalLanguageClarificationApi,
  submitPptClarificationsApi,
  submitPptNaturalLanguageClarificationApi,
  uploadPptAttachmentApi,
} from '@/api/ppt'

const router = useRouter()
const route = useRoute()

const POLL_INTERVAL_MS = 1500
const POLL_MAX_TIMES = 180
const DIGITAL_HUMAN_POLL_INTERVAL_MS = 5000
const DIGITAL_HUMAN_POLL_MAX_TIMES = 240
const PREVIEW_BUCKET = 'ppt-files'
const STORAGE_KEY = 'classweave-ppt-chat-history-v2'
const OUTLINE_COLLAPSED_SLIDE_COUNT = 4
const OUTLINE_PREVIEW_BULLET_COUNT = 3
const MIN_PREVIEW_WIDTH = 420
const DEFAULT_PREVIEW_WIDTH = 720
const MIN_CHAT_MAIN_WIDTH = 560
const SIDEBAR_EXPANDED_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 56
const DIGITAL_HUMAN_INTENT =
  /(数字人|數字人|digital\s*human|讲解视频|講解視頻|口播|数字教师|数字老师|虚拟人|虛擬人|avatar)/i

const layoutRef = ref(null)
const sidebarOpen = ref(true)
const currentPreviewConfig = ref(null)
const currentPreviewType = ref('ppt')
const currentPreviewKey = ref('')
const courseDesignPanel = ref(null)
const lastCourseDesignPanel = ref(null)
const currentCourseDesignSessionId = ref('')
const currentCourseDesignSnapshot = ref(null)
const selectedCourseDesignLessonKey = ref('')
const previewLoading = ref(false)
const previewError = ref('')
const previewWidth = ref(DEFAULT_PREVIEW_WIDTH)
const isPreviewResizing = ref(false)
const inputText = ref('')
const chatListRef = ref(null)
const shouldAutoScroll = ref(true)
const fileInputRef = ref(null)
const currentSessionId = ref(route.query.sessionId ? String(route.query.sessionId) : '')
const currentSessionSnapshot = ref(null)
const isSubmitting = ref(false)
const messages = ref([createGreetingMessage()])
const pendingAttachments = ref([])
const historyList = ref([])
const activeConversationId = ref('')
const isListening = ref(false)
const isRecordingBusy = ref(false)
const isFileSelecting = ref(false)
const voiceInterimTranscript = ref('')
const voiceStatusText = ref('点击后开始实时识别')

const uploadType = ref('pdf')
let speechRecognition = null
let voiceInputBaseText = ''
let voiceFinalTranscript = ''
let voiceStopRequested = false
const quotedLessonData = ref(null)

// 处理“引用单节课”事件
const handleQuoteLesson = (data) => {
  quotedLessonData.value = data
  inputText.value = buildQuotedLessonPrompt(data)
}

const cancelQuote = () => {
  quotedLessonData.value = null
}

function formatListForPrompt(title, values) {
  const list = Array.isArray(values) ? values.filter(Boolean) : []
  if (!list.length) return ''
  return `${title}：${list.join('；')}`
}

function buildQuotedLessonPrompt(data) {
  const lesson = data?.lesson || {}
  const plan = data?.plan || {}
  const lines = [
    `请基于整门课程《${data?.courseName || plan.title || '课程'}》中的「${data?.lessonTitle || lesson.title || '本节课'}」生成这一节课的 PPT 大纲。`,
    '注意：这里只生成当前这一节课的页面级教学大纲和后续 PPT，不要生成整门课程的所有课件。',
    `课时信息：${data?.hours || (lesson.hourIndex ? `第 ${lesson.hourIndex} 学时` : '1 学时')}`,
    lesson.unitTitle ? `所属单元：${lesson.unitTitle}` : '',
    plan.targetAudience ? `授课对象：${plan.targetAudience}` : '',
    plan.learnerProfile ? `学情基础：${plan.learnerProfile}` : '',
    plan.courseGoal ? `整课目标：${plan.courseGoal}` : '',
    formatListForPrompt('本节教学目标', lesson.goals),
    formatListForPrompt('本节主要要点', lesson.keyPoints),
    formatListForPrompt('教师活动', lesson.teacherActions),
    formatListForPrompt('学生活动', lesson.studentActivities),
    formatListForPrompt('评价方式', lesson.assessment),
    formatListForPrompt('课后任务', lesson.homework),
    '请先给出每一页的标题和主要内容，等待我确认或修改后再继续生成初版课件。',
  ]
  return lines.filter(Boolean).join('\n')
}

function loadQuotedLessonFromRoute() {
  const { courseDesignId, lessonKey } = route.query
  if (!courseDesignId || !lessonKey) return
  const result = readCourseDesignLesson(courseDesignId, lessonKey)
  if (!result) return
  handleQuoteLesson({
    courseDesignId,
    lessonKey,
    courseName: result.plan.title,
    lessonTitle: result.lesson.title,
    hours: result.lesson.hourIndex ? `第 ${result.lesson.hourIndex} 学时` : '1学时',
    lesson: result.lesson,
    plan: result.plan,
  })
}

function showCourseDesignPanel(plan = lastCourseDesignPanel.value) {
  if (!plan) {
    ElMessage.info('还没有可查看的整门课程设计')
    return
  }
  courseDesignPanel.value = plan
  lastCourseDesignPanel.value = plan
  currentCourseDesignSessionId.value = plan.sessionId || plan.id || currentCourseDesignSessionId.value
  selectedCourseDesignLessonKey.value = plan.lessons?.[0]?.key || ''
  currentPreviewType.value = 'course-design'
  currentPreviewConfig.value = null
  previewError.value = ''
  previewLoading.value = false
  currentPreviewKey.value = `course-design-${plan.id || Date.now()}`
}
  const displayedThought = ref('')
  let typingInterval = null
  let progressStreamPollingTimer = null
  let thoughtTypewriterTimer = null
  let thinkingElapsedTimer = null
  // When we are about to show the next interaction card (clarification/outline/draft),
  // we prefer "finishing" the current thought in a progressive way instead of snapping.
  let thoughtFinishMode = false
  const progressStreamState = ref({
    sessionId: '',
    nextOffset: 0,
    isTerminal: false,
    events: [],
    seenEventKeys: [],
  })
  const activeThinkingMessageIndex = ref(-1)
const fullThoughtText = `一、审题与核心定位（PPT创作前置思考，先明确方向不跑偏）\n1. 核心主题拆解：“人工智能时代”——不是单纯讲AI技术，而是讲“时代”，需覆盖「过去-现在-未来」，串联技术、应用、影响、挑战，避免沦为纯技术堆砌，要体现“时代变革”的核心逻辑。\n2. 听众画像预判：默认是通用受众（学生/职场人/普通听众），不追求过深的技术原理，重点放在“易懂、有共鸣、有启发”，同时预留少量专业细节，兼顾不同认知水平，避免太浅显无价值、太深奥听不懂。\n3. 汇报核心目标：让听众听懂3件事——① 人工智能时代已经到来，体现在哪里；② 这个时代给我们带来了什么（机遇+挑战）；③ 我们该如何适应这个时代，不被淘汰。\n4. 逻辑闭环设定：必须遵循「认知规律」——从熟悉的场景切入，再讲原理简化版，接着讲应用落地，然后讲问题与应对，最后总结升华，让听众从“知道”到“理解”再到“思考”，形成完整认知链。\n5. 禁忌与侧重点：避免夸大AI能力（不渲染“AI取代人类”的焦虑，也不神化AI的无所不能）；侧重点放在“落地场景”和“个人/社会适配”，弱化复杂算法推导，突出“时代性”而非“技术性”。`
// 处理“预览课程大纲”事件（完美融合现有预览结构）
const handlePreviewDoc = (course) => {
  if (course?.plan) {
    showCourseDesignPanel(course.plan)
    return
  }
  showCourseDesignPanel({
    id: course?.id || `course-outline-${Date.now()}`,
    sessionId: course?.sessionId || course?.id || '',
    title: course?.name || '课程大纲',
    totalHours: course?.outline?.length || 0,
    periodMinutes: 45,
    targetAudience: '通用课程',
    objectives: ['围绕课程主题建立完整知识框架', '按课时组织教学重点与活动安排'],
    lessons: (course?.outline || []).map((lesson, index) => ({
      ...lesson,
      key: lesson.key || `${course?.id || 'course'}-${index + 1}`,
      hourIndex: index + 1,
      title: lesson.title || `第 ${index + 1} 学时`,
      unitTitle: course?.name || '',
      keyPoints: lesson.keyPoints?.length
        ? lesson.keyPoints
        : ['核心概念讲解', '课堂案例分析', '互动讨论与总结'],
    })),
  })
}
const uploadedPending = computed(() =>
  pendingAttachments.value.some((item) => item.status === 'uploading')
)
const hasAudioPendingAttachments = computed(() =>
  pendingAttachments.value.some((item) => item.type === 'audio')
)
const currentPhase = computed(() => getSessionPhase(currentSessionSnapshot.value))
const activeClarificationMessage = computed(() =>
  [...messages.value].reverse().find((message) => message.type === 'clarification' && !message.isSubmitted)
)
const activeDigitalHumanActionMessage = computed(() =>
  [...messages.value]
    .reverse()
    .find(
      (message) =>
        message.type === 'digital-human-actions' &&
        !message.isSubmitted &&
        message.choice === 'yes' &&
        currentSessionId.value &&
        currentPhase.value === 'completed'
    )
)
const showPreviewRegion = computed(() =>
  Boolean(
    currentPreviewConfig.value ||
      courseDesignPanel.value ||
      previewLoading.value ||
      previewError.value
  )
)
const activePreviewComponent = computed(() =>
  currentPreviewType.value === 'document' ? DocumentPreview : PptPreview
)
const previewPanelStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  minWidth: `${MIN_PREVIEW_WIDTH}px`,
}))
const inputPlaceholder = computed(() => {
  if (isListening.value) return '正在聆听中，请讲话...'
  if (quotedLessonData.value) {
    return '根据这节课概括性大纲生成丰富的单节课教学大纲，制作PPT...'
  }
  if (courseDesignPanel.value) return '如需修改整门课程设计，直接输入修改意见；也可以在右侧选择某一节课'
  if (activeClarificationMessage.value) return '请在这里回复上方问题，支持一句话补充，也可以直接发送继续'
  if (activeDigitalHumanActionMessage.value) return '请在这里输入数字人讲解要求，例如对象、语气、时长和重点内容'
  if (currentPhase.value === 'outline_review')
    return '如需修改大纲，直接输入修改意见；满意可点击“接受大纲”'
  if (currentPhase.value === 'draft_review')
    return '如需继续优化，直接输入修改意见；满意可点击“导出最终结果”'
  return '输入主题，或上传参考资料生成 PPT...'
})
const sendDisabled = computed(() => {
  const hasPrompt = Boolean(inputText.value.trim())
  const hasAttachments = pendingAttachments.value.length > 0

  if (isListening.value || uploadedPending.value || isSubmitting.value || isRecordingBusy.value)
    return true
  if (getAttachmentSendBlockMessage(hasAttachments)) return true
  if (hasAttachments && !hasPrompt && !hasAudioPendingAttachments.value) return true
  if (activeClarificationMessage.value || activeDigitalHumanActionMessage.value) return false
  if (currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review') {
    return !hasPrompt
  }
  return !hasPrompt && !hasAttachments
})

const isWelcomeMode = computed(() => {
  // 欢迎模式：没有任何用户发送的消息
  return !messages.value.some((msg) => msg.role === 'user')
})

const progressLabels = ['分析资料', '规划结构', '生成初版', '导出结果']
const progressTips = [
  '正在持续轮询后端状态，生成完成后会自动切换到下一步。',
  '我会先把结构跑通，再把可预览的文件和操作卡片回填到聊天里。',
  '资料越多，grounding 和整理耗时会越长，这是正常现象。',
  '你现在不用手动刷新，状态变化后这里会自动更新。',
]
const ignoredOutlineKeys = new Set([
  'id',
  'slideId',
  'slide_id',
  'pageId',
  'page_id',
  'index',
  'order',
  'sort',
  'position',
  'type',
  'layout',
  'template',
  'style',
  'score',
  'confidence',
  'metadata',
  'meta',
  'image',
  'images',
  'icon',
  'illustration',
  'speaker_notes',
  'speakerNotes',
])
const sidebarRef = ref(null)
const preferredOutlineFields = [
  'title',
  'heading',
  'subtitle',
  'topic',
  'label',
  'name',
  'text',
  'content',
  'summary',
  'description',
  'desc',
  'point',
  'bullet',
]

function createGreetingMessage() {
  return {
    role: 'ai',
    type: 'text',
    content:
      '你好！我是你的 AI PPT 助手。当前对话会持续承接这次生成流程；如果你想开始一个全新的主题，可以点左侧“新建对话”。',
  }
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value))
}

function isGreetingOnlyConversation(messagesData) {
  if (!Array.isArray(messagesData) || messagesData.length !== 1) return false
  const [message] = messagesData
  const greeting = createGreetingMessage()
  return (
    message?.role === greeting.role &&
    message?.type === greeting.type &&
    cleanText(message?.content) === cleanText(greeting.content)
  )
}

function normalizeConversationRecord(item) {
  const messagesData =
    Array.isArray(item.messagesData) && item.messagesData.length
      ? item.messagesData
      : [createGreetingMessage()]

  if (!isGreetingOnlyConversation(messagesData)) {
    return {
      ...item,
      messagesData,
    }
  }

  return {
    ...item,
    messagesData,
    sessionId: '',
    sessionState: null,
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function unwrapData(payload) {
  return payload?.data ?? payload ?? {}
}

function getPreviewError(error) {
  return getUserFacingErrorMessage(error, '预览配置获取失败，请稍后重试。')
}

function isTechnicalErrorMessage(message) {
  const text = String(message || '').trim()
  if (!text) return false
  return /SuperPPT|I\/O error|POST request|GET request|http:\/\/|https:\/\/|localhost|127\.0\.0\.1|\/sessions\/|\/api\/|Axios|ECONN|ETIMEDOUT|ENOTFOUND|Exception|java\.|stack trace|null$/i.test(
    text
  )
}

function getUserFacingErrorMessage(error, fallback = '操作没有成功，请稍后重试。') {
  const rawMessage =
    error?.userMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.response?.data?.errorMessage ||
    error?.response?.data?.error ||
    error?.message ||
    ''
  const text = String(rawMessage || '').trim()
  if (!text) return fallback
  if (isTechnicalErrorMessage(text)) return fallback
  if (/Request failed with status code 400/i.test(text)) {
    return '当前请求条件不满足，请检查信息是否完整，或稍后重新生成。'
  }
  if (/Request failed with status code 401|Request failed with status code 403/i.test(text)) {
    return '当前没有权限完成这个操作，请重新登录或联系管理员。'
  }
  if (/Request failed with status code 404/i.test(text)) {
    return '没有找到对应的生成结果，请重新生成后再试。'
  }
  if (/Request failed with status code 5\d\d/i.test(text)) {
    return '服务处理时遇到问题，请稍后重试。'
  }
  if (/Network Error|timeout/i.test(text)) {
    return '服务暂时连接不上，请稍后再试。'
  }
  return text
}

function clampPreviewWidth(nextWidth) {
  const layoutWidth = layoutRef.value?.clientWidth || window.innerWidth
  const sidebarWidth = sidebarOpen.value ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH
  const maxPreviewWidth = Math.max(
    MIN_PREVIEW_WIDTH,
    layoutWidth - sidebarWidth - MIN_CHAT_MAIN_WIDTH
  )
  return Math.min(Math.max(nextWidth, MIN_PREVIEW_WIDTH), maxPreviewWidth)
}

function syncPreviewWidthWithinViewport() {
  previewWidth.value = clampPreviewWidth(previewWidth.value)
}

function handlePreviewResize(event) {
  if (!isPreviewResizing.value) return
  const layoutRect = layoutRef.value?.getBoundingClientRect()
  if (!layoutRect) return
  const nextWidth = layoutRect.right - event.clientX
  previewWidth.value = clampPreviewWidth(nextWidth)
}

function stopPreviewResize() {
  if (!isPreviewResizing.value) return
  isPreviewResizing.value = false
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', handlePreviewResize)
  window.removeEventListener('mouseup', stopPreviewResize)
}

function startPreviewResize(event) {
  if (!showPreviewRegion.value) return
  isPreviewResizing.value = true
  document.body.style.userSelect = 'none'
  handlePreviewResize(event)
  window.addEventListener('mousemove', handlePreviewResize)
  window.addEventListener('mouseup', stopPreviewResize)
}

function normalizeStatus(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
  return value === 'awaiting_clarification' ? 'needs_clarification' : value
}

function formatElapsed(ms) {
  const seconds = Math.max(1, Math.floor(ms / 1000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return remain === 0 ? `${minutes} 分钟` : `${minutes} 分 ${remain} 秒`
}

function getCurrentStage(snapshot) {
  return String(snapshot?.currentStage || snapshot?.status || snapshot?.nextAction || '')
    .trim()
    .toLowerCase()
}

function buildProgressSteps(activeIndex) {
  return progressLabels.map((label, index) => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }))
}

function getProgressMeta(snapshot) {
  const stage = getCurrentStage(snapshot)
  if (
    stage.includes('artifact') ||
    stage.includes('final') ||
    stage.includes('export') ||
    stage.includes('package')
  ) {
    return {
      title: '正在导出最终文件',
      subtitle: 'PPT、讲义和其他产物正在打包，完成后会直接展示下载与预览入口。',
      badge: '收尾中',
      stepIndex: 3,
    }
  }
  if (
    stage.includes('draft') ||
    stage.includes('slide') ||
    stage.includes('render') ||
    stage.includes('compose')
  ) {
    return {
      title: '正在生成初版课件',
      subtitle: '已经进入正文内容生成阶段，接下来会尽快给出可预览的初版。',
      badge: '写作中',
      stepIndex: 2,
    }
  }
  if (
    stage.includes('outline') ||
    stage.includes('plan') ||
    stage.includes('structure') ||
    stage.includes('storyboard')
  ) {
    return {
      title: '正在规划课件结构',
      subtitle: '后端正在整理章节顺序、重点信息和页面结构，准备输出大纲。',
      badge: '搭结构',
      stepIndex: 1,
    }
  }
  if (
    stage.includes('clarif') ||
    stage.includes('ground') ||
    stage.includes('analysis') ||
    stage.includes('analy') ||
    stage.includes('extract') ||
    stage.includes('material') ||
    stage.includes('parse')
  ) {
    return {
      title: '正在分析资料与需求',
      subtitle: '我在对 PDF、音频和你的要求做 grounding，确保后续生成内容尽量贴合原始资料。',
      badge: '理解中',
      stepIndex: 0,
    }
  }
  return {
    title: '正在整理生成任务',
    subtitle: '任务已经提交成功，正在等待后端进入可展示的处理阶段。',
    badge: '排队中',
    stepIndex: 0,
  }
}

function buildProgressPatch(snapshot, startedAt, round) {
  const meta = getProgressMeta(snapshot)
  return {
    progressTitle: meta.title,
    progressSubtitle: meta.subtitle,
    progressBadge: meta.badge,
    progressSteps: buildProgressSteps(meta.stepIndex),
    progressTip: progressTips[round % progressTips.length],
  }
}

function isCourseDesignIntent(value) {
  const text = String(value || '')
  return (
    /(整门|整個|总体|總體|宏观|宏觀|全套|整个课程|整门课程|课程设计|课时规划|學時|学时)/i.test(text) &&
    /(课程|教学设计|课时|学时|安排|规划|大纲)/i.test(text)
  )
}

function normalizeCourseDesignSnapshot(payload) {
  const data = unwrapData(payload)
  return {
    raw: data,
    sessionId: String(data.sessionId || data.session_id || data.id || ''),
    planId: String(data.planId || data.plan_id || data.sessionId || data.session_id || ''),
    status: normalizeStatus(data.status || ''),
    currentStage: data.currentStage || data.current_stage || '',
    nextAction: String(data.nextAction || data.next_action || ''),
    clarificationItems: data.clarificationItems || data.clarification_items || [],
    clarificationQuestions: data.clarificationQuestions || data.clarification_questions || [],
    clarificationRound: data.clarificationRound || data.clarification_round || null,
    inputMode: data.inputMode || data.input_mode || '',
    naturalLanguagePrompt: data.naturalLanguagePrompt || data.natural_language_prompt || '',
    clarificationSummary: data.clarificationSummary || data.clarification_summary || null,
    clarificationFeedback: data.clarificationFeedback || data.clarification_feedback || '',
    allowsPartialClarification:
      data.allowsPartialClarification ?? data.allows_partial_clarification ?? false,
    error: data.error || data.message || '',
  }
}

function getCourseDesignPhase(snapshot) {
  if (!snapshot) return 'idle'
  if (['failed', 'error', 'interrupted'].includes(snapshot.status)) return 'failed'
  if (snapshot.status === 'needs_clarification' || snapshot.nextAction === 'submit_clarifications') {
    return 'clarification'
  }
  if (snapshot.status === 'completed' || snapshot.nextAction === 'review_or_revise_plan') {
    return 'plan_review'
  }
  return 'poll'
}

function normalizeCourseDesignPlan(payload, sessionId = currentCourseDesignSessionId.value) {
  const data = unwrapData(payload)
  const preview = data.plan_preview || data.planPreview || data.preview || data
  const hours = Array.isArray(preview.hours) ? preview.hours : []
  const lessons = hours.map((hour, index) => {
    const hourIndex = hour.hour_index || hour.hourIndex || index + 1
    const title =
      hour.period_title ||
      hour.periodTitle ||
      hour.lesson_title ||
      hour.lessonTitle ||
      hour.title ||
      `第 ${hourIndex} 学时`
    return {
      key: `${sessionId}-${hourIndex}`,
      hourIndex,
      title,
      unitTitle: hour.unit_title || hour.unitTitle || '',
      goals: flattenReadableText(hour.goals || hour.objectives).slice(0, 6),
      keyPoints: flattenReadableText(
        hour.key_points || hour.keyPoints || hour.points || hour.content || hour.summary
      ).slice(0, 8),
      teacherActions: flattenReadableText(hour.teacher_actions || hour.teacherActions).slice(0, 6),
      studentActivities: flattenReadableText(hour.student_activities || hour.studentActivities).slice(0, 6),
      assessment: flattenReadableText(hour.assessment || hour.evaluation).slice(0, 4),
      homework: flattenReadableText(hour.homework || hour.after_class_task || hour.afterClassTask).slice(0, 4),
    }
  })

  return {
    id: sessionId || data.session_id || data.sessionId || data.plan_id || data.planId || `course-${Date.now()}`,
    sessionId: sessionId || data.session_id || data.sessionId || '',
    planId: data.plan_id || data.planId || sessionId || '',
    title: preview.course_title || preview.courseTitle || preview.title || '整门课程设计',
    topic: preview.topic || '',
    totalHours: preview.total_hours || preview.totalHours || lessons.length,
    periodMinutes: preview.period_minutes || preview.periodMinutes || 45,
    targetAudience: preview.target_audience || preview.targetAudience || '',
    learnerProfile: preview.learner_profile || preview.learnerProfile || '',
    courseGoal: preview.course_goal || preview.courseGoal || '',
    constraints: preview.teaching_constraints || preview.teachingConstraints || '',
    objectives: flattenReadableText(preview.overall_objectives || preview.overallObjectives).slice(0, 8),
    overview: flattenReadableText(preview.course_overview || preview.courseOverview).slice(0, 8),
    assessmentText: flattenReadableText(preview.assessment_strategy || preview.assessmentStrategy).join('、'),
    lessons,
  }
}

function normalizeSessionSnapshot(payload) {
  const data = unwrapData(payload)
  return {
    raw: data,
    sessionId: String(
      data.sessionId || data.session_id || data.taskId || data.task_id || data.id || ''
    ),
    status: normalizeStatus(data.status || ''),
    currentStage: data.currentStage || data.current_stage || '',
    nextAction: String(data.nextAction || data.next_action || ''),
    clarificationItems: data.clarificationItems || data.clarification_items || [],
    clarificationQuestions: data.clarificationQuestions || data.clarification_questions || [],
    clarificationRound: data.clarificationRound || data.clarification_round || null,
    inputMode: data.inputMode || data.input_mode || '',
    naturalLanguagePrompt: data.naturalLanguagePrompt || data.natural_language_prompt || '',
    clarificationSummary: data.clarificationSummary || data.clarification_summary || null,
    clarificationFeedback: data.clarificationFeedback || data.clarification_feedback || '',
    allowsPartialClarification:
      data.allowsPartialClarification ?? data.allows_partial_clarification ?? false,
    error: data.error || data.message || '',
  }
}

function getSessionPhase(snapshot) {
  if (!snapshot) return 'idle'
  if (['failed', 'interrupted'].includes(snapshot.status)) return 'failed'
  if (snapshot.status === 'completed') return 'completed'
  if (snapshot.status === 'needs_clarification' || snapshot.nextAction === 'submit_clarifications')
    return 'clarification'
  if (snapshot.status === 'awaiting_outline_review' || snapshot.nextAction === 'review_outline')
    return 'outline_review'
  if (
    snapshot.status === 'awaiting_draft_review' ||
    snapshot.nextAction === 'revise_draft_or_finalize'
  )
    return 'draft_review'
  return 'poll'
}

function sanitizeFileId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '') || `preview${Date.now()}`
}

function uniqueTruthy(values) {
  return [...new Set(values.filter(Boolean))]
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toUserFacingClarificationText(value, fallback = '') {
  const text = cleanText(value)
    .replace(/^(问题|字段|field|question|prompt|建议|示例)\s*[:：]\s*/i, '')
    .trim()
  if (!text) return fallback
  if (
    /已识别|已有信息|默认值|默认|策略|字段|参数|接口|后端|schema|json|debug|session|pipeline|confidence|置信/i.test(
      text
    )
  ) {
    return fallback
  }
  const firstSentence = text.split(/(?<=[。！？?])\s*/)[0] || text
  return firstSentence.length > 120 ? `${firstSentence.slice(0, 118)}...` : firstSentence
}

function pickUserFacingClarificationText(candidates, fallback) {
  for (const candidate of candidates) {
    const text = toUserFacingClarificationText(candidate)
    if (text) return text
  }
  return fallback
}

function flattenReadableText(value, depth = 0) {
  if (value == null || depth > 3) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = cleanText(value)
    return text && text !== '[object Object]' ? [text] : []
  }
  if (Array.isArray(value))
    return uniqueTruthy(value.flatMap((item) => flattenReadableText(item, depth + 1)))
  if (typeof value === 'object') {
    const fromPreferred = preferredOutlineFields.flatMap((field) =>
      flattenReadableText(value[field], depth + 1)
    )
    if (fromPreferred.length) return uniqueTruthy(fromPreferred)
    return uniqueTruthy(
      Object.entries(value)
        .filter(([key]) => !ignoredOutlineKeys.has(key))
        .flatMap(([, nested]) => flattenReadableText(nested, depth + 1))
    )
  }
  return []
}

function pickReadableText(value, fallback = '') {
  return flattenReadableText(value)[0] || fallback
}

function deriveObjectKeyFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname
      .split('/')
      .filter(Boolean)
      .map((item) => decodeURIComponent(item))
    const bucketIndex = parts.findIndex((item) => item === PREVIEW_BUCKET)
    if (bucketIndex >= 0) {
      return parts.slice(bucketIndex + 1).join('/') || fallback
    }
  } catch {
    return fallback
  }
  return fallback
}

function deriveStorageInfoFromUrl(url, fallbackBucket = PREVIEW_BUCKET, fallbackObjectKey = '') {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname
      .split('/')
      .filter(Boolean)
      .map((item) => decodeURIComponent(item))
    const knownBucketIndex = parts.findIndex((item) => item === PREVIEW_BUCKET)

    if (knownBucketIndex >= 0 && parts[knownBucketIndex + 1]) {
      return {
        bucketName: parts[knownBucketIndex],
        objectKey: parts.slice(knownBucketIndex + 1).join('/') || fallbackObjectKey,
      }
    }

    if (parts.length >= 2) {
      return {
        bucketName: parts[0],
        objectKey: parts.slice(1).join('/') || fallbackObjectKey,
      }
    }
  } catch {
    return {
      bucketName: fallbackBucket,
      objectKey: fallbackObjectKey,
    }
  }

  return {
    bucketName: fallbackBucket,
    objectKey: fallbackObjectKey,
  }
}

function getFileNameFromUrl(url, fallback) {
  if (!url) return fallback
  try {
    const last = new URL(url).pathname.split('/').pop()
    const decoded = last ? decodeURIComponent(last) : ''
    return getFileExtension(decoded) ? decoded : fallback
  } catch {
    return fallback
  }
}

function getArtifactDownloadFileName(url, fallback, kind = '') {
  const fileName = getFileNameFromUrl(url, fallback)
  const extension = getFileExtension(fileName)
  if (extension) return fileName
  if (kind === 'zip') return `${fileName || 'download'}.zip`
  if (kind === 'html') return `${fileName || 'download'}.html`
  if (kind === 'document') return `${fileName || 'download'}.docx`
  if (kind === 'pptx') return `${fileName || 'download'}.pptx`
  return fileName || fallback || 'download'
}

function createStablePreviewKey(value) {
  const text = String(value || '')
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash.toString(36)
}

function buildDirectPreviewPayload(url, options = {}) {
  if (!url) return null
  const fileName = options.fileName || getFileNameFromUrl(url, 'generated.pptx')
  const directKey = typeof url === 'string' && url ? createStablePreviewKey(url) : ''
  const fileId = sanitizeFileId(
    options.fileId ||
      `${options.sessionId || 'session'}-${options.phase || 'preview'}${directKey ? `-${directKey}` : ''}`
  )
  const { bucketName, objectKey } = deriveStorageInfoFromUrl(url, PREVIEW_BUCKET, fileName)
  return {
    fileId,
    fileName,
    objectKey: objectKey || fileName,
    creatorId: 'u100',
    userId: 'u100',
    bucketName: bucketName || PREVIEW_BUCKET,
    directDownloadUrl: url,
    mode: 'edit',
    lang: 'zh-CN',
  }
}

function getFileExtension(name) {
  const match = String(name || '')
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function isDocumentFileName(name) {
  return ['pdf', 'docx'].includes(getFileExtension(name))
}

function getDocumentFileBadge(name) {
  return getFileExtension(name) === 'pdf' ? 'PDF' : 'DOC'
}

function inferPreviewType(source, fileName = '') {
  const sourceName =
    fileName ||
    source?.fileName ||
    source?.file_name ||
    source?.editorConfig?.document?.title ||
    source?.editor_config?.document?.title ||
    (typeof source === 'string' ? getFileNameFromUrl(source, '') : '')

  return isDocumentFileName(sourceName) ? 'document' : 'ppt'
}

function buildDocumentPreviewPayload(url, options = {}) {
  if (!url) return null

  const fileName = options.fileName || getFileNameFromUrl(url, 'document.docx')
  const extension = getFileExtension(fileName)
  const directKey = typeof url === 'string' && url ? createStablePreviewKey(url) : ''
  const fileId = sanitizeFileId(
    options.fileId ||
      `${options.sessionId || 'session'}-${options.phase || 'document-preview'}${directKey ? `-${directKey}` : ''}`
  )
  const { bucketName, objectKey } = deriveStorageInfoFromUrl(url, PREVIEW_BUCKET, fileName)

  return {
    fileId,
    fileName,
    objectKey: objectKey || fileName,
    creatorId: 'u100',
    userId: 'u100',
    bucketName: bucketName || PREVIEW_BUCKET,
    directDownloadUrl: url,
    mode: extension === 'docx' ? 'edit' : 'view',
    lang: 'zh-CN',
  }
}

function buildSessionPreviewPayload(sessionId, options = {}) {
  return {
    previewSource: 'ppt-session-onlyoffice',
    sessionId,
    taskId: options.taskId || '',
    fileName: options.fileName || 'generated.pptx',
    mode: 'edit',
  }
}

function resolvePreviewPayload(payload, downloadUrl, options = {}) {
  const data = unwrapData(payload)
  const direct =
    data.previewPayload ||
    data.preview_payload ||
    data.onlyofficePayload ||
    data.onlyoffice_payload ||
    data.editorPayload ||
    data.editor_payload ||
    data.onlyoffice ||
    data.preview
  if (direct && typeof direct === 'object') return unwrapData(direct)
  if (data.apiJsUrl && data.editorConfig) return data
  return buildDirectPreviewPayload(downloadUrl, options)
}

function normalizeUploadResult(payload) {
  const data = unwrapData(payload)
  const source = {
    ...payload,
    ...data,
  }
  return {
    uploadId: source.uploadId || source.upload_id || source.id || '',
    assetType: source.assetType || source.asset_type || '',
    role: source.role || '',
    fileName: source.fileName || source.filename || source.original_filename || source.name || '',
  }
}

function buildCreateSessionPayload(prompt, attachments) {
  return {
    user_input: prompt || '请基于上传的资料生成一份教学 PPT。',
    user_assets: attachments.map((item) => ({
      type: item.type === 'audio' ? 'audio' : 'document',
      upload_id: item.uploadId || item.upload_id,
    })),
    pipeline_options: {
      pipeline_id: `front_chat_${Date.now()}`,
      runtime_mode: 'prod-like',
      force_restart: true,
    },
  }
}

function buildAppendAssetsPayload(prompt, attachments) {
  return {
    instructions: prompt || '请把我刚上传的资料补充到当前 PPT 生成流程中，并据此更新内容。',
    user_assets: attachments.map((item) => ({
      type: item.type === 'audio' ? 'audio' : 'document',
      upload_id: item.uploadId || item.upload_id,
    })),
  }
}

function extractClarificationItems(snapshot) {
  if (snapshot.clarificationItems?.length) {
    return snapshot.clarificationItems.map((item, index) => ({
      key: item.field || `question_${index + 1}`,
      field: item.field || '',
      question: item.question || `问题 ${index + 1}`,
      options: normalizeClarificationOptions(item.options || item.choices || item.values || []),
    }))
  }
  return (snapshot.clarificationQuestions || []).map((question, index) => ({
    key: `question_${index + 1}`,
    field: '',
    question,
    options: inferClarificationOptions(question),
  }))
}

function normalizeClarificationOptions(options) {
  const optionList = Array.isArray(options)
    ? options
    : String(options || '')
        .split(/[\/,，、|]/)
        .map((item) => item.trim())
        .filter(Boolean)

  return optionList
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        const value = String(option).trim()
        return value ? { label: value, value } : null
      }
      const label = String(
        option?.label || option?.name || option?.text || option?.title || option?.value || ''
      ).trim()
      const value = String(option?.value || option?.key || option?.id || label).trim()
      return label && value ? { label, value } : null
    })
    .filter(Boolean)
}

function inferClarificationOptions(question) {
  const text = String(question || '')
  if (/谁|受众|对象|用户|学生|audience/i.test(text)) {
    return normalizeClarificationOptions(['本科生', '研究生', '中小学', '普通大众'])
  }
  if (/多久|时长|时间|分钟|duration/i.test(text)) {
    return normalizeClarificationOptions(['15分钟', '30分钟', '45分钟', '60分钟'])
  }
  if (/教学|方式|风格|讲解|method|style/i.test(text)) {
    return normalizeClarificationOptions(['概念讲解', '原理推导', '案例驱动', '练习工作坊'])
  }
  if (/难度|基础|level|difficulty/i.test(text)) {
    return normalizeClarificationOptions(['零基础入门', '基础巩固', '进阶理解', '专业深入'])
  }
  return normalizeClarificationOptions(['采用推荐设置'])
}

function getClarificationOptions(item) {
  const normalizedOptions = normalizeClarificationOptions(item.options || [])
  return normalizedOptions.length ? normalizedOptions : inferClarificationOptions(item.question)
}

function normalizeClarificationSummary(summary) {
  if (!summary || typeof summary !== 'object') return null
  const suggestedFields = Array.isArray(summary.suggestedFields || summary.suggested_fields)
    ? summary.suggestedFields || summary.suggested_fields
    : []
  return {
    knownFacts: flattenReadableText(summary.knownFacts || summary.known_facts).slice(0, 4),
    suggestedFields: suggestedFields.map((field) => ({
      field: field.field || '',
      label: field.label || field.name || field.field || '',
      question: field.question || '',
      why: field.why || '',
      examples: flattenReadableText(field.examples).slice(0, 4),
      defaultValue: field.defaultValue || field.default || '',
    })),
    defaults: summary.defaults || {},
    answerExample: summary.answerExample || summary.answer_example || '',
  }
}

function getClarificationRoundLabel(round) {
  if (!round || typeof round !== 'object') return ''
  const current = Number(round.current || 0)
  const total = Number(round.total || 0)
  if (current > 0 && total > 0) return `第 ${current} / ${total} 轮`
  return ''
}

function getClarificationProgressPercent(round) {
  if (!round || typeof round !== 'object') return null
  const total = Number(round.total || 0)
  const answered = Number(round.answered || 0)
  if (total <= 0) return null
  return Math.min(100, Math.max(0, Math.round((answered / total) * 100)))
}

function buildClarificationActionMessage(snapshot, flow = 'ppt') {
  const items = extractClarificationItems(snapshot)
  const summary = normalizeClarificationSummary(snapshot.clarificationSummary)
  const firstSuggested = summary?.suggestedFields?.[0]
  const prompt =
    snapshot.naturalLanguagePrompt ||
    firstSuggested?.question ||
    items[0]?.question ||
    snapshot.clarificationQuestions?.[0] ||
    '请补充当前生成任务需要的信息。'

  return {
    role: 'ai',
    type: 'clarification',
    sessionId: snapshot.sessionId,
    flow,
    title: '补充信息',
    prompt,
    feedback: snapshot.clarificationFeedback || '',
    round: snapshot.clarificationRound,
    roundLabel: getClarificationRoundLabel(snapshot.clarificationRound),
    progressPercent: getClarificationProgressPercent(snapshot.clarificationRound),
    inputMode: snapshot.inputMode || 'natural_language',
    summary,
    answerExample: summary?.answerExample || '',
    items,
    isSubmitted: false,
  }
}

function getClarificationMainQuestion(message) {
  return message?.items?.[0]?.question || '请补充当前问题需要的信息。'
}

function getClarificationDisplayPrompt(message) {
  const item = message?.items?.[0]
  const suggested = message?.summary?.suggestedFields?.[0]
  return pickUserFacingClarificationText(
    [item?.question, suggested?.question, message?.prompt, message?.title],
    '请补充当前生成任务需要的信息。'
  )
}

function selectClarificationAnswer(actionMessage, item, value) {
  if (actionMessage.isSubmitted) return
  actionMessage.answers[item.key] = value
}

function getClarificationAnsweredCount(actionMessage) {
  return actionMessage.items.filter((item) => String(actionMessage.answers[item.key] || '').trim())
    .length
}

function getClarificationProgress(actionMessage) {
  if (!actionMessage.items.length) return 0
  return Math.round(
    (getClarificationAnsweredCount(actionMessage) / actionMessage.items.length) * 100
  )
}

function isClarificationComplete(actionMessage) {
  return getClarificationAnsweredCount(actionMessage) === actionMessage.items.length
}

function extractOutline(payload) {
  const data = unwrapData(payload)
  const preview = data.outline_preview || data.outlinePreview || {}
  const slides = (preview.slides || data.slides || []).map((slide, index) => {
    const title =
      pickReadableText(slide.title || slide.heading || slide.topic || slide.name, '') ||
      `第 ${index + 1} 页`
    const bullets = uniqueTruthy(
      [
        slide.bullets,
        slide.points,
        slide.key_points,
        slide.keyPoints,
        slide.summary,
        slide.content,
        slide.outline,
      ]
        .flatMap((item) => flattenReadableText(item))
        .filter((item) => item !== title)
    ).slice(0, 6)
    return {
      index: index + 1,
      slideId: slide.slide_id || slide.slideId || `slide_${index + 1}`,
      title,
      bullets,
    }
  })
  return {
    slideCount: preview.slide_count || preview.slideCount || slides.length,
    slides,
  }
}

function extractDraft(payload, sessionId) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.minio_download_urls || {}
  const downloadUrl =
    data.downloadUrl ||
    data.minio_download_url ||
    downloadUrls.draft_pptx ||
    downloadUrls.pptx ||
    ''
  const fileName = getFileNameFromUrl(downloadUrl, 'initial-version.pptx')
  const displayName = buildDisplayFileName(fileName, 'draft')
  const previewPayload =
    resolvePreviewPayload(payload, downloadUrl, { sessionId, phase: 'draft', fileName }) ||
    (sessionId
      ? buildSessionPreviewPayload(sessionId, {
          fileName,
          taskId: data.taskId || data.task_id || '',
        })
      : null)
  return {
    key: `draft-base-${downloadUrl || fileName || sessionId || Date.now()}`,
    downloadUrl,
    fileName,
    displayName,
    title: '初版课件',
    description: '首次生成的初版课件',
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload,
    isLatest: true,
  }
}

function normalizeDraftRevisionEntry(item, sessionId, index = 0) {
  const source = unwrapData(item)
  if (!source || typeof source !== 'object') {
    return null
  }

  const downloadUrls = source.downloadUrls || source.minio_download_urls || {}
  const downloadUrl =
    source.downloadUrl ||
    source.minio_download_url ||
    source.revisionDownloadUrl ||
    source.revision_download_url ||
    source.fileUrl ||
    source.file_url ||
    downloadUrls.draft_pptx ||
    downloadUrls.pptx ||
    ''

  if (!downloadUrl) {
    return null
  }

  const revisionNo =
    Number(
      source.revisionNo ||
        source.revision_no ||
        source.version ||
        source.versionNo ||
        source.version_no ||
        index + 1
    ) || index + 1
  const fileName = getFileNameFromUrl(downloadUrl, `optimized-version-${revisionNo}.pptx`)
  const description =
    cleanText(
      source.instructions ||
        source.instruction ||
        source.prompt ||
        source.description ||
        source.summary ||
        source.note ||
        ''
    ) || `根据自然语言修改生成的第 ${revisionNo} 个优化版本`

  return {
    key: `draft-revision-${revisionNo}-${downloadUrl}`,
    revisionNo,
    title: `优化版 V${revisionNo}`,
    description,
    downloadUrl,
    fileName,
    taskId: String(source.taskId || source.task_id || ''),
    previewPayload:
      resolvePreviewPayload(item, downloadUrl, {
        sessionId,
        phase: `draft-revision-${revisionNo}`,
        fileName,
      }) ||
      buildDirectPreviewPayload(downloadUrl, {
        sessionId,
        phase: `draft-revision-${revisionNo}`,
        fileName,
      }),
    isLatest: false,
  }
}

function extractDraftRevisionEntries(payload, sessionId) {
  const data = unwrapData(payload)
  const candidates = [
    ...(Array.isArray(data.revisions) ? data.revisions : []),
    ...(Array.isArray(data.revision_history) ? data.revision_history : []),
    ...(Array.isArray(data.revisionHistory) ? data.revisionHistory : []),
    ...(Array.isArray(data.history) ? data.history : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.versions) ? data.versions : []),
  ]

  return candidates
    .map((item, index) => normalizeDraftRevisionEntry(item, sessionId, index))
    .filter(Boolean)
}

function buildDraftVersions(baseDraft, revisionsPayload, sessionId) {
  const allVersions = [baseDraft, ...extractDraftRevisionEntries(revisionsPayload, sessionId)].filter(
    Boolean
  )
  const uniqueVersions = []
  const seenUrls = new Set()

  allVersions.forEach((item) => {
    const signature = item.downloadUrl || item.key
    if (!signature || seenUrls.has(signature)) return
    seenUrls.add(signature)
    uniqueVersions.push(item)
  })

  uniqueVersions.forEach((item) => {
    item.isLatest = false
  })
  if (uniqueVersions.length) {
    uniqueVersions[uniqueVersions.length - 1].isLatest = true
  }

  return uniqueVersions
}

function getLatestDraftSignature(versions = []) {
  const latest = versions.find((item) => item?.isLatest) || versions[versions.length - 1] || null
  return latest ? latest.downloadUrl || latest.fileName || latest.key || '' : ''
}

function getDraftVersions(actionMessage) {
  return Array.isArray(actionMessage?.versions) ? actionMessage.versions : []
}

function upsertDraftActionMessage(payload, options = {}) {
  const existing = messages.value.find(
    (message) => message.type === 'draft-actions' && message.sessionId === payload.sessionId
  )
  if (existing) {
    Object.assign(existing, payload)
    if (options.moveToLatest) {
      const index = messages.value.indexOf(existing)
      if (index >= 0 && index !== messages.value.length - 1) {
        messages.value.splice(index, 1)
        messages.value.push(existing)
      }
    }
    return existing
  }
  messages.value.push(payload)
  return payload
}

function getDraftActionMessage(sessionId) {
  return messages.value.find(
    (message) => message.type === 'draft-actions' && message.sessionId === sessionId
  )
}

function hasDraftFileMessage(sessionId) {
  return messages.value.some((message) => message.type === 'file' && message.sessionId === sessionId)
}

function getVisibleOutlineSlides(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  if (actionMessage?.isOutlineExpanded) return slides
  return slides.slice(0, OUTLINE_COLLAPSED_SLIDE_COUNT)
}

function getOutlinePreviewBullets(slide) {
  const bullets = Array.isArray(slide?.bullets) ? slide.bullets : []
  return bullets.slice(0, OUTLINE_PREVIEW_BULLET_COUNT)
}

function getHiddenOutlineSlideCount(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  return actionMessage?.isOutlineExpanded
    ? 0
    : Math.max(0, slides.length - OUTLINE_COLLAPSED_SLIDE_COUNT)
}

function getHiddenOutlineBulletCount(slide) {
  const bullets = Array.isArray(slide?.bullets) ? slide.bullets : []
  return Math.max(0, bullets.length - OUTLINE_PREVIEW_BULLET_COUNT)
}

function getOutlineBulletCount(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  return slides.reduce(
    (sum, slide) => sum + (Array.isArray(slide?.bullets) ? slide.bullets.length : 0),
    0
  )
}

function toggleOutlineExpanded(actionMessage) {
  actionMessage.isOutlineExpanded = !actionMessage.isOutlineExpanded
}

function buildDisplayFileName(fileName, kind = 'ppt') {
  const extension =
    getFileExtension(fileName) ||
    (kind === 'teaching-plan' || kind === 'after-class-homework'
      ? 'docx'
      : kind === 'package' || kind === 'html5-package'
        ? 'zip'
        : kind === 'html5-entry'
          ? 'html'
          : 'pptx')
  const nameMap = {
    draft: '课程PPT初版',
    final: '课程PPT最终版',
    'teaching-plan': extension === 'pdf' ? '教学方案' : '教学方案',
    'after-class-homework': '课后作业',
    package: '全量打包',
    'html5-entry': 'HTML5互动资源',
    'html5-package': 'HTML5互动资源包',
    ppt: '课程PPT',
  }
  return `${nameMap[kind] || nameMap.ppt}.${extension}`
}

function resolveArtifactUrl(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''
  return (
    value.minio_download_url ||
    value.minioDownloadUrl ||
    value.download_url ||
    value.downloadUrl ||
    value.url ||
    value.href ||
    ''
  )
}

function normalizeArtifactDownloadUrls(downloadUrls = {}, artifacts = {}) {
  return {
    pptx: resolveArtifactUrl(
      downloadUrls?.pptx || downloadUrls?.final_pptx || downloadUrls?.finalPptx || artifacts?.pptx
    ),
    teaching_plan:
      resolveArtifactUrl(
        downloadUrls?.teaching_plan ||
          downloadUrls?.teachingPlan ||
          artifacts?.teaching_plan ||
          artifacts?.teachingPlan ||
          downloadUrls?.teaching_plan_docx ||
          downloadUrls?.teachingPlanDocx ||
          artifacts?.teaching_plan_docx ||
          artifacts?.teachingPlanDocx ||
          downloadUrls?.docx ||
          artifacts?.docx ||
          downloadUrls?.teaching_plan_pdf ||
          downloadUrls?.teachingPlanPdf ||
          artifacts?.teaching_plan_pdf ||
          artifacts?.teachingPlanPdf ||
          downloadUrls?.pdf ||
          artifacts?.pdf
      ) || '',
    after_class_homework_docx: resolveArtifactUrl(
      downloadUrls?.after_class_homework_docx ||
        downloadUrls?.afterClassHomeworkDocx ||
        artifacts?.after_class_homework_docx ||
        artifacts?.afterClassHomeworkDocx
    ),
    package_zip: resolveArtifactUrl(
      downloadUrls?.package_zip ||
        downloadUrls?.packageZip ||
        artifacts?.package_zip ||
        artifacts?.packageZip ||
        downloadUrls?.all_package_zip ||
        downloadUrls?.allPackageZip ||
        artifacts?.all_package_zip ||
        artifacts?.allPackageZip
    ),
    h5_entry_html: resolveArtifactUrl(
      downloadUrls?.h5_entry_html ||
        downloadUrls?.h5EntryHtml ||
        artifacts?.h5_entry_html ||
        artifacts?.h5EntryHtml ||
        downloadUrls?.html5_entry_html ||
        downloadUrls?.html5EntryHtml ||
        artifacts?.html5_entry_html ||
        artifacts?.html5EntryHtml
    ),
    h5_package_zip: resolveArtifactUrl(
      downloadUrls?.h5_package_zip ||
        downloadUrls?.h5PackageZip ||
        artifacts?.h5_package_zip ||
        artifacts?.h5PackageZip ||
        downloadUrls?.html5_package_zip ||
        downloadUrls?.html5PackageZip ||
        artifacts?.html5_package_zip ||
        artifacts?.html5PackageZip ||
        downloadUrls?.interactive_resource_zip ||
        downloadUrls?.interactiveResourceZip ||
        artifacts?.interactive_resource_zip ||
        artifacts?.interactiveResourceZip
    ),
  }
}

function buildAfterClassHomeworkArtifact(downloadUrls, sessionId, artifacts = {}) {
  const normalizedUrls = normalizeArtifactDownloadUrls(downloadUrls, artifacts)
  const homeworkUrl = normalizedUrls.after_class_homework_docx || ''
  const homeworkFileName = getFileNameFromUrl(homeworkUrl, 'after-class-homework.docx')
  const homeworkDisplayName = buildDisplayFileName(homeworkFileName, 'after-class-homework')

  return homeworkUrl && isDocumentFileName(homeworkFileName)
    ? {
        fileName: homeworkFileName,
        displayName: homeworkDisplayName,
        fileUrl: homeworkUrl,
        previewPayload: buildDocumentPreviewPayload(homeworkUrl, {
          sessionId,
          phase: 'after-class-homework-doc',
          fileName: homeworkFileName,
        }),
        previewType: 'document',
        fileBadge: getDocumentFileBadge(homeworkFileName),
        description: '课后作业已生成完成，点击查看',
      }
    : null
}

function extractArtifacts(payload, sessionId) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.download_urls || data.minio_download_urls || {}
  const artifactsMap = data.artifacts || {}
  const normalizedUrls = normalizeArtifactDownloadUrls(downloadUrls, artifactsMap)
  const pptxUrl = normalizedUrls.pptx || ''
  const fileName = getFileNameFromUrl(pptxUrl, 'final.pptx')
  const displayName = buildDisplayFileName(fileName, 'final')
  const previewPayload =
    pptxUrl
      ? buildDirectPreviewPayload(pptxUrl, {
          sessionId,
          phase: 'final-pptx',
          fileName,
        })
      : resolvePreviewPayload(payload, pptxUrl, { sessionId, phase: 'final', fileName })
  const documentUrl = normalizedUrls.teaching_plan || ''
  const documentFileName = getFileNameFromUrl(
    documentUrl,
    downloadUrls.teaching_plan_pdf ? 'teaching-plan.pdf' : 'teaching-plan.docx'
  )
  const documentDisplayName = buildDisplayFileName(documentFileName, 'teaching-plan')
  const homeworkArtifact = buildAfterClassHomeworkArtifact(normalizedUrls, sessionId, artifactsMap)
  return {
    downloadUrls: normalizedUrls,
    pptxUrl,
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload,
    fileName,
    displayName,
    documentArtifact:
      documentUrl && isDocumentFileName(documentFileName)
        ? {
            fileName: documentFileName,
            displayName: documentDisplayName,
            fileUrl: documentUrl,
            previewPayload: buildDocumentPreviewPayload(documentUrl, {
              sessionId,
              phase: 'final-doc',
              fileName: documentFileName,
            }),
            previewType: 'document',
            fileBadge: getDocumentFileBadge(documentFileName),
            description: '最终文档已生成完成，点击查看',
          }
        : null,
    homeworkArtifact,
  }
}

function extractArtifactLinks(downloadUrls, artifacts = {}) {
  const normalized = normalizeArtifactDownloadUrls(downloadUrls, artifacts)

  const links = [
    ['PPT 下载', normalized.pptx, 'pptx', '课程PPT最终版.pptx'],
    ['教学方案下载', normalized.teaching_plan, 'document', '教学方案.docx'],
    ['课后作业下载', normalized.after_class_homework_docx, 'document', '课后作业.docx'],
    ['HTML5互动资源', normalized.h5_entry_html, 'html', 'HTML5互动资源.html'],
    ['HTML5资源包', normalized.h5_package_zip, 'zip', 'HTML5互动资源包.zip'],
    ['全量打包', normalized.package_zip, 'zip', '全量打包.zip'],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([label, url, kind, fallbackFileName]) => ({
      label,
      url,
      kind,
      fileName: getArtifactDownloadFileName(url, fallbackFileName, kind),
    }))

  return links
}

async function fetchAfterClassHomeworkArtifact(sessionId) {
  if (!sessionId) return null
  try {
    const payload = await fetchAfterClassHomeworkApi(sessionId)
    const data = unwrapData(payload)
    const downloadUrls = data.downloadUrls || data.download_urls || data.minio_download_urls || {}
    return buildAfterClassHomeworkArtifact(downloadUrls, sessionId, data.artifacts || {})
  } catch (error) {
    console.warn('after-class-homework artifact fetch failed:', error)
    return null
  }
}

function isDigitalHumanIntent(value) {
  return DIGITAL_HUMAN_INTENT.test(String(value || ''))
}

function normalizeDigitalHumanResult(payload) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.download_urls || data.urls || {}
  const videoUrl =
    data.videoUrl ||
    data.video_url ||
    data.resultUrl ||
    data.result_url ||
    downloadUrls.video ||
    downloadUrls.mp4 ||
    downloadUrls.digital_human_video ||
    downloadUrls.digital_human_mp4 ||
    ''
  return {
    raw: data,
    status: normalizeStatus(data.status || data.state || data.resultStatus || data.stage || ''),
    message: data.message || data.statusMessage || data.status_message || '',
    taskId: String(data.taskId || data.task_id || data.id || ''),
    videoUrl,
    downloadUrls: {
      ...downloadUrls,
      ...(videoUrl ? { video: videoUrl } : {}),
    },
  }
}

function shouldContinuePollingDigitalHuman(result) {
  if (!result || result.videoUrl) return false
  if (['failed', 'error', 'cancelled', 'canceled'].includes(result.status)) return false
  return (
    !result.status ||
    ['pending', 'queued', 'running', 'processing', 'in_progress', 'submitted', 'created'].includes(
      result.status
    )
  )
}

async function waitForDigitalHumanResult(sessionId, initialPayload) {
  let result = normalizeDigitalHumanResult(
    initialPayload || (await fetchPptDigitalHumanApi(sessionId))
  )
  if (!shouldContinuePollingDigitalHuman(result)) return result
  for (let round = 0; round < DIGITAL_HUMAN_POLL_MAX_TIMES; round += 1) {
    await wait(DIGITAL_HUMAN_POLL_INTERVAL_MS)
    result = normalizeDigitalHumanResult(await fetchPptDigitalHumanApi(sessionId))
    if (!shouldContinuePollingDigitalHuman(result)) return result
  }
  throw new Error('数字人生成超时，请稍后重试')
}

function extractDigitalHumanLinks(downloadUrls) {
  return [
    ['数字人视频', downloadUrls.video || downloadUrls.mp4 || downloadUrls.digital_human_video],
    ['字幕文件', downloadUrls.subtitle || downloadUrls.srt],
    ['讲解脚本', downloadUrls.script || downloadUrls.script_docx || downloadUrls.docx],
    [
      '在线播放',
      downloadUrls.preview || downloadUrls.play_url || downloadUrls.hls || downloadUrls.m3u8,
    ],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }))
}

async function pollCourseDesignUntilActionable(sessionId, initialPayload, onProgress) {
  const startedAt = Date.now()
  let snapshot = normalizeCourseDesignSnapshot(
    initialPayload || (await fetchCourseDesignSessionApi(sessionId))
  )
  onProgress?.(snapshot, 0, startedAt)
  for (let round = 0; round < POLL_MAX_TIMES; round += 1) {
    if (getCourseDesignPhase(snapshot) !== 'poll') return snapshot
    await wait(POLL_INTERVAL_MS)
    snapshot = normalizeCourseDesignSnapshot(await fetchCourseDesignSessionApi(sessionId))
    onProgress?.(snapshot, round + 1, startedAt)
  }
  throw new Error('课程设计生成超时，请稍后重试')
}

function buildCourseDesignProgressPatch(snapshot, startedAt, round) {
  const stage = getCurrentStage(snapshot)
  const isExport = stage.includes('export')
  const isPlan = stage.includes('plan') || stage.includes('generate') || stage.includes('revise')
  return {
    progressTitle: isExport
      ? '正在整理课程设计文档'
      : isPlan
        ? '正在规划每个学时'
        : '正在分析整门课程需求',
    progressSubtitle: isExport
      ? '右侧会展示完整课程设计，之后可以继续自然语言修改。'
      : isPlan
        ? '我会把课程拆成逐学时的主题、目标、要点和教学活动。'
        : '我在识别授课对象、总学时、课程目标和约束条件。',
    progressBadge: isExport ? '收尾中' : isPlan ? '规划中' : '理解中',
    progressSteps: [
      { label: '分析需求', state: isPlan || isExport ? 'done' : 'active' },
      { label: '课时规划', state: isExport ? 'done' : isPlan ? 'active' : 'pending' },
      { label: '整理预览', state: isExport ? 'active' : 'pending' },
      { label: '可修改', state: 'pending' },
    ],
    progressTip: progressTips[round % progressTips.length],
  }
}

async function pullCourseDesignProgressStreamOnce(sessionId) {
  if (!sessionId) return
  const messageIndex = activeThinkingMessageIndex.value
  const state = progressStreamState.value
  const nextOffset =
    state.sessionId === sessionId && Number.isFinite(state.nextOffset) ? state.nextOffset : 0
  const payload = await fetchCourseDesignProgressStreamApi(sessionId, { since: nextOffset, limit: 50 })
  const data = unwrapData(payload)
  const events = Array.isArray(data.events) ? data.events : Array.isArray(data.data) ? data.data : []
  const incomingNextOffset =
    data.next_since ?? data.nextSince ?? data.next_offset ?? data.nextOffset ?? data.cursor ?? data.since ?? data.offset

  if (progressStreamState.value.sessionId !== sessionId) resetProgressStreamState(sessionId)
  appendUniqueProgressEvents(events)
  if (incomingNextOffset !== undefined && incomingNextOffset !== null && incomingNextOffset !== '') {
    progressStreamState.value.nextOffset = Number(incomingNextOffset) || progressStreamState.value.nextOffset
  }

  const nextText = progressStreamState.value.events
    .map((event) => resolveProgressEventText(event))
    .filter(Boolean)
    .join('\n')
  if (messageIndex >= 0 && messages.value[messageIndex]) {
    const msg = messages.value[messageIndex]
    msg.thoughtTargetText = nextText
    if (!msg.thoughtText) msg.thoughtText = ''
    ensureThoughtTypewriter(messageIndex)
  }
}

function startCourseDesignProgressPolling(sessionId) {
  stopProgressStreamPolling()
  resetProgressStreamState(sessionId)
  refreshCourseDesignProgressStreamApi(sessionId, {}).catch(() => {})
  pullCourseDesignProgressStreamOnce(sessionId).catch((error) => {
    console.warn('course-design progress initial pull failed:', error)
  })
  progressStreamPollingTimer = setInterval(() => {
    if (!currentCourseDesignSessionId.value || currentCourseDesignSessionId.value !== sessionId) {
      stopProgressStreamPolling()
      return
    }
    pullCourseDesignProgressStreamOnce(sessionId).catch((error) => {
      console.warn('course-design progress polling failed:', error)
    })
  }, 1200)
}

async function fetchAndShowCourseDesignPlan(sessionId) {
  const payload = await fetchCourseDesignPlanApi(sessionId)
  const plan = normalizeCourseDesignPlan(payload, sessionId)
  courseDesignPanel.value = plan
  lastCourseDesignPanel.value = plan
  selectedCourseDesignLessonKey.value = plan.lessons[0]?.key || ''
  currentPreviewType.value = 'course-design'
  currentPreviewConfig.value = null
  previewError.value = ''
  previewLoading.value = false
  currentPreviewKey.value = `course-design-${sessionId}-${Date.now()}`
  upsertCourseDesignPlan(plan)
  try {
    await fetchCourseDesignArtifactsApi(sessionId)
  } catch (error) {
    console.warn('course-design artifacts fetch failed:', error)
  }
  return plan
}

async function presentCourseDesignState(snapshot, thinkingIndex) {
  currentCourseDesignSnapshot.value = snapshot
  if (snapshot?.sessionId) currentCourseDesignSessionId.value = snapshot.sessionId
  const phase = getCourseDesignPhase(snapshot)
  if (phase === 'clarification') {
    await finishThinkingMessage(thinkingIndex, '我还需要补充一些课程约束，填完后会继续生成整门课程设计。')
    messages.value.push(buildClarificationActionMessage(snapshot, 'course-design'))
    focusLatestMessage()
    return
  }
  if (phase === 'plan_review') {
    await fetchAndShowCourseDesignPlan(snapshot.sessionId)
    await finishThinkingMessage(
      thinkingIndex,
      '整门课程设计已经生成在右侧。你可以直接输入修改意见继续调整，也可以点某一节课进入单节课 PPT 大纲生成。'
    )
    currentSessionSnapshot.value = null
    currentSessionId.value = ''
    focusLatestMessage()
    return
  }
  if (phase === 'failed') {
    throw new Error(snapshot.error || '课程设计生成失败')
  }
}

  async function finishThinkingMessage(index, content) {
    if (typingInterval) clearInterval(typingInterval) // 👈 新增：结束时清理定时器
    if (!messages.value[index]) return
    stopProgressStreamPolling()
    // Let the typewriter catch up first so the thinking transcript doesn't "jump" to the end.
    await waitForThoughtTypewriter(index, { timeoutMs: 3000 })
    // Fallback: ensure we never leave a visibly truncated tail.
    flushThoughtTypewriter(index)
    stopThoughtTypewriter()
    await wait(220)
    messages.value[index].isThinking = false
    messages.value[index].type = 'text'
    messages.value[index].content = content
    messages.value[index].progressBadge = '已完成'
    stopThinkingElapsedTimer()
    activeThinkingMessageIndex.value = -1
    focusLatestMessage()
  }

function patchMessage(index, patch) {
  if (!messages.value[index]) return
  Object.assign(messages.value[index], patch)
}

function toggleThought(msg) {
    msg.isThoughtExpanded = !msg.isThoughtExpanded
}

function stopThoughtTypewriter() {
  if (thoughtTypewriterTimer) {
    clearInterval(thoughtTypewriterTimer)
    thoughtTypewriterTimer = null
  }
  thoughtFinishMode = false
}

function stopThinkingElapsedTimer() {
  if (thinkingElapsedTimer) {
    clearInterval(thinkingElapsedTimer)
    thinkingElapsedTimer = null
  }
}

function startThinkingElapsedTimer(messageIndex) {
  stopThinkingElapsedTimer()
  const msg = messages.value[messageIndex]
  if (!msg) return
  const startedAt = Date.now()
  msg.thinkingStartedAt = startedAt
  msg.elapsedLabel = formatElapsed(Date.now() - startedAt)
  thinkingElapsedTimer = setInterval(() => {
    const current = messages.value[messageIndex]
    if (!current || !current.isThinking) {
      stopThinkingElapsedTimer()
      return
    }
    current.elapsedLabel = formatElapsed(Date.now() - startedAt)
  }, 500)
}

  function stopProgressStreamPolling() {
    if (progressStreamPollingTimer) {
      clearInterval(progressStreamPollingTimer)
      progressStreamPollingTimer = null
    }
  }

function resetProgressStreamState(sessionId) {
  progressStreamState.value = {
    sessionId: String(sessionId || ''),
    nextOffset: 0,
    isTerminal: false,
    events: [],
    seenEventKeys: [],
  }
}

function resolveProgressEventText(event) {
  if (!event) return ''
  return (
    event.thinking_text ||
    event.thinkingText ||
    event.display_text ||
    event.displayText ||
    event.text ||
    event.message ||
    ''
  )
}

function getProgressEventKey(event, fallbackIndex = 0) {
  if (!event || typeof event !== 'object') {
    return `raw:${String(event || '')}:${fallbackIndex}`
  }
  const explicitKey =
    event.id ??
    event.event_id ??
    event.eventId ??
    event.offset ??
    event.index ??
    event.seq ??
    event.sequence ??
    ''
  if (explicitKey !== '') return `id:${explicitKey}`
  return `text:${resolveProgressEventText(event)}`
}

function appendUniqueProgressEvents(events) {
  const state = progressStreamState.value
  const seen = new Set(Array.isArray(state.seenEventKeys) ? state.seenEventKeys : [])
  const additions = []

  events.filter(Boolean).forEach((event, index) => {
    const key = getProgressEventKey(event, index)
    if (!key || seen.has(key)) return
    seen.add(key)
    additions.push(event)
  })

  if (!additions.length) {
    progressStreamState.value.seenEventKeys = Array.from(seen)
    return
  }

  progressStreamState.value.events = [...state.events, ...additions]
  progressStreamState.value.seenEventKeys = Array.from(seen)
}

  function ensureThoughtTypewriter(messageIndex) {
    if (thoughtTypewriterTimer) return
    thoughtTypewriterTimer = setInterval(() => {
      const idx = messageIndex
      const msg = idx >= 0 ? messages.value[idx] : null
      if (!msg) return

      const target = String(msg.thoughtTargetText || '')
      const current = String(msg.thoughtText || '')
      if (!target) return
      if (current.length >= target.length) {
        if (!msg.isThinking) stopThoughtTypewriter()
        return
      }

      // Gradual reveal (feels more like "thinking").
      // During finishing (before showing next interaction), we speed up a bit to avoid long waits.
      const baseStep = Math.max(2, Math.min(10, Math.ceil(target.length / 650)))
      const step = thoughtFinishMode ? Math.max(baseStep, 10) : baseStep
      msg.thoughtText = target.slice(0, current.length + step)
      scrollToBottom()
    }, 48)
  }

  function isThoughtTypewriterDone(messageIndex) {
    const idx = Number(messageIndex)
    const msg = idx >= 0 ? messages.value[idx] : null
    if (!msg) return true
    const target = String(msg.thoughtTargetText || '')
    const current = String(msg.thoughtText || '')
    if (!target) return true
    return current.length >= target.length
  }

  async function waitForThoughtTypewriter(messageIndex, { timeoutMs = 8000 } = {}) {
    const idx = Number(messageIndex)
    const msg = idx >= 0 ? messages.value[idx] : null
    if (!msg) return

    // If we haven't received any target yet, don't block the UI.
    const target = String(msg.thoughtTargetText || '')
    if (!target) return

    thoughtFinishMode = true
    const startedAt = Date.now()
    // Make sure typewriter is running so it can catch up.
    ensureThoughtTypewriter(idx)

    while (Date.now() - startedAt < timeoutMs) {
      if (isThoughtTypewriterDone(idx)) return
      // Small wait; keep it simple and avoid creating additional timers.
      // eslint-disable-next-line no-await-in-loop
      await wait(60)
    }
  }

function flushThoughtTypewriter(messageIndex) {
  const idx = Number(messageIndex)
  const msg = idx >= 0 ? messages.value[idx] : null
  if (!msg) return

  const target = String(msg.thoughtTargetText || '')
  if (!target) return
  msg.thoughtText = target
}

  async function pullProgressStreamOnce(sessionId) {
    if (!sessionId) return
    const messageIndex = activeThinkingMessageIndex.value

  const state = progressStreamState.value
  const nextOffset =
    state.sessionId === sessionId && Number.isFinite(state.nextOffset) ? state.nextOffset : 0

  const payload = await fetchPptProgressStreamApi(sessionId, {
    // backend expects `since` for incremental reads
    since: nextOffset,
    limit: 50,
  })
  const data = unwrapData(payload)
  const events = Array.isArray(data.events) ? data.events : Array.isArray(data.data) ? data.data : []
  const normalizedEvents = events.filter(Boolean)
  const incomingNextOffset =
    data.next_since ??
    data.nextSince ??
    data.next_offset ??
    data.nextOffset ??
    data.cursor ??
    data.since ??
    data.offset
  const incomingTerminal = Boolean(data.is_terminal ?? data.isTerminal ?? data.terminal ?? false)

  if (progressStreamState.value.sessionId !== sessionId) {
    resetProgressStreamState(sessionId)
  }

  appendUniqueProgressEvents(normalizedEvents)
  if (incomingNextOffset !== undefined && incomingNextOffset !== null && incomingNextOffset !== '') {
    progressStreamState.value.nextOffset =
      Number(incomingNextOffset) || progressStreamState.value.nextOffset
  }
  progressStreamState.value.isTerminal = incomingTerminal

  const allTexts = progressStreamState.value.events
    .map((event) => resolveProgressEventText(event))
    .filter(Boolean)
    const nextText = allTexts.join('\n')
    if (messageIndex >= 0 && messages.value[messageIndex]) {
      const msg = messages.value[messageIndex]
      msg.thoughtTargetText = nextText
      if (!msg.thoughtText) msg.thoughtText = ''
      ensureThoughtTypewriter(messageIndex)
    } else {
      displayedThought.value = nextText
    }
  }

function startProgressStreamPolling(sessionId) {
  stopProgressStreamPolling()
  resetProgressStreamState(sessionId)
  currentCourseDesignSessionId.value = ''

  // Some upstream implementations require an explicit refresh to emit the latest events.
  refreshPptProgressStreamApi(sessionId, {}).catch(() => {})

  pullProgressStreamOnce(sessionId).catch((error) => {
    console.warn('progress-stream initial pull failed:', error)
  })

  progressStreamPollingTimer = setInterval(() => {
    if (!currentSessionId.value || currentSessionId.value !== sessionId) {
      stopProgressStreamPolling()
      return
    }
    if (progressStreamState.value.isTerminal) {
      stopProgressStreamPolling()
      return
    }
    pullProgressStreamOnce(sessionId).catch((error) => {
      console.warn('progress-stream polling failed:', error)
    })
  }, 1200)
}
  function appendThinkingMessage() {
    const index = messages.value.length
    activeThinkingMessageIndex.value = index
    const startedAt = Date.now()
    messages.value.push({
      role: 'ai',
      type: 'text',
      isThinking: true,
      thinkingStartedAt: startedAt,
      thoughtText: '',
      thoughtTargetText: '',
      isThoughtExpanded: false,
      content: '',
      progressTitle: '正在整理生成任务',
      progressSubtitle: '我会持续轮询后端状态，并把每一步的结果自动展示在聊天里。',
      progressBadge: '启动中',
      progressSteps: buildProgressSteps(0),
      elapsedLabel: formatElapsed(0),
      progressTip: progressTips[0],
    })
  displayedThought.value = ''
  startThinkingElapsedTimer(index)
  // Switch to real backend progress-stream for user-visible thinking process.
  stopProgressStreamPolling()
  if (typingInterval) clearInterval(typingInterval)
  if (currentSessionId.value) {
    startProgressStreamPolling(currentSessionId.value)
  }
  scrollToBottom()
  return index
  /* legacy typewriter (replaced by progress-stream)
  if (typingInterval) clearInterval(typingInterval)
  let charIndex = 0
  typingInterval = setInterval(() => {
    if (charIndex < fullThoughtText.length) {
      displayedThought.value += fullThoughtText[charIndex]
      charIndex++
      // 每吐出 5 个字稍微向下滚动一下，防止文字超过屏幕
      if (charIndex % 5 === 0) scrollToBottom()
    } else {
      clearInterval(typingInterval)
    }
  }, 25) // 👈 25代表每秒吐出约40个字，你可以改这个数字调节快慢
  // 👆 新增结束 👆
  scrollToBottom()
  return index
  */
}

function markSessionCardsSubmitted(sessionId) {
  messages.value.forEach((message) => {
    if (
      message.sessionId === sessionId &&
      ['clarification', 'outline-review', 'draft-actions'].includes(message.type)
    ) {
      message.isSubmitted = true
    }
  })
}

function ensureDigitalHumanActionCard(sessionId) {
  const existing = messages.value.find(
    (message) => message.type === 'digital-human-actions' && message.sessionId === sessionId
  )
  if (existing) return existing

  const actionMessage = {
    role: 'ai',
    type: 'digital-human-actions',
    sessionId,
    isSubmitted: false,
    hasGenerated: false,
    choice: '',
    prompt: '',
  }
  messages.value.push(actionMessage)
  return actionMessage
}

async function pollSessionUntilActionable(sessionId, initialPayload, onProgress) {
  const startedAt = Date.now()
  let snapshot = normalizeSessionSnapshot(initialPayload || (await fetchPptSessionApi(sessionId)))
  onProgress?.(snapshot, 0, startedAt)
  for (let round = 0; round < POLL_MAX_TIMES; round += 1) {
    if (getSessionPhase(snapshot) !== 'poll') return snapshot
    await wait(POLL_INTERVAL_MS)
    snapshot = normalizeSessionSnapshot(await fetchPptSessionApi(sessionId))
    onProgress?.(snapshot, round + 1, startedAt)
  }
  throw new Error('PPT generation timed out')
}

async function fetchDraftVersionBundle(sessionId) {
  const draft = extractDraft(await fetchPptDraftApi(sessionId), sessionId)
  if (!draft.downloadUrl || !draft.previewPayload) {
    throw new Error('初版预览地址缺失')
  }

  let revisionsPayload = null
  try {
    revisionsPayload = await fetchPptRevisionsApi(sessionId)
  } catch (error) {
    console.warn('Failed to fetch draft revisions:', error)
  }

  return {
    draft,
    revisionsPayload,
    versions: buildDraftVersions(draft, revisionsPayload, sessionId),
  }
}

async function waitForDraftVersionUpdate(sessionId, previousSignature = '', onProgress) {
  const startedAt = Date.now()

  for (let round = 0; round < POLL_MAX_TIMES; round += 1) {
    const snapshot = normalizeSessionSnapshot(await fetchPptSessionApi(sessionId))
    onProgress?.(snapshot, round, startedAt)

    const isDraftReady = getSessionPhase(snapshot) === 'draft_review'
    if (isDraftReady) {
      try {
        const bundle = await fetchDraftVersionBundle(sessionId)
        const latestSignature = getLatestDraftSignature(bundle.versions)
        if (!previousSignature || (latestSignature && latestSignature !== previousSignature)) {
          return { snapshot, ...bundle }
        }
      } catch (error) {
        console.warn('draft version refresh failed:', error)
      }
    }

    await wait(POLL_INTERVAL_MS)
  }

  throw new Error('修改后的课件版本还没有准备好，请稍后再试')
}

function updateCurrentSession(snapshot) {
  currentSessionSnapshot.value = snapshot
  if (snapshot?.sessionId) {
    currentSessionId.value = snapshot.sessionId
  }
}

async function presentSessionState(snapshot, thinkingIndex) {
  updateCurrentSession(snapshot)
  markSessionCardsSubmitted(snapshot.sessionId)

  const phase = getSessionPhase(snapshot)
  if (phase === 'clarification') {
    await finishThinkingMessage(
      thinkingIndex,
      '我还需要一些补充信息，填完下面的问题后我就继续生成。'
    )
    messages.value.push(buildClarificationActionMessage(snapshot, 'ppt'))
    focusLatestMessage()
    return
  }

  if (phase === 'outline_review') {
    const outline = extractOutline(await fetchPptOutlineApi(snapshot.sessionId))
    await finishThinkingMessage(
      thinkingIndex,
      '大纲已经生成好了。你可以先看大纲，满意后继续生成；如果想改，直接在输入框告诉我。'
    )
    messages.value.push({
      role: 'ai',
      type: 'outline-review',
      sessionId: snapshot.sessionId,
      slideCount: outline.slideCount,
      slides: outline.slides,
      isOutlineExpanded: false,
      isSubmitted: false,
    })
    focusLatestMessage()
    return
  }

  if (phase === 'draft_review') {
    const { draft, versions } = await fetchDraftVersionBundle(snapshot.sessionId)

    await finishThinkingMessage(
      thinkingIndex,
      versions.length > 1
        ? '新的优化版本已经生成，旧版本仍然保留。你可以分别预览每一版，继续用自然语言修改，或直接导出最终结果。'
        : '初版课件已经生成好了，可以先预览；如果想调整，直接在输入框告诉我，满意后点“导出最终结果”。'
    )
    if (!hasDraftFileMessage(snapshot.sessionId)) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        taskId: draft.taskId,
        content: draft.displayName,
        description: '当前初版已可预览，点击查看',
        previewPayload: draft.previewPayload,
        fileUrl: draft.downloadUrl,
        suggestions: ['减少公式页，增加应用案例', '整体风格改成更适合课堂授课的简洁版'],
      })
    }
    upsertDraftActionMessage({
      role: 'ai',
      type: 'draft-actions',
      sessionId: snapshot.sessionId,
      taskId: draft.taskId,
      previewPayload: draft.previewPayload,
      downloadUrl: draft.downloadUrl,
      versions,
      isSubmitted: false,
    })
    focusLatestMessage()
    return
  }

  if (phase === 'completed') {
    const artifacts = extractArtifacts(
      await fetchPptArtifactsApi(snapshot.sessionId),
      snapshot.sessionId
    )
    const homeworkArtifact =
      (await fetchAfterClassHomeworkArtifact(snapshot.sessionId)) || artifacts.homeworkArtifact
    const finalDownloadUrls = {
      ...artifacts.downloadUrls,
      after_class_homework_docx: homeworkArtifact?.fileUrl || artifacts.downloadUrls.after_class_homework_docx,
    }
    await finishThinkingMessage(thinkingIndex, '最终结果已导出完成，可以预览或下载。')
    if (artifacts.pptxUrl && artifacts.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        taskId: artifacts.taskId,
        content: artifacts.displayName,
        description: '最终 PPT 已生成完成，点击查看',
        previewPayload: artifacts.previewPayload,
        fileUrl: artifacts.pptxUrl,
        previewType: 'ppt',
        fileBadge: 'PPT',
      })
    }
    if (artifacts.documentArtifact?.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        content: artifacts.documentArtifact.displayName,
        description: artifacts.documentArtifact.description,
        previewPayload: artifacts.documentArtifact.previewPayload,
        fileUrl: artifacts.documentArtifact.fileUrl,
        previewType: artifacts.documentArtifact.previewType,
        fileBadge: artifacts.documentArtifact.fileBadge,
      })
    }
    if (homeworkArtifact?.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        content: homeworkArtifact.displayName,
        description: homeworkArtifact.description,
        previewPayload: homeworkArtifact.previewPayload,
        fileUrl: homeworkArtifact.fileUrl,
        previewType: homeworkArtifact.previewType,
        fileBadge: homeworkArtifact.fileBadge,
      })
    }
    const links = extractArtifactLinks(finalDownloadUrls)
    if (links.length) {
      messages.value.push({
        role: 'ai',
        type: 'artifact-links',
        links,
      })
    }
    ensureDigitalHumanActionCard(snapshot.sessionId)
    focusLatestMessage()
    return
  }

  if (phase === 'failed') {
    throw new Error(snapshot.error || '生成失败，请稍后重试')
  }

  await finishThinkingMessage(thinkingIndex, '当前生成状态已更新。')
}

async function createSessionFromPrompt(prompt, attachments) {
  const thinkingIndex = appendThinkingMessage()
  try {
    const response = await createPptSessionApi(buildCreateSessionPayload(prompt, attachments))
    const snapshot = normalizeSessionSnapshot(response)
    if (!snapshot.sessionId) {
      throw new Error('创建任务失败：未返回有效标识')
    }
    // Start polling immediately after session creation so the thinking process is visible.
    startProgressStreamPolling(snapshot.sessionId)

    const finalSnapshot = await pollSessionUntilActionable(
      snapshot.sessionId,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(finalSnapshot, thinkingIndex)
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '生成失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

async function appendAssetsToCurrentSession(prompt, attachments) {
  if (!currentSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    const response = await appendPptSessionAssetsApi(
      currentSessionId.value,
      buildAppendAssetsPayload(prompt, attachments)
    )
    const finalSnapshot = await pollSessionUntilActionable(
      currentSessionId.value,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(finalSnapshot, thinkingIndex)
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '补充资料失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

async function submitClarifications(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  const completedAnswers = actionMessage.items
    .map((item) => ({
      ...item,
      answer: String(actionMessage.answers[item.key] || '').trim(),
    }))
    .filter((item) => item.answer)
  if (!completedAnswers.length || completedAnswers.length !== actionMessage.items.length) {
    ElMessage.warning('请先补全所有澄清问题')
    return
  }
  const payload = completedAnswers.every((item) => item.field)
    ? { answers: Object.fromEntries(completedAnswers.map((item) => [item.field, item.answer])) }
    : {
        answers: completedAnswers.map((item) => ({ question: item.question, answer: item.answer })),
      }

  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({
    role: 'user',
    type: 'text',
    content: completedAnswers.map((item) => `${item.question}：${item.answer}`).join('\n'),
  })
  focusLatestMessage()

  if (actionMessage.flow === 'course-design') {
    const thinkingIndex = appendThinkingMessage()
    try {
      await submitCourseDesignClarificationsApi(actionMessage.sessionId, payload)
      currentCourseDesignSessionId.value = actionMessage.sessionId
      startCourseDesignProgressPolling(actionMessage.sessionId)
      const snapshot = await pollCourseDesignUntilActionable(
        actionMessage.sessionId,
        undefined,
        (current, round, startedAt) => {
          patchMessage(thinkingIndex, buildCourseDesignProgressPatch(current, startedAt, round))
        }
      )
      await presentCourseDesignState(snapshot, thinkingIndex)
    } catch (error) {
      actionMessage.isSubmitted = false
      const message = getUserFacingErrorMessage(error, '提交课程设计补充信息失败。')
      finishThinkingMessage(thinkingIndex, message)
      ElMessage.error(message)
    } finally {
      isSubmitting.value = false
    }
    return
  }

  const thinkingIndex = appendThinkingMessage()
  try {
    await submitPptClarificationsApi(actionMessage.sessionId, payload)
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    const message = getUserFacingErrorMessage(error, '提交澄清信息失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function submitNaturalLanguageClarification(actionMessage, text = '') {
  if (isSubmitting.value || !actionMessage?.sessionId) return
  actionMessage.isSubmitted = true
  isSubmitting.value = true
  const thinkingIndex = appendThinkingMessage()

  try {
    if (actionMessage.flow === 'course-design') {
      const response = await submitCourseDesignNaturalLanguageClarificationApi(
        actionMessage.sessionId,
        text
      )
      let snapshot = normalizeCourseDesignSnapshot(response)
      currentCourseDesignSessionId.value = actionMessage.sessionId
      if (getCourseDesignPhase(snapshot) === 'poll') {
        startCourseDesignProgressPolling(actionMessage.sessionId)
        snapshot = await pollCourseDesignUntilActionable(
          actionMessage.sessionId,
          response,
          (current, round, startedAt) => {
            patchMessage(thinkingIndex, buildCourseDesignProgressPatch(current, startedAt, round))
          }
        )
      }
      await presentCourseDesignState(snapshot, thinkingIndex)
      return
    }

    const response = await submitPptNaturalLanguageClarificationApi(actionMessage.sessionId, text)
    let snapshot = normalizeSessionSnapshot(response)
    if (getSessionPhase(snapshot) === 'poll') {
      snapshot = await pollSessionUntilActionable(
        actionMessage.sessionId,
        response,
        (current, round, startedAt) => {
          patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
        }
      )
    }
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    const message = getUserFacingErrorMessage(error, '提交补充信息失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function acceptOutline(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({ role: 'user', type: 'text', content: '确认大纲并继续生成' })
  focusLatestMessage()

  const thinkingIndex = appendThinkingMessage()
  try {
    await reviewPptOutlineApi(actionMessage.sessionId, { action: 'accept' })
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    const message = getUserFacingErrorMessage(error, '确认大纲失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function reviseOutline(instructions) {
  if (!currentSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    await reviewPptOutlineApi(currentSessionId.value, { action: 'revise', instructions })
    const snapshot = await pollSessionUntilActionable(
      currentSessionId.value,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '修改大纲失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

async function reviseDraft(instructions) {
  if (!currentSessionId.value) return
  const sessionId = currentSessionId.value
  const previousVersions = getDraftVersions(getDraftActionMessage(sessionId))
  const previousSignature = getLatestDraftSignature(previousVersions)
  const thinkingIndex = appendThinkingMessage()
  try {
    await revisePptDraftApi(sessionId, { instructions })
    const { snapshot, draft, versions } = await waitForDraftVersionUpdate(
      sessionId,
      previousSignature,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    updateCurrentSession(snapshot)
    markSessionCardsSubmitted(sessionId)
    await finishThinkingMessage(
      thinkingIndex,
      '新的优化版本已经生成，旧版本仍然保留。你可以分别预览每一版，继续用自然语言修改，或直接导出最终结果。'
    )
    upsertDraftActionMessage({
      role: 'ai',
      type: 'draft-actions',
      sessionId,
      taskId: draft.taskId,
      previewPayload: draft.previewPayload,
      downloadUrl: draft.downloadUrl,
      versions,
      isSubmitted: false,
    }, { moveToLatest: true })
    focusLatestMessage()
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '修改失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

async function finalizeCurrentSession(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({ role: 'user', type: 'text', content: '导出最终结果' })
  focusLatestMessage()

  const thinkingIndex = appendThinkingMessage()
  try {
    await finalizePptApi(actionMessage.sessionId)
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    const message = getUserFacingErrorMessage(error, '导出最终结果失败。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function generateAfterClassHomework(actionMessage) {
  const sessionId = actionMessage?.sessionId || currentSessionId.value || ''
  if (!sessionId) {
    ElMessage.warning('当前没有可用的 sessionId')
    return
  }
  if (isSubmitting.value) return

  isSubmitting.value = true
  const thinkingIndex = appendThinkingMessage()
  patchMessage(thinkingIndex, {
    progressTitle: '正在生成课后作业',
    progressSubtitle: '我会基于当前初版生成课后作业文档，不会改动既有课件版本。',
    progressBadge: '处理中',
    progressSteps: [
      { label: '提交任务', state: 'active' },
      { label: '生成文档', state: 'pending' },
      { label: '整理链接', state: 'pending' },
      { label: '完成', state: 'pending' },
    ],
  })

  try {
    const result = await generateAfterClassHomeworkApi(sessionId, { action: 'generate' })
    const data = unwrapData(result)
    const downloadUrls = data.downloadUrls || data.download_urls || data.minio_download_urls || {}
    let homeworkArtifact = buildAfterClassHomeworkArtifact(downloadUrls, sessionId, data.artifacts || {})
    let links = extractArtifactLinks(downloadUrls, data.artifacts || {}).filter((item) =>
      String(item.label || '').includes('课后作业')
    )

    finishThinkingMessage(thinkingIndex, '课后作业已生成完成，可以下载查看。')
    if (homeworkArtifact?.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId,
        content: homeworkArtifact.displayName,
        description: homeworkArtifact.description,
        previewPayload: homeworkArtifact.previewPayload,
        fileUrl: homeworkArtifact.fileUrl,
        previewType: homeworkArtifact.previewType,
        fileBadge: homeworkArtifact.fileBadge,
      })
    }
    if (links.length) {
      messages.value.push({
        role: 'ai',
        type: 'artifact-links',
        title: '课后作业文档',
        links,
      })
    } else {
      try {
        const fetched = await fetchAfterClassHomeworkApi(sessionId)
        const fetchedData = unwrapData(fetched)
        const fetchedUrls =
          fetchedData.downloadUrls ||
          fetchedData.download_urls ||
          fetchedData.minio_download_urls ||
          {}
        homeworkArtifact = buildAfterClassHomeworkArtifact(
          fetchedUrls,
          sessionId,
          fetchedData.artifacts || {}
        )
        const fetchedLinks = extractArtifactLinks(fetchedUrls, fetchedData.artifacts || {}).filter((item) =>
          String(item.label || '').includes('课后作业')
        )
        if (homeworkArtifact?.previewPayload) {
          messages.value.push({
            role: 'ai',
            type: 'file',
            sessionId,
            content: homeworkArtifact.displayName,
            description: homeworkArtifact.description,
            previewPayload: homeworkArtifact.previewPayload,
            fileUrl: homeworkArtifact.fileUrl,
            previewType: homeworkArtifact.previewType,
            fileBadge: homeworkArtifact.fileBadge,
          })
        }
        if (fetchedLinks.length) {
          messages.value.push({
            role: 'ai',
            type: 'artifact-links',
            title: '课后作业文档',
            links: fetchedLinks,
          })
        }
      } catch (error) {
        console.warn('after-class-homework fetch failed:', error)
      }
    }
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '生成课后作业失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
    focusLatestMessage()
  }
}

async function triggerDigitalHumanGeneration(instructions = '', options = {}) {
  const sessionId = options.sessionId || currentSessionId.value || ''
  if (!sessionId) {
    ElMessage.warning('当前还没有可继续使用的 PPT 内容，请先完成一次 PPT 生成')
    return
  }

  const prompt = String(instructions || '').trim()

  if (options.actionMessage) {
    options.actionMessage.isSubmitted = true
  }

  const thinkingIndex = appendThinkingMessage()
  patchMessage(thinkingIndex, {
    progressTitle: '正在生成数字人',
    progressSubtitle: '我会基于当前已经完成的 PPT 继续生成数字人讲解，不会开启新的生成流程。',
    progressBadge: '处理中',
    progressSteps: [
      { label: '提交任务', state: 'active' },
      { label: '等待结果', state: 'pending' },
      { label: '整理产物', state: 'pending' },
      { label: '返回下载', state: 'pending' },
    ],
    progressTip: '如果接口支持异步处理，这里会自动轮询数字人任务状态。',
  })

  try {
    const payload = {
      trigger_prompt: prompt,
      instructions: prompt,
      prompt,
    }
    const submitResult = await createPptDigitalHumanApi(sessionId, payload)
    patchMessage(thinkingIndex, {
      progressSteps: [
        { label: '提交任务', state: 'done' },
        { label: '等待结果', state: 'active' },
        { label: '整理产物', state: 'pending' },
        { label: '返回下载', state: 'pending' },
      ],
    })
    const result = await waitForDigitalHumanResult(sessionId, submitResult)
    if (['failed', 'error', 'cancelled', 'canceled'].includes(result.status)) {
      throw new Error(result.message || '数字人生成失败，请稍后重试')
    }
    finishThinkingMessage(
      thinkingIndex,
      result.message || '数字人任务已完成，我已经把可下载的产物整理到聊天里了。'
    )
    const links = extractDigitalHumanLinks(result.downloadUrls)
    if (links.length) {
      messages.value.push({
        role: 'ai',
        type: 'artifact-links',
        title: '数字人产物',
        links,
      })
    }
    if (options.actionMessage) {
      options.actionMessage.hasGenerated = true
    }
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '数字人生成失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  } finally {
    if (options.actionMessage) {
      options.actionMessage.isSubmitted = false
    }
    focusLatestMessage()
  }
}

function selectDigitalHumanChoice(actionMessage, choice) {
  actionMessage.choice = choice
  if (choice === 'no') {
    actionMessage.prompt = ''
  }
}

async function generateDigitalHuman(actionMessage) {
  const prompt = String(actionMessage?.prompt || inputText.value || '').trim() || '请基于当前 PPT 生成数字人讲解视频。'
  await triggerDigitalHumanGeneration(prompt, {
    sessionId: actionMessage?.sessionId,
    actionMessage,
  })
}

function triggerFileInput() {
  if (fileInputRef.value) {
    isFileSelecting.value = true
    fileInputRef.value.click()
    // 如果用户点击取消，handleFileSelect 不会触发，通过 focus 事件清除状态
    const onWindowFocus = () => {
      isFileSelecting.value = false
      window.removeEventListener('focus', onWindowFocus)
    }
    window.addEventListener('focus', onWindowFocus)
  }
}

function resolveAttachmentType(file) {
  const mimeType = String(file?.type || '').toLowerCase()
  const fileName = String(file?.name || '').toLowerCase()
  if (mimeType.startsWith('audio/') || /\.(wav|mp3|m4a|aac|ogg|webm)$/i.test(fileName)) {
    return 'audio'
  }
  return 'document'
}

function updatePendingAttachment(localId, updates) {
  pendingAttachments.value = pendingAttachments.value.map((item) =>
    item.localId === localId ? { ...item, ...updates } : item
  )
}

function removePendingAttachment(localId) {
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.localId !== localId)
}

function getAttachmentSendBlockMessage(hasAttachments = pendingAttachments.value.length > 0) {
  if (!hasAttachments) return ''
  if (currentPhase.value === 'poll') {
    return 'The current session is still processing. Your audio attachment has been kept for later.'
  }
  if (currentPhase.value === 'clarification') {
    return 'Please finish the clarification questions first. Your audio attachment has been kept for later.'
  }
  if (currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review') {
    return 'This review step only accepts text instructions. Your audio attachment has been kept for later.'
  }
  return ''
}

async function uploadPendingAttachment(file, attachmentType = resolveAttachmentType(file)) {
  const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const attachment = {
    localId,
    type: attachmentType === 'audio' ? 'audio' : 'document',
    name: file.name,
    size: file.size,
    status: 'uploading',
    uploadId: '',
  }
  pendingAttachments.value.push(attachment)

  try {
    const response = await uploadPptAttachmentApi(file, {
      asset_type: attachmentType === 'audio' ? 'audio' : 'document',
    })
    const result = normalizeUploadResult(response)
    if (!result.uploadId) {
      throw new Error('Upload succeeded but upload_id is missing')
    }
    updatePendingAttachment(localId, {
      status: 'done',
      uploadId: result.uploadId,
      name: result.fileName || attachment.name,
      assetType: result.assetType,
      role: result.role,
    })
    ElMessage.success('Attachment uploaded successfully')
  } catch (error) {
    removePendingAttachment(localId)
    ElMessage.error(getUserFacingErrorMessage(error, '文件上传失败，请稍后重试。'))
    throw error
  }
}

async function handleFileSelect(event) {
  isFileSelecting.value = false
  const input = event.target
  if (!input.files?.length) return
  const file = input.files[0]

  try {
    await uploadPendingAttachment(file)
  } catch (error) {
  } finally {
    input.value = ''
  }
}
function removeAttachment(index) {
  pendingAttachments.value.splice(index, 1)
}

function isNearChatBottom(threshold = 96) {
  const el = chatListRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

function handleChatScroll() {
  shouldAutoScroll.value = isNearChatBottom(120)
}

function scrollToBottom(options = {}) {
  const force = Boolean(options.force)
  if (!force) return
  nextTick(() => {
    if (!chatListRef.value) return
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    shouldAutoScroll.value = true
  })
}

function focusLatestMessage() {
  nextTick(() => {
    const el = chatListRef.value
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    })
    shouldAutoScroll.value = true
  })
}

async function handleSend(options = {}) {
  const allowDuringRecordingBusy = Boolean(options?.allowDuringRecordingBusy)

  if (currentSessionId.value && isGreetingOnlyConversation(messages.value)) {
    currentSessionId.value = ''
    currentSessionSnapshot.value = null
  }

  const prompt = inputText.value.trim()
  const hasAttachments = pendingAttachments.value.length > 0
  const hasAudioAttachments = pendingAttachments.value.some((item) => item.type === 'audio')
  const hasMissingUploadId = pendingAttachments.value.some(
    (item) => !(item.uploadId || item.upload_id)
  )

  if (
    !prompt &&
    !hasAttachments &&
    !activeClarificationMessage.value &&
    !activeDigitalHumanActionMessage.value
  )
    return

  if (isListening.value) {
    ElMessage.warning('请先停止语音识别，再发送。')
    return
  }

  if (isRecordingBusy.value && !allowDuringRecordingBusy) {
    ElMessage.warning('语音识别正在启动，请稍等片刻。')
    return
  }

  if (uploadedPending.value) {
    ElMessage.warning('Attachments are still uploading. Please wait before sending.')
    return
  }

  const attachmentSendBlockMessage = getAttachmentSendBlockMessage(hasAttachments)
  if (attachmentSendBlockMessage) {
    ElMessage.warning(attachmentSendBlockMessage)
    return
  }

  if (activeClarificationMessage.value) {
    const actionMessage = activeClarificationMessage.value
    messages.value.push({
      role: 'user',
      type: 'text',
      content: prompt || '按推荐继续',
      attachments: [],
    })
    inputText.value = ''
    focusLatestMessage()
    await submitNaturalLanguageClarification(actionMessage, prompt)
    return
  }

  if (activeDigitalHumanActionMessage.value) {
    const actionMessage = activeDigitalHumanActionMessage.value
    const digitalHumanPrompt = prompt || '请基于当前 PPT 生成数字人讲解视频。'
    messages.value.push({ role: 'user', type: 'text', content: digitalHumanPrompt, attachments: [] })
    inputText.value = ''
    focusLatestMessage()
    await triggerDigitalHumanGeneration(digitalHumanPrompt, {
      sessionId: currentSessionId.value,
      actionMessage,
    })
    return
  }

  if (hasAttachments && !prompt && !hasAudioAttachments) {
    ElMessage.warning('Please enter text first, then send it together with the uploaded files.')
    return
  }

  if (currentSessionId.value && hasAttachments) {
    if (hasMissingUploadId) {
      ElMessage.warning('Attachment is missing upload_id. Please re-upload and try again.')
      return
    }
    if (currentPhase.value === 'poll') {
      ElMessage.warning(
        'The current session is still processing. Please wait before sending more files.'
      )
      return
    }

    const attachments = [...pendingAttachments.value]
    messages.value.push({
      role: 'user',
      type: 'text',
      content:
        prompt ||
        (hasAudioAttachments
          ? 'Please use my uploaded audio instructions in the current session.'
          : 'Please add the uploaded files to the current session and use them in follow-up processing.'),
      attachments,
    })
    inputText.value = ''
    quotedLessonData.value = null
    pendingAttachments.value = []
    focusLatestMessage()
    await appendAssetsToCurrentSession(prompt, attachments)
    return
  }

  if (currentPhase.value === 'clarification') return

  if (
    currentPhase.value !== 'outline_review' &&
    currentPhase.value !== 'draft_review' &&
    !prompt &&
    !hasAttachments
  ) {
    ElMessage.warning('Please enter a prompt or upload reference files first.')
    return
  }

  if (hasMissingUploadId) {
    ElMessage.warning('Attachment is missing upload_id. Please re-upload and try again.')
    return
  }

  if (currentSessionId.value && currentPhase.value === 'poll') {
    ElMessage.warning(
      'The current session is still processing. Please wait for it to finish first.'
    )
    return
  }

  if (
    currentPhase.value === 'completed' &&
    currentSessionId.value &&
    !hasAttachments &&
    isDigitalHumanIntent(prompt)
  ) {
    messages.value.push({ role: 'user', type: 'text', content: prompt, attachments: [] })
    inputText.value = ''
    focusLatestMessage()
    await triggerDigitalHumanGeneration(prompt, { sessionId: currentSessionId.value })
    return
  }

  if (currentSessionId.value && ['idle', 'completed', 'failed'].includes(currentPhase.value)) {
    ElMessage.warning(
      'This conversation has finished its current generation flow. Start a new chat for a new topic.'
    )
    return
  }

  if (
    !quotedLessonData.value &&
    !currentSessionId.value &&
    currentCourseDesignSessionId.value &&
    courseDesignPanel.value &&
    prompt
  ) {
    messages.value.push({ role: 'user', type: 'text', content: prompt, attachments: [] })
    inputText.value = ''
    focusLatestMessage()
    await reviseCourseDesignPlan(prompt)
    return
  }

  const attachments =
    currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review'
      ? []
      : [...pendingAttachments.value]
  const selectedLesson = quotedLessonData.value ? { ...quotedLessonData.value } : null
  const effectivePrompt = selectedLesson ? buildQuotedLessonPrompt(selectedLesson) : prompt

  messages.value.push({
    role: 'user',
    type: 'text',
    content:
      effectivePrompt ||
      (hasAudioAttachments
        ? 'Please generate a PPT based on my uploaded audio instructions.'
        : 'Please generate a PPT based on the uploaded materials.'),
    attachments,
    quotedLesson: selectedLesson
      ? {
          courseName: selectedLesson.courseName,
          lessonTitle: selectedLesson.lessonTitle,
          hours: selectedLesson.hours,
        }
      : null,
  })
  inputText.value = ''
  quotedLessonData.value = null
  if (currentPhase.value !== 'outline_review' && currentPhase.value !== 'draft_review') {
    pendingAttachments.value = []
  }
  focusLatestMessage()

  if (currentPhase.value === 'outline_review') {
    await reviseOutline(effectivePrompt)
    return
  }
  if (currentPhase.value === 'draft_review') {
    await reviseDraft(effectivePrompt)
    return
  }
  if (isCourseDesignIntent(effectivePrompt) && !selectedLesson) {
    await createCourseDesignFromPrompt(effectivePrompt)
    return
  }
  if (selectedLesson?.mode === 'single-lesson-ppt') {
    currentCourseDesignSessionId.value = ''
    currentCourseDesignSnapshot.value = null
  }
  await createSessionFromPrompt(effectivePrompt, attachments)
}

function fillSuggestion(value) {
  inputText.value = value
}

function openExternalLink(url) {
  if (!url) {
    ElMessage.warning('下载地址缺失')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function downloadArtifactLink(link) {
  if (!link?.url) {
    ElMessage.warning('下载地址缺失')
    return
  }

  if (link.kind === 'html') {
    openExternalLink(link.url)
    return
  }

  const fileName = link.fileName || getArtifactDownloadFileName(link.url, 'download', link.kind)
  try {
    const response = await fetch(link.url)
    if (!response.ok) throw new Error(`download failed: ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.warn('artifact download fallback:', error)
    openExternalLink(link.url)
  }
}

function selectCourseDesignLesson(lesson) {
  selectedCourseDesignLessonKey.value = lesson?.key || ''
}

function useCourseDesignLesson(lesson) {
  if (!courseDesignPanel.value || !lesson) return
  handleQuoteLesson({
    courseDesignId: courseDesignPanel.value.id,
    lessonKey: lesson.key,
    courseName: courseDesignPanel.value.title,
    lessonTitle: lesson.title,
    hours: lesson.hourIndex ? `第 ${lesson.hourIndex} 学时` : '1学时',
    mode: 'single-lesson-ppt',
    lesson,
    plan: courseDesignPanel.value,
  })
  ElMessage.success('已把这一节课的概要放入输入框')
}

function handleStartCourseDesign() {
  currentPreviewType.value = 'course-design'
  currentPreviewConfig.value = null
  previewError.value = ''
  previewLoading.value = false
  if (!courseDesignPanel.value) {
    inputText.value =
      '我是一个高中普及人工智能通识教育的教师，总共需要16学时的课程，请为我安排每节课课时的教学设计。每节课需要包含主题、目标、主要要点、教师活动、学生活动、评价方式和课后任务。'
    ElMessage.info('已填入整门课程设计需求，发送后会在右侧展示总体设计')
  }
}

function handleDeleteCourseDesign(courseId) {
  const matchesCurrent = String(courseDesignPanel.value?.id || '') === String(courseId)
  const matchesLast = String(lastCourseDesignPanel.value?.id || '') === String(courseId)
  if (matchesCurrent) {
    courseDesignPanel.value = null
    currentPreviewType.value = 'ppt'
    currentPreviewKey.value = ''
  }
  if (matchesLast) {
    lastCourseDesignPanel.value = null
  }
  if (String(currentCourseDesignSessionId.value || '') === String(courseId)) {
    currentCourseDesignSessionId.value = ''
    currentCourseDesignSnapshot.value = null
  }
  if (quotedLessonData.value?.courseDesignId && String(quotedLessonData.value.courseDesignId) === String(courseId)) {
    cancelQuote()
  }
}

async function createCourseDesignFromPrompt(prompt) {
  const thinkingIndex = appendThinkingMessage()
  try {
    const response = await createCourseDesignSessionApi({
      user_input: prompt,
      user_assets: [],
      session_options: {
        session_id: `course_design_${Date.now()}`,
      },
    })
    const snapshot = normalizeCourseDesignSnapshot(response)
    if (!snapshot.sessionId) throw new Error('课程设计任务未返回 session_id')
    currentCourseDesignSessionId.value = snapshot.sessionId
    startCourseDesignProgressPolling(snapshot.sessionId)
    const finalSnapshot = await pollCourseDesignUntilActionable(
      snapshot.sessionId,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildCourseDesignProgressPatch(current, startedAt, round))
      }
    )
    await presentCourseDesignState(finalSnapshot, thinkingIndex)
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '课程设计生成失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

async function reviseCourseDesignPlan(instructions) {
  if (!currentCourseDesignSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    const response = await reviewCourseDesignPlanApi(currentCourseDesignSessionId.value, {
      action: 'revise',
      instructions,
    })
    const data = unwrapData(response)
    if (data.plan_preview || data.planPreview) {
      await fetchAndShowCourseDesignPlan(currentCourseDesignSessionId.value)
      await finishThinkingMessage(thinkingIndex, '课程设计已按你的意见更新，右侧是最新版本。')
      focusLatestMessage()
      return
    }
    startCourseDesignProgressPolling(currentCourseDesignSessionId.value)
    const finalSnapshot = await pollCourseDesignUntilActionable(
      currentCourseDesignSessionId.value,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildCourseDesignProgressPatch(current, startedAt, round))
      }
    )
    await presentCourseDesignState(finalSnapshot, thinkingIndex)
  } catch (error) {
    const message = getUserFacingErrorMessage(error, '修改课程设计失败，请稍后重试。')
    finishThinkingMessage(thinkingIndex, message)
    ElMessage.error(message)
  }
}

// 处理 @知识库
function handleMention(kbName, isChecked) {
  if (isChecked) {
    const currentText = inputText.value.trim()
    inputText.value = currentText ? `${currentText} @${kbName} ` : `@${kbName} `
  } else {
    // 动态生成正则，匹配对应的 @知识库名称 及后面可能跟的空格，将其替换为空
    const regex = new RegExp(`@${kbName}\\s*`, 'g')
    inputText.value = inputText.value.replace(regex, '')
  }
}

// 处理置顶
function handlePinHistory(id) {
  const index = historyList.value.findIndex((entry) => entry.id === id)
  if (index > 0) {
    const [item] = historyList.value.splice(index, 1)
    historyList.value.unshift(item)
    persistHistory()
    ElMessage.success('已置顶')
  }
}

// 处理重命名
function handleRenameHistory(item) {
  ElMessageBox.prompt('请输入新的对话名称', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: item.title,
  })
    .then(({ value }) => {
      if (value.trim()) {
        item.title = value.trim()
        persistHistory()
        ElMessage.success('重命名成功')
      }
    })
    .catch(() => {})
}
async function openPreview(payload, options = {}) {
  const sessionId = options.sessionId || currentSessionId.value || ''
  const taskId = options.taskId || ''
  const fallbackFileUrl = options.fileUrl || options.downloadUrl || ''
  const source = payload && typeof payload === 'object' ? unwrapData(payload) : payload
  const previewType = options.previewType || inferPreviewType(source, options.fileName)

  previewLoading.value = true
  previewError.value = ''
  currentPreviewConfig.value = null
  courseDesignPanel.value = null
  currentPreviewType.value = previewType

  try {
    if (source?.editorConfig && (source.apiJsUrl || source.documentServerUrl)) {
      currentPreviewConfig.value = source
    } else if (previewType === 'document' && source && typeof source === 'object') {
      currentPreviewConfig.value = source
    } else if (previewType === 'document' && typeof source === 'string') {
      currentPreviewConfig.value = buildDocumentPreviewPayload(source, {
        fileName: options.fileName || 'document.docx',
        sessionId,
        phase: 'preview',
      })
    } else if (source && typeof source === 'object') {
      currentPreviewConfig.value = source
    } else if (sessionId) {
      currentPreviewConfig.value = buildSessionPreviewPayload(sessionId, {
        fileName: options.fileName || 'generated.pptx',
        taskId,
      })
    } else if (taskId) {
      currentPreviewConfig.value = {
        previewSource: 'ppt-task-onlyoffice',
        taskId,
        fileName: options.fileName || 'generated.pptx',
      }
    } else {
      currentPreviewConfig.value =
        typeof source === 'string'
          ? previewType === 'document'
            ? buildDocumentPreviewPayload(source, {
                fileName: options.fileName || 'document.docx',
                sessionId,
                phase: 'preview',
              })
            : buildDirectPreviewPayload(source, { fileName: options.fileName || 'generated.pptx' })
          : null
    }

    if (!currentPreviewConfig.value) {
      throw new Error('未找到可用的预览配置。')
    }

    currentPreviewKey.value =
      currentPreviewConfig.value.fileId ||
      currentPreviewConfig.value.sessionId ||
      currentPreviewConfig.value.taskId ||
      currentPreviewConfig.value.directDownloadUrl ||
      `${previewType}-${Date.now()}`
  } catch (error) {
    currentPreviewConfig.value = null
    previewError.value = getPreviewError(error)
  } finally {
    previewLoading.value = false
  }
}

function closePreview() {
  if (currentPreviewType.value === 'course-design' && courseDesignPanel.value) {
    lastCourseDesignPanel.value = courseDesignPanel.value
  }
  currentPreviewConfig.value = null
  courseDesignPanel.value = null
  currentPreviewType.value = 'ppt'
  currentPreviewKey.value = ''
  previewLoading.value = false
  previewError.value = ''
}

function createConversation(overrides = {}) {
  const timestamp = Date.now()
  return {
    id: `chat-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    title: '新对话',
    sessionId: '',
    sessionState: null,
    messagesData: [createGreetingMessage()],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function getConversationTitle(messagesData, fallback = '新对话') {
  const normalizeTitle = (value) => cleanText(String(value || '').replace(/\n+/g, ' '))
  const firstUserMessage = messagesData.find((item) => item.role === 'user' && item.content)
  const firstFileMessage = messagesData.find((item) => item.type === 'file' && item.content)

  const candidates = [firstUserMessage?.content, firstFileMessage?.content]
    .map(normalizeTitle)
    .filter(Boolean)

  const title = candidates[0] || ''
  if (!title) return fallback
  return title.length > 22 ? `${title.slice(0, 22)}...` : title
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historyList.value))
}

function syncActiveConversation() {
  if (!activeConversationId.value) return
  const target = historyList.value.find((item) => item.id === activeConversationId.value)
  if (!target) return
  target.messagesData = cloneDeep(messages.value)
  target.sessionId = currentSessionId.value || ''
  target.sessionState = cloneDeep(currentSessionSnapshot.value)
  target.title = getConversationTitle(messages.value, target.title)
  target.updatedAt = Date.now()
  historyList.value = [...historyList.value]
  persistHistory()
}

function restoreConversation(conversation) {
  const normalizedConversation = normalizeConversationRecord(conversation)
  conversation.messagesData = cloneDeep(normalizedConversation.messagesData)
  conversation.sessionId = normalizedConversation.sessionId || ''
  conversation.sessionState = cloneDeep(normalizedConversation.sessionState || null)

  activeConversationId.value = conversation.id
  messages.value = cloneDeep(conversation.messagesData)
  currentSessionId.value = conversation.sessionId
  currentSessionSnapshot.value = cloneDeep(conversation.sessionState)
  pendingAttachments.value = []
  inputText.value = ''
  closePreview()
  cancelListening()
  scrollToBottom({ force: true })
}

function loadConversations() {
  if (route.query.clearHistory === '1') {
    localStorage.removeItem(STORAGE_KEY)
    const first = createConversation()
    historyList.value = [first]
    restoreConversation(first)
    persistHistory()
    router.replace({ path: route.path, query: { ...route.query, clearHistory: undefined } })
    ElMessage.success('历史记录已清空')
    return
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(parsed) && parsed.length) {
      historyList.value = parsed
        .map((item) => ({
          ...createConversation(),
          ...item,
          messagesData:
            Array.isArray(item.messagesData) && item.messagesData.length
              ? item.messagesData
              : [createGreetingMessage()],
        }))
        .map((item) => normalizeConversationRecord(item))
        .map((item) => ({
          ...item,
          title: getConversationTitle(item.messagesData, item.title || '新对话'),
        }))
    }
  } catch {
    historyList.value = []
  }

  if (!historyList.value.length) {
    const first = createConversation()
    historyList.value = [first]
    restoreConversation(first)
    persistHistory()
    return
  }

  const routeChatId = route.query.chatId ? String(route.query.chatId) : ''
  const target = historyList.value.find((item) => item.id === routeChatId) || historyList.value[0]
  restoreConversation(target)
}

const isCreatingNewChat = ref(false)

function startNewChat() {
  if (isCreatingNewChat.value) return
  isCreatingNewChat.value = true

  // 如果当前已经是空对话，不再重复创建
  const current = historyList.value.find((item) => item.id === activeConversationId.value)
  if (current && isGreetingOnlyConversation(current.messagesData)) {
    isCreatingNewChat.value = false
    return
  }

  const conversation = createConversation()
  historyList.value = [conversation, ...historyList.value]
  restoreConversation(conversation)
  persistHistory()

  setTimeout(() => {
    isCreatingNewChat.value = false
  }, 300)
}

function handleLoadHistory(item) {
  const target = historyList.value.find((entry) => entry.id === item.id) || item
  restoreConversation(target)
}

function deleteConversation(payload) {
  // 核心修复：兼容传入的是完整 item 对象还是直接传入 id
  const targetId = typeof payload === 'object' ? payload.id : payload
  const deleteIndex = historyList.value.findIndex((entry) => entry.id === targetId)
  if (deleteIndex < 0) return

  const isDeletingActive = activeConversationId.value === targetId
  const nextCandidate =
    historyList.value[deleteIndex + 1] || historyList.value[deleteIndex - 1] || null

  historyList.value = historyList.value.filter((entry) => entry.id !== targetId)

  if (!historyList.value.length) {
    const fallbackConversation = createConversation()
    historyList.value = [fallbackConversation]
    restoreConversation(fallbackConversation)
    persistHistory()
    return
  }

  if (isDeletingActive && nextCandidate) {
    const target =
      historyList.value.find((entry) => entry.id === nextCandidate.id) || historyList.value[0]
    restoreConversation(target)
  }

  persistHistory()
}

function toggleListening() {
  if (isRecordingBusy.value) {
    ElMessage.warning('语音识别正在启动，请稍等...')
    return
  }

  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

function cancelListening() {
  voiceStopRequested = true
  if (speechRecognition) {
    speechRecognition.abort()
  }
  isListening.value = false
  isRecordingBusy.value = false
  speechRecognition = null
  voiceInterimTranscript.value = ''
  voiceFinalTranscript = ''
  voiceStatusText.value = '点击后开始实时识别'
}

function startListening() {
  if (isListening.value || isRecordingBusy.value) return

  const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!RecognitionConstructor) {
    ElMessage.warning('当前浏览器不支持实时语音识别，请使用 Chrome 或 Edge 访问。')
    return
  }

  isRecordingBusy.value = true
  voiceInputBaseText = inputText.value
  voiceFinalTranscript = ''
  voiceInterimTranscript.value = ''
  voiceStatusText.value = '正在连接麦克风...'
  voiceStopRequested = false

  const recognition = new RecognitionConstructor()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    speechRecognition = recognition
    isListening.value = true
    isRecordingBusy.value = false
    voiceStatusText.value = '正在识别，说完后点“停止识别”'
  }

  recognition.onresult = (event) => {
    let finalText = ''
    let interimText = ''

    for (let index = 0; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript || ''
      if (event.results[index].isFinal) {
        finalText += transcript
      } else {
        interimText += transcript
      }
    }

    voiceFinalTranscript = finalText
    voiceInterimTranscript.value = interimText.trim()
    syncSpeechTextToInput()
    voiceStatusText.value = voiceInterimTranscript.value ? '正在转写...' : '正在聆听...'
  }

  recognition.onerror = (event) => {
    const messageMap = {
      'not-allowed': '麦克风权限未开启，无法进行语音识别。',
      'service-not-allowed': '浏览器语音识别服务不可用。',
      'no-speech': '没有识别到语音，请再试一次。',
      network: '语音识别网络连接失败，请稍后重试。',
    }
    const message = messageMap[event.error] || '语音识别失败，请重试。'
    voiceStatusText.value = message
    ElMessage.warning(message)
  }

  recognition.onend = () => {
    const hadSpeech = Boolean((voiceFinalTranscript + voiceInterimTranscript.value).trim())
    finalizeSpeechText()
    isListening.value = false
    isRecordingBusy.value = false
    speechRecognition = null
    voiceStatusText.value = '点击后开始实时识别'

    if (hadSpeech && !voiceStopRequested) {
      ElMessage.success('语音已自动填入输入框。')
    }
  }

  try {
    recognition.start()
  } catch (error) {
    isListening.value = false
    isRecordingBusy.value = false
    speechRecognition = null
    voiceStatusText.value = '点击后开始实时识别'
    ElMessage.warning(getUserFacingErrorMessage(error, '语音识别启动失败，请重试。'))
  }
}

function stopListening() {
  if (!isListening.value && !isRecordingBusy.value) {
    finalizeSpeechText()
    return
  }

  voiceStopRequested = true
  voiceStatusText.value = '正在结束识别...'

  if (speechRecognition) {
    speechRecognition.stop()
  } else {
    finalizeSpeechText()
    isListening.value = false
    isRecordingBusy.value = false
  }
}

function syncSpeechTextToInput() {
  const transcript = `${voiceFinalTranscript}${voiceInterimTranscript.value}`.trim()
  inputText.value = mergeSpeechWithBaseText(voiceInputBaseText, transcript)
}

function finalizeSpeechText() {
  const transcript = `${voiceFinalTranscript}${voiceInterimTranscript.value}`.trim()
  if (transcript) {
    inputText.value = mergeSpeechWithBaseText(voiceInputBaseText, transcript)
  }
  voiceInputBaseText = inputText.value
  voiceFinalTranscript = ''
  voiceInterimTranscript.value = ''
}

function mergeSpeechWithBaseText(baseText, transcript) {
  const normalizedTranscript = String(transcript || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalizedTranscript) return baseText

  const normalizedBase = String(baseText || '').replace(/\s+$/g, '')
  if (!normalizedBase) return normalizedTranscript

  const needsSpace =
    /[a-zA-Z0-9]$/.test(normalizedBase) && /^[a-zA-Z0-9]/.test(normalizedTranscript)
  return `${normalizedBase}${needsSpace ? ' ' : ''}${normalizedTranscript}`
}

watch(
  [messages, currentSessionId, currentSessionSnapshot, activeConversationId],
  syncActiveConversation,
  {
    deep: true,
  }
)

watch([sidebarOpen, showPreviewRegion], () => {
  syncPreviewWidthWithinViewport()
})

function handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    startNewChat()
  }
}

onMounted(() => {
  loadConversations()
  loadQuotedLessonFromRoute()
  syncPreviewWidthWithinViewport()
  window.addEventListener('resize', syncPreviewWidthWithinViewport)
  window.addEventListener('keydown', handleKeydown)
  scrollToBottom({ force: true })
})

watch(
  () => [route.query.courseDesignId, route.query.lessonKey],
  () => {
    loadQuotedLessonFromRoute()
  }
)

onBeforeUnmount(() => {
  cancelListening()
  stopPreviewResize()
  stopProgressStreamPolling()
  stopThoughtTypewriter()
  stopThinkingElapsedTimer()
  window.removeEventListener('resize', syncPreviewWidthWithinViewport)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.chat-app-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
  background: #fff;
}

.chat-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 420px;
  position: relative;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 30px 30px 260px;
  scroll-padding-bottom: 260px;
}

.message {
  display: flex;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto 30px;
}

.message-user {
  justify-content: flex-end;
}

.message-wrapper {
  max-width: 82%;
}

.message-ai .message-wrapper:has(.outline-review-card) {
  width: 100%;
  max-width: 100%;
}

.user-content-wrapper {
  background: #eff3fd;
  border-radius: 14px 4px 14px 14px;
  padding: 12px;
}

.text-content,
.ai-text {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
}

.content {
  margin-top: 10px;
}

.ai-text,
.form-card,
.file-card {
  background: #fff;
  border: 1px solid #e9edf3;
  border-radius: 16px;
  box-shadow: 0 8px 26px rgba(20, 33, 61, 0.04);
}

.ai-text {
  padding: 14px 18px;
}

.msg-attachments,
.selected-attachments,
.draft-action-row,
.artifact-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.draft-version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draft-version-item {
  border: 1px solid #e8eef8;
  border-radius: 14px;
  background: #f8fbff;
  padding: 14px;
}

.draft-version-meta {
  margin-bottom: 12px;
}

.draft-version-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.draft-version-title {
  font-size: 14px;
  font-weight: 800;
  color: #1f2d3d;
}

.draft-version-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eaf2ff;
  color: #1f4fd6;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
}

.draft-version-desc {
  margin-top: 6px;
  color: #66758c;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.draft-action-row--footer {
  margin-top: 16px;
  justify-content: flex-end;
}

.msg-attach-card,
.att-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e2e8f4;
  border-radius: 999px;
  padding: 8px 12px;
}

.att-tag .file-icon {
  font-size: 16px;
  color: #1677ff;
}

.att-tag .audio-icon {
  display: flex;
  align-items: center;
  color: #1677ff;
}

.att-tag .att-name {
  font-size: 13px;
  color: #1f2d3d;
  font-weight: 500;
}

.att-tag .remove-att {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.att-tag .remove-att:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.1);
}

.att-tag .remove-att:active {
  transform: scale(0.95);
}

.sent-quote-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.78);
  color: #40516c;
  font-size: 13px;
  line-height: 1.5;
}

.sent-quote-card strong {
  color: #1677ff;
}

.form-card {
  width: 100%;
  max-width: 560px;
  padding: 20px;
}

.form-group + .form-group {
  margin-top: 14px;
}

.form-group h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #1f2d3d;
}

.clarification-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.clarification-question h4 {
  margin: 0;
}

.clarification-picked {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f0f6ff;
  color: #4096ff;
  font-size: 12px;
  font-weight: 600;
}

.clarification-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #edf1f6;
}

.clarification-progress {
  display: flex;
  justify-content: flex-start;
  color: #66758c;
  font-size: 12px;
  font-weight: 500;
}

.clarification-progress-bar {
  height: 6px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f8;
}

.clarification-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8eb8ff, #1677ff);
  transition: width 0.24s ease;
}

.card-tip {
  color: #66758c;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 12px;
}

.clarification-card {
  width: min(100%, 560px);
  padding: 18px 20px;
}

.digital-human-card {
  width: min(100%, 520px);
  padding: 18px 20px;
}

.clarification-prompt {
  color: #2f4056;
  font-size: 15px;
  line-height: 1.75;
}

.clarification-example {
  margin-top: 12px;
  border-radius: 12px;
  background: #f7faff;
  color: #64758d;
  padding: 11px 13px;
  font-size: 13px;
  line-height: 1.7;
}

.card-tip--quiet {
  margin-top: 12px;
  margin-bottom: 0;
}

.card-tip--warning {
  color: #b54708;
  background: #fff4e5;
  border-radius: 12px;
  padding: 10px 12px;
}

.card-tip--success {
  color: #047857;
  background: #ecfdf3;
  border-radius: 12px;
  padding: 10px 12px;
}

.form-group--compact {
  margin-top: 14px;
}

.embedded-textarea {
  width: 100%;
  min-height: 84px;
  resize: vertical;
  border: 1px solid #d8e0ee;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.embedded-textarea:focus,
.input-wrapper textarea:focus {
  border-color: #1677ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.choice-btn {
  border: 1px solid #d9e2f2;
  background: #fff;
  color: #4c5f78;
  border-radius: 999px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.choice-btn:hover {
  border-color: rgba(64, 150, 255, 0.42);
  background: #f3f8ff;
  color: #1677ff;
}

.choice-btn.is-active {
  border-color: rgba(64, 150, 255, 0.5);
  background: #eaf4ff;
  color: #1677ff;
}

.choice-btn.is-muted.is-active {
  border-color: rgba(120, 134, 156, 0.24);
  background: #f1f4f8;
  color: #5f6c80;
}

.submit-form-btn,
.secondary-btn,
.artifact-link,
.send-btn,
.tool-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transform: translateY(0) scale(1);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease,
    color 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
}

.submit-form-btn::before,
.secondary-btn::before,
.artifact-link::before,
.send-btn::before,
.tool-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
  opacity: 0;
  transform: translateX(-18px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.submit-form-btn {
  background: #333;
  color: #fff;
  padding: 10px 18px;
}

.secondary-btn,
.artifact-link,
.tool-btn {
  background: transparent;
  color: #5f6368;
  padding: 6px 10px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  border-radius: 999px;
  font-size: 13px;
}

.tool-btn__icon {
  font-size: 15px;
  line-height: 1;
}

.tool-btn__svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  flex-shrink: 0;
}

.tool-btn__label {
  line-height: 1;
}

.artifact-link {
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.submit-form-btn:hover,
.secondary-btn:hover,
.artifact-link:hover,
.send-btn:hover,
.tool-btn:hover {
  transform: translateY(-1px);
}

.submit-form-btn:hover::before,
.secondary-btn:hover::before,
.artifact-link:hover::before,
.send-btn:hover::before,
.tool-btn:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.submit-form-btn:active,
.secondary-btn:active,
.artifact-link:active,
.send-btn:active,
.tool-btn:active {
  transform: translateY(1px) scale(0.985);
}

.tool-btn:active {
  background: #e6f4ff;
  color: #1677ff;
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.18), 0 4px 16px rgba(22, 119, 255, 0.12);
}

.submit-form-btn:disabled,
.secondary-btn:disabled,
.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.outline-review-card {
  width: min(100%, 980px);
  max-width: min(980px, calc(100vw - 120px));
  padding: 24px;
}

.outline-review-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.outline-review-head h4 {
  margin: 4px 0 0;
  font-size: 18px;
  color: #1f2d3d;
}

.outline-review-eyebrow {
  color: #1f4fd6;
  font-size: 12px;
  font-weight: 800;
}

.outline-review-count {
  flex-shrink: 0;
  border-radius: 999px;
  background: #eef4ff;
  color: #1f4fd6;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
}

.outline-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
  margin-bottom: 22px;
}

.outline-summary-item {
  border: 1px solid #e8eef8;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff, #f2f6fc);
  padding: 12px;
}

.outline-summary-value {
  display: block;
  color: #1f2d3d;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.outline-summary-label {
  display: block;
  margin-top: 6px;
  color: #66758c;
  font-size: 12px;
  font-weight: 700;
}

.outline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.outline-item {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e5edf8;
  border-radius: 14px;
  padding: 14px;
  min-height: 168px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.outline-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #1677ff, #79c4ff);
}

.outline-item:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 79, 214, 0.24);
  box-shadow: 0 12px 26px rgba(31, 79, 214, 0.08);
}

.outline-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.outline-page-badge,
.outline-point-count {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.outline-page-badge {
  background: #1f4fd6;
  color: #fff;
  padding: 7px 9px;
}

.outline-point-count {
  background: #eef3f8;
  color: #5d6b82;
  padding: 7px 9px;
}

.outline-title {
  min-height: 42px;
  font-size: 14px;
  font-weight: 800;
  color: #1f2d3d;
  line-height: 1.45;
}

.outline-bullets {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.outline-bullet {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  color: #5e6d82;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.outline-bullet::before {
  content: '';
  position: absolute;
  top: 0.7em;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1f4fd6;
}

.outline-more-bullets {
  align-self: flex-start;
  margin-top: 2px;
  border-radius: 999px;
  background: #edf4ff;
  color: #1f4fd6;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
}

.outline-empty {
  border: 1px dashed #d7dfec;
  border-radius: 12px;
  padding: 18px;
  color: #66758c;
  text-align: center;
}

.outline-expand-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.outline-expand-btn {
  border: 1px solid #dce6f5;
  border-radius: 999px;
  background: #fff;
  color: #1f4fd6;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.outline-expand-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 79, 214, 0.28);
  background: #f5f8ff;
}

.file-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 16px;
  width: min(360px, 100%);
  max-width: 100%;
  cursor: pointer;
  box-sizing: border-box;
}

.file-info {
  min-width: 0;
}

.file-cover {
  width: 56px;
  height: 56px;
  aspect-ratio: 1;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff7a45, #fa541c);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  box-sizing: border-box;
  overflow: hidden;
}

.file-cover--ppt {
  background: linear-gradient(135deg, #ff7a45, #fa541c);
}

.file-cover--document {
  background: linear-gradient(135deg, #5b8def, #3457d5);
}

.file-name {
  font-size: 14px;
  font-weight: 700;
  color: #24344d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #7a889d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f5f7fb;
  color: #35465f;
  cursor: pointer;
}

.chat-input-area {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 12;
  padding: 18px 30px 26px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), #fff 42%);
}

.input-wrapper {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid transparent;
  border-radius: 24px;
  padding: 14px 18px;
  pointer-events: auto;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
}

.input-wrapper:focus-within {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 8px 28px rgba(0, 0, 0, 0.05);
}

.input-wrapper textarea {
  width: 100%;
  border: none;
  resize: none;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  font-family: inherit;
  transition: color 0.2s ease;
}

.input-wrapper.is-recording {
  border-color: rgba(22, 119, 255, 0.4);
  box-shadow: 0 0 0 5px rgba(22, 119, 255, 0.08);
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.send-btn {
  background: #1677ff;
  color: #fff;
  border-radius: 999px;
  padding: 9px 24px;
  min-width: auto;
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
}

.send-btn:hover:not(:disabled) {
  box-shadow: none;
  filter: brightness(1.05);
}

.recording-active {
  background: #e6f4ff !important;
  color: #1677ff !important;
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.18), 0 4px 16px rgba(22, 119, 255, 0.12);
}

.mic-btn.recording-active {
  padding: 10px 14px;
}

.mic-wave {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  width: 28px;
  height: 18px;
  pointer-events: none;
}

.mic-wave span {
  width: 3px;
  border-radius: 999px;
  background: #1677ff;
  animation: mic-wave-bar 0.9s ease-in-out infinite;
  pointer-events: none;
}

.mic-wave span:nth-child(1) {
  height: 10px;
  animation-delay: 0s;
}

.mic-wave span:nth-child(2) {
  height: 16px;
  animation-delay: 0.15s;
}

.mic-wave span:nth-child(3) {
  height: 12px;
  animation-delay: 0.3s;
}

.mic-wave span:nth-child(4) {
  height: 18px;
  animation-delay: 0.1s;
}

.mic-wave span:nth-child(5) {
  height: 8px;
  animation-delay: 0.25s;
}

@keyframes mic-wave-bar {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.preview-resizer {
  width: 12px;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    rgba(237, 241, 246, 0),
    rgba(237, 241, 246, 0.92),
    rgba(237, 241, 246, 0)
  );
}

.preview-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
}

.preview-resizer__handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 56px;
  border-radius: 999px;
  background: #d7dfec;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.preview-resizer:hover .preview-resizer__handle,
.preview-resizer.is-dragging .preview-resizer__handle {
  background: #8fb3ff;
  box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
}

.preview-panel {
  flex-shrink: 0;
  min-width: 420px;
  border-left: 1px solid #edf1f6;
  background: #f5f7fb;
  overflow: hidden;
}

.preview-panel--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-panel__status-card {
  max-width: 420px;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(31, 79, 214, 0.14);
  background: linear-gradient(180deg, #f7faff, #eef4ff);
}

.preview-panel__status-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}

.preview-panel__status-text {
  margin-top: 12px;
  color: #5c6c83;
  line-height: 1.7;
}

.preview-panel__status-actions {
  margin-top: 18px;
}

.course-design-preview-panel {
  background: #f7f9fc;
  overflow-y: auto;
}

.course-design-panel {
  min-height: 100%;
  padding: 24px;
}

.course-design-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.course-design-panel__eyebrow {
  display: inline-block;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

.course-design-panel__head h3 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  line-height: 1.4;
}

.panel-close-btn {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 12px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.panel-close-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.course-design-panel__meta,
.course-design-objectives,
.course-design-lesson__points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.course-design-panel__meta {
  margin-bottom: 16px;
}

.course-design-panel__meta span,
.course-design-objectives span,
.course-design-lesson__points span {
  border-radius: 4px;
  padding: 6px 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  line-height: 1.4;
}

.course-design-objectives {
  padding: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 6px;
  margin-bottom: 20px;
}

.course-design-lessons {
  display: grid;
  gap: 16px;
}

.course-design-lesson {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  padding: 16px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.course-design-lesson:hover,
.course-design-lesson.is-active {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
}

.course-design-lesson__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.course-design-lesson__head button {
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 6px 12px;
  background: #ffffff;
  color: #3b82f6;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  transition: all 0.2s ease;
}

.course-design-lesson__head button:hover {
  background: #3b82f6;
  color: #ffffff;
}

.course-design-lesson h4 {
  margin: 12px 0 8px;
  color: #1e293b;
  font-size: 15px;
  line-height: 1.4;
}

.course-design-lesson p {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .preview-resizer {
    width: 10px;
  }

  .preview-panel {
    min-width: 360px;
  }
}

@media (max-width: 760px) {
  .chat-messages {
    padding: 20px 16px 300px;
    scroll-padding-bottom: 300px;
  }

  .chat-input-area {
    padding: 14px 14px 18px;
  }

  .outline-summary-row,
  .outline-grid {
    grid-template-columns: 1fr;
  }

  .outline-review-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
.quoted-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px dashed #c0c4cc;
}

.course-design-reopen-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #eef5ff;
  padding: 7px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #d8e7ff;
}

.course-design-reopen-box .quote-content {
  min-width: 0;
}

.course-design-reopen-box .quote-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reopen-panel-btn {
  border: 0;
  border-radius: 8px;
  background: #1677ff;
  color: #fff;
  padding: 7px 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.quote-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  color: #606266;
}

.close-quote-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #909399;
  padding: 0 4px;
}

.close-quote-btn:hover {
  color: #f56c6c;
}
 
 
@keyframes blinkCursor {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.deep-thinking-container {
  width: 100%;
  max-width: 800px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  animation: thinkingContainerIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

/* 头部点击栏 */
.deep-thinking-header {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.72));
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
  align-self: flex-start;
  margin-left: -8px; /* 让文字与外层对话边界对齐 */
}

.deep-thinking-header:hover {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-color: rgba(99, 102, 241, 0.22);
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.1);
  transform: translateY(-1px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

/* 蓝色旋转图标 */
.thinking-spin-icon {
  color: #4f46e5;
  animation: spinSlow 4.8s linear infinite, thinkingGlow 1.8s ease-in-out infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.header-stage {
  max-width: min(360px, 42vw);
  overflow: hidden;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-stage::before {
  margin: 0 2px 0 1px;
  color: #cbd5e1;
  content: '·';
}

.header-timer {
  flex: 0 0 auto;
  font-size: 14px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 右侧折叠箭头 */
.header-chevron {
  color: #6b7280;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-chevron.is-collapsed {
  transform: rotate(-90deg);
}

/* 底部文字内容区 (左侧灰线设计) */
.deep-thinking-content {
  margin-top: 10px;
  margin-left: 9px; /* 精确对齐图标的中轴线 */
  padding: 4px 0 4px 18px;
  border-left: 2px solid rgba(148, 163, 184, 0.36);
  min-height: 0;
  animation: thoughtReveal 0.42s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

/* 欢迎模式样式 */
.chat-main-area.is-welcome {
  justify-content: center;
  align-items: center;
  padding: 0 24px;
}

.welcome-brand-wrapper {
  margin-bottom: 48px;
  text-align: center;
  animation: brandFloat 5s ease-in-out 1.2s infinite;
}

.welcome-brand {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  line-height: 1.1;
  background: linear-gradient(
    135deg,
    #dbeafe 0%,
    #93c5fd 20%,
    #60a5fa 40%,
    #38bdf8 60%,
    #7dd3fc 80%,
    #e0f2fe 100%
  );
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  filter: blur(10px);
  transform: translateY(30px) scale(0.95);
  animation:
    brandEnter 1s cubic-bezier(0.22, 1, 0.36, 1) forwards,
    starrySky 12s ease-in-out 1s infinite;
}

@keyframes brandEnter {
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

@keyframes starrySky {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes brandFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.chat-input-area.is-welcome {
  position: relative;
  background: none;
  padding: 0;
  width: 100%;
  max-width: 840px;
}

.chat-input-area.is-welcome .input-wrapper textarea {
  min-height: 28px;
  font-size: 15px;
  line-height: 1.5;
}

.chat-input-area.is-welcome .input-wrapper textarea::placeholder {
  color: #b0b3b8;
}

.chat-input-area.is-welcome .input-toolbar {
  margin-top: 10px;
}

.send-btn:disabled {
  background: #e5e5e5;
  color: #aaa;
  opacity: 1;
}

/* 欢迎模式过渡动画 */
.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 欢迎模式介绍卡片 */
.welcome-intro-area {
  margin-top: 40px;
  width: 100%;
  max-width: 840px;
}

.intro-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.intro-card {
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.intro-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.intro-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.intro-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.intro-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .intro-cards {
    grid-template-columns: 1fr;
  }
}

.typewriter-text {
  font-size: 14px;
  line-height: 1.75;
  color: #6b7280; /* 截图同款灰字 */
  white-space: pre-wrap;
  word-break: break-all;
  animation: thoughtTextIn 0.35s ease both;
}

.thinking-waiting-text {
  color: #94a3b8;
  animation: waitingTextPulse 1.8s ease-in-out infinite;
}

/* 灰色的光标 */
.typing-cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  border-radius: 999px;
  background-color: #9ca3af;
  margin-left: 3px;
  vertical-align: baseline;
  animation: blinkCursor 0.9s ease-in-out infinite;
}

@keyframes blinkCursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes thinkingContainerIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes thoughtReveal {
  from {
    opacity: 0;
    transform: translateY(-4px);
    clip-path: inset(0 0 100% 0 round 16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    clip-path: inset(0 0 0 0 round 16px);
  }
}

@keyframes thoughtTextIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes thinkingGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(79, 70, 229, 0));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.32));
  }
}

@keyframes waitingTextPulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

/* 欢迎模式样式 */
.chat-main-area.is-welcome {
  justify-content: center;
  align-items: center;
  padding: 0 24px;
}
</style>
