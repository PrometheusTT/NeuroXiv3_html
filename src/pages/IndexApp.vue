<template>
  <div id="app">
    <SmallScreenAlert />
    <!-- 使用 actions-alignment="right" 控制按钮区域对齐方式 -->
    <header-bar
      :show-video-button="false"
      actions-alignment="right"
    >
      <!-- 按钮区域 -->
      <div class="action-buttons">
        <router-link
          :to="getCompleteRouteByPathString('about')"
          class="button-link"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            About
          </el-button>
        </router-link>

        <a
          href="/neuroXiv_user_instruction.pdf"
          class="button-link"
          target="_blank"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            Help
          </el-button>
        </a>

        <a
          href="https://download.neuroxiv.org"
          class="button-link"
          target="_blank"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            Download
          </el-button>
        </a>

        <router-link
          :to="getCompleteRouteByPathString('news')"
          class="button-link"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            News
          </el-button>
        </router-link>
      </div>
    </header-bar>
    <transition name="slide-fade">
      <router-view />
    </transition>
    <ThemeSwitcher v-show="false" />
    <footer>
      Ver 2.0.3. Copyright 2026.
    </footer>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import HeaderBar from '@/components/mouse/HeaderBar.vue'
import RouterHelper from '@/mixins/RouterHelper.vue'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
import LangSwitcher from '@/components/common/LangSwitcher.vue'
import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'

@Component({
  components: {
    SmallScreenAlert,
    LangSwitcher,
    ThemeSwitcher,
    HeaderBar
  }
})
export default class IndexApp extends RouterHelper {}
</script>

<style lang="less" scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  background-color: var(--page-background-color);
  position: relative;
  min-width: 1300px;

  footer {
    position: fixed;
    color: grey;
    font-size: 0.8em;
    bottom: 30px;
    width: 100%;
    text-align: center;
  }
}

/* 保持原有的按钮样式 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 将按钮区域靠右对齐 */
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

.button-link {
  display: flex;
  text-decoration: none;
}

.equal-button {
  min-width: 140px;
  max-width: 200px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.equal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
}
</style>
