<template>
  <div class="home">
    <section class="mouse-content">
      <NeuronLogo class="neuron-logo" />
      <p class="subtitle">
        NeuroXiv 3.0: From neuron and network structures to function modeling and brain dynamics
      </p>
      <a
        href="/v3/mouse.html"
        class="hero-card"
      >
        <div class="hero-card-bg" />
        <img
          class="dendrite-img"
          src="@/assets/multimodal.png"
          alt="dendrite"
        >
        <div class="hero-card-content">
          <span class="adventure-text">Begin your multimodal<br>data adventure</span>
          <div class="arrow-circle">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
              />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </a>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NeuronLogo from '@/components/common/NeuronLogo.vue'

@Component({
  components: { NeuronLogo }
})
export default class Container extends Vue {
  get base () {
    const b = (process.env.BASE_URL || '/')
    return b.endsWith('/') ? b : (b + '/')
  }
  mounted () {
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id')

    if (id) {
      window.location.href = `${window.location.origin}${this.base}mouse.html#/en/?id=${id}`
    }
  }
}
</script>

<style lang="less" scoped>
.home {
  color: var(--primary-color);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(2, 55, 147, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 100%, rgba(0, 128, 96, 0.03) 0%, transparent 60%),
    #fafbfd;
}

.mouse-content {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  padding: 40px 20px;

  .neuron-logo {
    font-size: 90px;
  }

  .subtitle {
    font-size: 15px;
    font-weight: 500;
    color: var(--primary-color);
    opacity: 0.75;
    letter-spacing: 0.01em;
    margin: 0 auto 48px;
    max-width: 560px;
    line-height: 1.6;
  }
}

/* ── Hero card ── */
.hero-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  text-decoration: none;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
  box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow:
    0 1px 3px rgba(2, 55, 147, 0.06),
    0 8px 32px rgba(2, 55, 147, 0.08);

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 4px 12px rgba(2, 55, 147, 0.10),
      0 20px 60px rgba(2, 55, 147, 0.14);

    .hero-card-bg {
      opacity: 1;
    }

    .arrow-circle {
      background: var(--primary-color, #023793);
      color: #fff;
      transform: translateX(4px);
    }

    .adventure-text {
      letter-spacing: 0.01em;
    }

    .dendrite-img {
      transform: scale(1.03);
    }
  }

  &:active {
    transform: translateY(-2px) scale(0.995);
  }
}

.hero-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f0f4fa 0%, #e8eff9 40%, #f5f7fb 100%);
  opacity: 0.85;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.dendrite-img {
  position: relative;
  z-index: 1;
  width: 280px;
  flex-shrink: 0;
  padding: 24px 0 24px 24px;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-card-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 40px 40px 24px;
}

.adventure-text {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--primary-color, #023793);
  text-align: center;
  transition: letter-spacing 0.4s ease;
}

.arrow-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(2, 55, 147, 0.08);
  color: var(--primary-color, #023793);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  svg {
    width: 20px;
    height: 20px;
  }
}
</style>
