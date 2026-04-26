<template>
  <div id="app">
    <!-- 导航栏：固定顶部 -->
    <header class="navbar">
      <!-- 左侧 Logo 和项目名称（点击回到主页） -->
      <router-link to="/" class="logo">
        <span class="logo-icon"><img src="./assets/images/logo.png" alt="" /></span>
        <span class="project-name">ClassWeave 织课</span>
      </router-link>

      <!-- 右侧导航链接 -->
      <nav class="nav-links">
        <router-link to="/ai-slide">AI 幻灯片</router-link>
        <router-link to="/ai-doc">AI 文档</router-link>
        <router-link to="/login">登录</router-link>
      </nav>
    </header>

    <!-- 路由组件渲染区域，添加上边距避免被固定导航栏遮挡 -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
/* 全局样式：确保所有元素盒模型正确 */
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  overflow-x: hidden; /* 避免意外水平滚动条 */
}
</style>
<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

/* 导航栏样式：固定顶部 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 60px;
  background-color: rgba(248, 249, 250, 0.95);
  border-bottom: 1px solid #e9ecef;
  /* 固定定位 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

/* Logo 区域（作为链接） */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}

.logo-icon img {
  width: 40px;
  height: 30px;
}

.project-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #495057;
}

/* 导航链接 */
.nav-links {
  display: flex;
  gap: 20px;
}

.nav-links a {
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #42b983;
}

/* 当前激活的链接样式 */
.nav-links a.router-link-exact-active {
  color: #42b983;
  border-bottom: 2px solid #42b983;
}

/* 主内容区域：添加上边距，防止被固定导航栏遮挡 */
main {
  margin-top: 60px; /* 与导航栏高度一致 */
  padding: 20px; /* 内部组件已有内边距，可根据需要调整或移除 */
}
</style>
