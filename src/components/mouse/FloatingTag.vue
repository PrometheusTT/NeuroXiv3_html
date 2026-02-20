<template>
  <div
    v-if="visible"
    class="floating-tag"
    :style="computedStyle"
    @mousedown="startDrag"
  >
    <div
      class="tag-title"
      :style="{ color: titleColor }"
    >
      {{ title }}
    </div>
    <div class="tag-content">
      {{ message }}
    </div>
    <button
      class="close-btn"
      @click="closeTag"
    >
      ×
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

interface Position {
  x: number
  y: number
}

export default Vue.extend({
  props: {
    title: {
      type: String,
      default: 'Tag Title'
    },
    titleColor: {
      type: String,
      default: '#ffffff',
      validator: (val: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)
    },
    message: {
      type: String,
      default: 'This is a floating tag!'
    },
    targetPosition: {
      type: Object as () => Position,
      required: true,
      validator: (val: Position) =>
        true
    },
    offset: {
      type: Object as () => Position,
      default: () => ({
        x: 20,
        y: 20
      })
    }
  },
  data () {
    return {
      visible: true,
      currentPosition: { x: 0, y: 0 } as Position,
      dragging: false,
      dragOffset: { x: 0, y: 0 } as Position
    }
  },
  computed: {
    computedStyle (): Record<string, string> {
      return {
        position: 'absolute',
        top: `${this.currentPosition.y}px`,
        left: `${this.currentPosition.x}px`,
        zIndex: '1000'
      }
    }
  },
  watch: {
    targetPosition: {
      handler (newVal: Position) {
        this.calculatePosition(newVal)
      },
      deep: true,
      immediate: true
    }
  },
  mounted () {
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    calculatePosition (pos?: Position) {
      const targetPos = pos || this.targetPosition
      this.currentPosition = {
        x: targetPos.x + this.offset.x,
        y: targetPos.y + this.offset.y
      }
    },

    handleScroll () {
      this.calculatePosition()
    },

    startDrag (event: MouseEvent) {
      event.preventDefault()
      this.dragging = true
      const rect = (this.$el as HTMLElement).getBoundingClientRect()
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    onDrag (event: MouseEvent) {
      if (!this.dragging) return

      // 限制在可视区域内
      const maxX = window.innerWidth - (this.$el as HTMLElement).offsetWidth
      const maxY = window.innerHeight - (this.$el as HTMLElement).offsetHeight

      this.currentPosition = {
        x: Math.max(0, Math.min(event.pageX - this.dragOffset.x, maxX)),
        y: Math.max(0, Math.min(event.pageY - this.dragOffset.y, maxY))
      }
    },

    stopDrag () {
      this.dragging = false
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },

    closeTag () {
      this.visible = false
      this.$emit('close')
    }
  }
})
</script>

<style scoped>
.floating-tag {
  background: rgba(50, 50, 50, 0.3);
  color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  cursor: grab;
  user-select: none;
  position: relative;
  transition: transform 0.2s ease;
  max-width: 320px;
}

.floating-tag:hover {
  transform: translateY(-2px);
}

.floating-tag:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.tag-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.tag-content {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #ff4d4f;
}

.close-btn:focus {
  outline: none;
}
</style>
