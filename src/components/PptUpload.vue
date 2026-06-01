<template>
  <div class="ppt-upload">
    <input
      type="file"
      accept=".pptx"
      @change="handleFileChange"
      class="file-input"
    />
    <button @click="triggerFileInput" class="upload-btn">选择PPTX文件</button>

    <!-- 预览弹窗 -->
    <teleport to="body">
      <div v-if="previewVisible" class="preview-modal">
        <PptPreview :file="selectedFile" @onExit="closePreview" />
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PptPreview from "./PptPreview.vue";

const selectedFile = ref(null);
const previewVisible = ref(false);

// 触发文件选择框
const triggerFileInput = () => {
  document.querySelector(".file-input").click();
};

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      alert("仅支持PPTX格式文件！");
      return;
    }
    selectedFile.value = file;
    previewVisible.value = true;
    // 清空input值，支持重复选择同一文件
    e.target.value = "";
  }
};

// 关闭预览
const closePreview = () => {
  previewVisible.value = false;
  selectedFile.value = null;
};
</script>

<style scoped>
.ppt-upload {
  padding: 20px;
  text-align: center;
}

.file-input {
  display: none;
}

.upload-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
</style>