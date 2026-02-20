<template>
  <div class="header-bar">
    <NeuronLogo class="neuron-logo" />

    <!-- 根据 actionsAlignment 动态设置类 -->
    <div
      :class="[
        'actions',
        actionsAlignment === 'right' ? 'actions-right' : ''
      ]"
    >
      <slot>
        <!-- 按钮内容 -->
        <el-button
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchButton')"
        >
          Search
        </el-button>
        <el-button

          plain
          class="action"
          @click="$emit('clickSearchByIDButton')"
        >
          Search by ID
        </el-button>
        <el-button
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchByLLMButton')"
        >
          AIPOM-CoT
        </el-button>
        <el-upload
          action=""
          accept=".swc,.eswc"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="uploadNeuron"
          class="action"
        >
          <el-button
            type="primary"
            plain
          >
            Upload neuron
          </el-button>
        </el-upload>
        <el-button
          type="primary"
          plain
          class="action"
          @click="openExternalPage"
        >
          NeuroXiv-KG
        </el-button>
        <!--        <el-button-->
        <!--          type="primary"-->
        <!--          plain-->
        <!--          class="action"-->
        <!--          @click="openJupyterNotebook"-->
        <!--        >-->
        <!--          Open Jupyter Notebook-->
        <!--        </el-button>-->
      </slot>
    </div>

    <!-- 右侧容器 -->
    <div class="right-container">
      <slot name="video_button">
        <el-button
          v-if="showVideoButton"
          type="primary"
          plain
          class="tutorial-button"
          @click="showVideoDialog = true"
        >
          Tutorial video
        </el-button>
      </slot>
    </div>

    <!-- Tutorial video 对话框 -->
    <el-dialog
      title="Tutorial video"
      :visible.sync="showVideoDialog"
      width="50%"
    >
      <video
        controls
        width="100%"
      >
        <source
          src="https://d36ajqhpoeuszk.cloudfront.net/tutorial.mp4"
          type="video/mp4"
        >
        Your browser does not support video playback.
      </video>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator'
import RouterHelper from '@/mixins/RouterHelper.vue'
import { mapState } from 'vuex'
import NeuronLogo from '@/components/common/NeuronLogo.vue'

@Component({
  computed: {
    ...mapState(['userInfo'])
  },
  components: { NeuronLogo }
})
export default class HeaderBar extends RouterHelper {
    @Prop({ default: true }) private showVideoButton!: boolean;
    @Prop({ default: 'left' }) private actionsAlignment!: string;
    @Prop({ default: 'https://kg.neuroxiv.org/browser/' }) private externalUrl!: string;
    private showVideoDialog: boolean = false;

    private uploadNeuron (param: any) {
      this.$emit('clickUploadNeuron', param)
    }

    private openExternalPage () {
      if (!this.externalUrl) {
        this.$message('No external URL configured.')
        return
      }
      window.open(this.externalUrl, '_blank')
    }

    openJupyterNotebook () {
      window.open('http://localhost:8888/')
    }

    private beforeUpload (file: any) {
      const fileSuffix = file.name.substring(
        file.name.lastIndexOf('.') + 1
      )
      if (fileSuffix !== 'swc' && fileSuffix !== 'eswc') {
        this.$message(
          'The upload file must be swc file or eswc file!'
        )
        return false
      }
    }
}
</script>

<style scoped lang="less">
.header-bar {
  background-color: var(--header-bg-color, #3F0D12);
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;

  .neuron-logo {
    margin-right: 30px;
    color: white;
  }

  .actions {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-start;

    .action {
      margin-left: 20px;
    }
  }

  .actions-right {
    justify-content: flex-end;
  }

  .right-container {
    display: flex;
    align-items: center;
  }

  .tutorial-button {
    margin-right: 20px;
  }

  // 顶栏按钮：浅底胶囊样式，深色酒红顶栏上可读性好
  /deep/ .el-button--primary.is-plain {
    background-color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.3);
    color: #3F0D12;
    border-radius: 20px;
    font-weight: 500;
    &:hover,
    &:focus {
      background-color: #9F1239;
      border-color: #9F1239;
      color: #fff;
    }
    &:active {
      background-color: #881337;
      border-color: #881337;
      color: #fff;
    }
  }

  // 非 primary 的 plain 按钮也做同样处理
  /deep/ .el-button.is-plain {
    background-color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.3);
    color: #3F0D12;
    border-radius: 20px;
    font-weight: 500;
    &:hover,
    &:focus {
      background-color: #9F1239;
      border-color: #9F1239;
      color: #fff;
    }
  }
}
</style>
