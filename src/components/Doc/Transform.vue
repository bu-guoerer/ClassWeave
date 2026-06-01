<script>
// 引入ECharts 和 Vue 组合式API
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router' // 用于路由跳转
import * as echarts from 'echarts'

export default {
  setup() {
    const router = useRouter() // 获取路由实例

    // 定义图表实例引用
    const chart1 = ref(null)
    const chart2 = ref(null)
    const chart3 = ref(null)

    // ---------- 自定义紫罗兰+粉色主题色 ----------
    const violet = '#B284BE' // 主紫罗兰
    const pinkViolet = '#DA70D6' // 粉紫罗兰
    const lightViolet = 'rgba(178,132,190,0.25)' // 透明紫罗兰用于面积填充
    const themeColors = [violet, '#C154C1', '#D291BC', '#E6A8D7', '#FFB6C1'] // 色盘

    // 初始化图表
    const initCharts = () => {
      // 图表1：周中广告收入增长（折线图）
      const chartDom1 = document.getElementById('chart1')
      chart1.value = echarts.init(chartDom1)
      const option1 = {
        backgroundColor: 'transparent',
        textStyle: { color: '#fff' },
        title: { text: '周广告收入趋势', textStyle: { color: '#fff', fontSize: 14 } },
        color: themeColors, // 全局色盘（折线图会取第一个）
        xAxis: {
          type: 'category',
          data: ['周六', '周日', '周一', '周二', '周三'],
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff' },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        },
        series: [
          {
            data: [120, 132, 145, 160, 180],
            type: 'line',
            smooth: true,
            // 显式指定颜色以保证与面积填充一致
            itemStyle: { color: violet },
            areaStyle: { color: lightViolet }, // 使用透明紫罗兰填充
          },
        ],
      }
      chart1.value.setOption(option1)

      // 图表2：广告收入来源占比（饼图）
      const chartDom2 = document.getElementById('chart2')
      chart2.value = echarts.init(chartDom2)
      const option2 = {
        backgroundColor: 'transparent',
        textStyle: { color: '#fff' },
        title: { text: '收入来源占比', textStyle: { color: '#fff', fontSize: 14 } },
        tooltip: { trigger: 'item' },
        color: themeColors, // 饼图自动取用色盘颜色
        legend: {
          bottom: 0,
          textStyle: { color: '#fff' },
        },
        series: [
          {
            name: '收入占比',
            type: 'pie',
            radius: ['40%', '70%'],
            data: [
              { value: 55, name: '自然搜索' },
              { value: 25, name: '付费广告' },
              { value: 20, name: '社交媒体' },
            ],
            label: {
              color: '#fff',
              formatter: '{b}: {c}%',
            },
            // 也可以单独为每个扇区指定颜色，但使用全局色盘更简洁
          },
        ],
      }
      chart2.value.setOption(option2)

      // 图表3：月度广告收入峰值（柱状图）
      const chartDom3 = document.getElementById('chart3')
      chart3.value = echarts.init(chartDom3)
      const option3 = {
        backgroundColor: 'transparent',
        textStyle: { color: '#fff' },
        title: { text: '月度收入峰值', textStyle: { color: '#fff', fontSize: 14 } },
        color: themeColors, // 柱状图使用第一个颜色为主色
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月'],
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff', fontSize: 10 },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#fff' } },
          axisLabel: { color: '#fff' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        },
        series: [
          {
            data: [80, 90, 150, 100, 110, 120, 160, 130, 170, 110],
            type: 'bar',
            // 可设置圆角让柱子更柔和
            itemStyle: {
              color: violet, // 紫罗兰主色
              borderRadius: [6, 6, 0, 0], // 顶部圆角
            },
          },
        ],
      }
      chart3.value.setOption(option3)
    }

    // 窗口大小变化时重绘图表
    const resizeCharts = () => {
      chart1.value?.resize()
      chart2.value?.resize()
      chart3.value?.resize()
    }

    // 跳转到登录页面
    const goToLogin = () => {
      // 使用路由跳转，假设登录页面路径为 '/login'
      router.push('/login')
    }

    onMounted(() => {
      initCharts()
      window.addEventListener('resize', resizeCharts)
    })

    // 优化：组件卸载时移除事件监听并销毁图表实例，避免内存泄漏
    onUnmounted(() => {
      window.removeEventListener('resize', resizeCharts)
      // 销毁图表实例
      chart1.value?.dispose()
      chart2.value?.dispose()
      chart3.value?.dispose()
    })

    return {
      chart1,
      chart2,
      chart3,
      goToLogin, // 供模板使用
    }
  },
}
</script>

<template>
  <div class="transform">
    <div class="transfer">
      <div class="title">将数据转化为可视化报告</div>
      <ul>
        <li>
          <div class="see">洞察</div>
          <div class="content">
            广告收入从周六到周三呈现稳步增长，这表明周中开展的营销活动带来了更强的盈利表现。
          </div>
          <!-- 图表容器1：折线图 -->
          <div id="chart1" class="chart-container"></div>
        </li>
        <li>
          <div class="see">洞察</div>
          <div class="content">
            自然搜索是广告收入的最大贡献者，而付费广告和社交媒体共同构成了总收入的很大一部分。
          </div>
          <!-- 图表容器2：饼图 -->
          <div id="chart2" class="chart-container"></div>
        </li>
        <li>
          <div class="see">洞察</div>
          <div class="content">
            广告收入在 3 月、7 月和 9 月出现显著峰值，表明存在明显的季节性影响和营销活动驱动的增长。
          </div>
          <!-- 图表容器3：柱状图 -->
          <div id="chart3" class="chart-container"></div>
        </li>
      </ul>
      <div class="btn">
        <!-- 绑定点击事件跳转登录页面 -->
        <button @click="goToLogin">免费试用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  list-style: none;
}

.transform {
  width: 100%;
  min-height: 900px;
  height: auto;
  background: url(../../assets/images/bg.jpg) no-repeat;
  background-size: cover;
  background-color: black;
}

.transform .transfer {
  width: 100%;
  min-height: 900px;
  height: auto;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5) 0%,
    black 15%,
    black 50%,
    black 75%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.transform .transfer .title {
  padding: 80px;
  width: 100%;
  text-align: center;
  color: white;
  font-weight: 500;
  font-size: 50px;
}

.transform .transfer ul {
  width: 70%;
  height: auto;
  margin: 20px auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap; /* 适配小屏幕 */
}

.transform .transfer ul li {
  margin: 10px;
  width: 350px;
  min-height: 500px; /* 足够容纳图表 */
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 20px;
  padding: 15px; /* 内边距优化 */
}

.transform .transfer ul li .see {
  margin-bottom: 15px;
  width: 50px;
  height: 25px;
  background-color: rgba(255, 255, 255, 0.5);
  text-align: center;
  border-radius: 12.5px;
  line-height: 25px; /* 垂直居中 */
}

.transform .transfer ul li .content {
  margin-bottom: 20px;
  width: 100%;
  min-height: 80px;
  line-height: 1.5; /* 行高优化 */
}

/* 图表容器样式 */
.chart-container {
  width: 100%;
  height: 220px; /* 图表高度 */
  border-radius: 10px;
}

.transform .transfer .btn {
  width: 140px;
  height: 60px;
  margin: 30px auto;
  text-align: center;
}

.transform .transfer .btn button {
  display: inline-block;
  width: 120px;
  height: 50px;
  border-radius: 25px;
  cursor: pointer;
  border: none;
  background-color: #fff;
  font-size: 16px;
  transition: background-color 0.3s;
}

.transform .transfer .btn button:hover {
  background-color: #eee;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .transform .transfer ul {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .transform .transfer ul {
    flex-direction: column;
    align-items: center;
  }
  .transform .transfer .title {
    font-size: 35px;
    padding: 40px 20px;
  }
}
</style>
