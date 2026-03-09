<template>
  <div class="fm-viewer">
    <!-- Filter Bar -->
    <div class="fm-filter-bar">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Brain Region</label>
          <el-select
              v-model="filterRegion"
              multiple
              filterable
              collapse-tags
              placeholder="All Regions"
              size="small"
              class="filter-select"
              @change="applyFilters"
          >
            <el-option
                v-for="item in regionOptions"
                :key="item"
                :label="item"
                :value="item"
            />
          </el-select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Gender</label>
          <el-select
              v-model="filterGender"
              multiple
              filterable
              collapse-tags
              placeholder="All"
              size="small"
              class="filter-select filter-select-sm"
              @change="applyFilters"
          >
            <el-option
                v-for="item in genderOptions"
                :key="item"
                :label="item"
                :value="item"
            />
          </el-select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Neuron ID Search</label>
          <el-input
              v-model="filterNeuronId"
              placeholder="Search neuron ID..."
              size="small"
              clearable
              class="filter-input"
              @input="debouncedApplyFilters"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <el-select
              v-model="sortField"
              size="small"
              class="filter-select filter-select-sm"
              @change="applyFilters"
          >
            <el-option label="Neuron ID" value="neuron_id" />
            <el-option label="Region" value="brain_region" />
            <el-option label="Gender" value="gender" />
          </el-select>
        </div>
        <div class="filter-stats">
          <span class="stat-badge">
            <i class="el-icon-data-board" />
            {{ filteredData.length.toLocaleString() }} / {{ allData.length.toLocaleString() }} neurons
          </span>
        </div>
      </div>
    </div>

    <!-- Card Grid with Virtual Scroll -->
    <div
        ref="scrollContainer"
        class="fm-grid-container"
        @scroll="handleScroll"
    >
      <div
          class="fm-grid-spacer"
          :style="{ height: totalHeight + 'px' }"
      >
        <div
            class="fm-grid"
            :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
              v-for="item in visibleItems"
              :key="item.neuron_id"
              class="fm-card"
              :class="{ 'fm-card--selected': selectedNeuronId === item.neuron_id }"
              @click="selectNeuron(item)"
          >
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-species">Firing Model</span>
                <span class="card-id">{{ item.model_id }}</span>
              </div>
              <div class="card-header-right">
                <span
                    class="card-region-badge"
                    :style="{ backgroundColor: getRegionColor(item.brain_region) }"
                >
                  {{ item.brain_region }}
                </span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-meta">
                <div class="meta-row">
                  <span class="meta-label">Neuron:</span>
                  <span class="meta-value">{{ item.neuron_id }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Gender:</span>
                  <span class="meta-value">{{ item.gender || '–' }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Age:</span>
                  <span class="meta-value">{{ item.age || '–' }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Patient:</span>
                  <span class="meta-value">{{ item.patient_number || '–' }}</span>
                </div>
              </div>

              <div class="card-svg-preview">
                <img
                    v-if="item.has_svg && item._imgLoaded !== false"
                    :src="getSvgSrc(item.model_id)"
                    :alt="'Firing Model ' + item.model_id"
                    class="svg-img"
                    loading="lazy"
                    @error="handleImgError($event, item)"
                >
                <div
                    v-else
                    class="svg-placeholder"
                >
                  <svg viewBox="0 0 120 60" class="svg-placeholder-icon">
                    <polyline
                        points="0,30 10,30 15,20 20,45 25,15 30,40 35,30 45,30 50,25 55,42 60,18 65,38 70,30 80,30 85,22 90,44 95,16 100,36 105,30 120,30"
                        fill="none"
                        stroke="#c0c4cc"
                        stroke-width="1.5"
                    />
                  </svg>
                  <span class="placeholder-text">{{ item.has_svg ? 'Loading...' : 'No SVG' }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="coord-group">
                <span class="coord-label">x:</span>
                <span class="coord-value">{{ formatCoord(item.soma_x) }}</span>
              </div>
              <div class="coord-group">
                <span class="coord-label">y:</span>
                <span class="coord-value">{{ formatCoord(item.soma_y) }}</span>
              </div>
              <div class="coord-group">
                <span class="coord-label">z:</span>
                <span class="coord-value">{{ formatCoord(item.soma_z) }}</span>
              </div>
              <el-button
                  type="text"
                  size="mini"
                  class="card-detail-btn"
                  @click.stop="showDetail(item)"
              >
                Detail ›
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <el-drawer
        :visible.sync="detailVisible"
        :title="'Firing Model — ' + (detailItem ? detailItem.model_id : '')"
        size="520px"
        direction="rtl"
        :append-to-body="true"
    >
      <div v-if="detailItem" class="detail-panel">
        <div class="detail-svg-large">
          <img
              v-if="detailItem.has_svg"
              :src="getSvgSrc(detailItem.model_id)"
              :alt="'Firing Model ' + detailItem.model_id"
              class="svg-img-large"
          >
          <div v-else class="svg-placeholder-large">No SVG available</div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">Neuron Info</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Neuron ID</span>
              <span class="detail-value detail-value--mono">{{ detailItem.neuron_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Model ID</span>
              <span class="detail-value detail-value--mono">{{ detailItem.model_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Brain Region</span>
              <span class="detail-value detail-value--region">
                <span
                    class="region-dot"
                    :style="{ backgroundColor: getRegionColor(detailItem.brain_region) }"
                />
                {{ detailItem.brain_region }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Gender</span>
              <span class="detail-value">{{ detailItem.gender || '–' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Age</span>
              <span class="detail-value">{{ detailItem.age || '–' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Patient Number</span>
              <span class="detail-value">{{ detailItem.patient_number || '–' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">Soma Coordinates</h4>
          <div class="detail-grid detail-grid--3col">
            <div class="detail-item detail-item--coord">
              <span class="detail-label">X</span>
              <span class="detail-value detail-value--mono">{{ detailItem.soma_x }}</span>
            </div>
            <div class="detail-item detail-item--coord">
              <span class="detail-label">Y</span>
              <span class="detail-value detail-value--mono">{{ detailItem.soma_y }}</span>
            </div>
            <div class="detail-item detail-item--coord">
              <span class="detail-label">Z</span>
              <span class="detail-value detail-value--mono">{{ detailItem.soma_z }}</span>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <el-button
              size="small"
              @click="downloadSvg(detailItem)"
          >
            <i class="el-icon-download" /> Download SVG
          </el-button>
          <el-button
              size="small"
              @click="exportNeuronData(detailItem)"
          >
            <i class="el-icon-document" /> Export JSON
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator'
import { debounce } from 'lodash'

interface FiringModelNeuron {
  neuron_id: string
  name: string
  brain_region: string
  age: string
  gender: string
  patient_number: string
  soma_x: number
  soma_y: number
  soma_z: number
  model_id: string
  has_svg: boolean
  _imgLoaded?: boolean
}

function stringToColor (str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 52%)`
}

const CARD_HEIGHT = 230
const COLS = 3
const GAP = 16
const ROW_HEIGHT = CARD_HEIGHT + GAP
const BUFFER_ROWS = 3

@Component
export default class FiringModelViewer extends Vue {
  @Ref('scrollContainer') scrollContainer!: HTMLDivElement

  public allData: FiringModelNeuron[] = []
  public filteredData: FiringModelNeuron[] = []

  private filterRegion: string[] = []
  private filterGender: string[] = []
  private filterNeuronId: string = ''
  private sortField: string = 'neuron_id'

  private scrollTop: number = 0
  private containerHeight: number = 800

  private detailVisible: boolean = false
  private detailItem: FiringModelNeuron | null = null
  private selectedNeuronId: string = ''

  private regionOptions: string[] = []
  private genderOptions: string[] = []

  private colorCache: Map<string, string> = new Map()
  private debouncedApplyFilters: any = null

  // SVG serving base path — goes through the v3 API proxy
  private svgBasePath: string = '/v3/api/v3/human_firing_model_svg/'

  created () {
    this.debouncedApplyFilters = debounce(() => {
      this.applyFilters()
    }, 300)
  }

  mounted () {
    this.containerHeight = this.scrollContainer?.clientHeight || 800
    window.addEventListener('resize', this.onResize)
  }

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  }

  get totalRows (): number {
    return Math.ceil(this.filteredData.length / COLS)
  }

  get totalHeight (): number {
    return this.totalRows * ROW_HEIGHT
  }

  get startRow (): number {
    return Math.max(0, Math.floor(this.scrollTop / ROW_HEIGHT) - BUFFER_ROWS)
  }

  get endRow (): number {
    const visibleRows = Math.ceil(this.containerHeight / ROW_HEIGHT)
    return Math.min(this.totalRows, Math.floor(this.scrollTop / ROW_HEIGHT) + visibleRows + BUFFER_ROWS)
  }

  get offsetY (): number {
    return this.startRow * ROW_HEIGHT
  }

  get visibleItems (): FiringModelNeuron[] {
    const start = this.startRow * COLS
    const end = this.endRow * COLS
    return this.filteredData.slice(start, end).map(item => {
      if (item._imgLoaded === undefined) {
        this.$set(item, '_imgLoaded', true)
      }
      return item
    })
  }

  public setData (data: FiringModelNeuron[]) {
    this.allData = data

    const regionSet = new Set<string>()
    const genderSet = new Set<string>()
    data.forEach(d => {
      if (d.brain_region) regionSet.add(d.brain_region)
      if (d.gender) genderSet.add(d.gender)
    })
    this.regionOptions = Array.from(regionSet).sort()
    this.genderOptions = Array.from(genderSet).sort()

    this.applyFilters()
  }

  public applyFilters () {
    let result = this.allData

    if (this.filterRegion.length > 0) {
      const set = new Set(this.filterRegion)
      result = result.filter(d => set.has(d.brain_region))
    }

    if (this.filterGender.length > 0) {
      const set = new Set(this.filterGender)
      result = result.filter(d => set.has(d.gender))
    }

    if (this.filterNeuronId) {
      const keyword = this.filterNeuronId.toLowerCase()
      result = result.filter(d => d.neuron_id.toLowerCase().includes(keyword))
    }

    result = [...result].sort((a: any, b: any) => {
      const va = a[this.sortField]
      const vb = b[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va).localeCompare(String(vb))
    })

    this.filteredData = result
    if (this.scrollContainer) {
      this.scrollContainer.scrollTop = 0
    }
    this.scrollTop = 0
  }

  private handleScroll () {
    this.scrollTop = this.scrollContainer.scrollTop
  }

  private onResize () {
    this.containerHeight = this.scrollContainer?.clientHeight || 800
  }

  private selectNeuron (item: FiringModelNeuron) {
    this.selectedNeuronId = item.neuron_id
    this.$emit('neuronSelect', item)
  }

  private showDetail (item: FiringModelNeuron) {
    this.detailItem = item
    this.detailVisible = true
  }

  private exportNeuronData (item: FiringModelNeuron) {
    const { _imgLoaded, ...exportData } = item as any
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `firing_model_${item.model_id}_${item.neuron_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  private downloadSvg (item: FiringModelNeuron) {
    if (!item.has_svg) return
    const a = document.createElement('a')
    a.href = this.getSvgSrc(item.model_id)
    a.download = `firing_model_${item.model_id}.svg`
    a.click()
  }

  private getRegionColor (region: string): string {
    if (!region) return '#999'
    if (this.colorCache.has(region)) return this.colorCache.get(region)!
    const color = stringToColor(region)
    this.colorCache.set(region, color)
    return color
  }

  private getSvgSrc (modelId: string): string {
    return `${this.svgBasePath}${modelId}`
  }

  private formatCoord (val: number): string {
    if (val === undefined || val === null) return '–'
    return Number(val).toFixed(1)
  }

  private handleImgError (event: Event, item: FiringModelNeuron) {
    this.$set(item, '_imgLoaded', false)
  }

  public setSvgBasePath (path: string) {
    this.svgBasePath = path
  }
}
</script>

<style scoped lang="less">
@card-bg: #ffffff;
@card-border: #e4e7ed;
@card-hover-border: #409eff;
@card-selected-border: #9F1239;
@header-bg: #fafbfc;
@text-primary: #1a1a2e;
@text-secondary: #606266;
@text-muted: #909399;
@accent: #9F1239;
@accent-light: #fdf2f4;

.fm-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

.fm-filter-bar {
  background: @card-bg;
  border-bottom: 1px solid @card-border;
  padding: 12px 20px;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: @text-muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  width: 200px;
}

.filter-select-sm {
  width: 140px;
}

.filter-input {
  width: 220px;
}

.filter-stats {
  margin-left: auto;
  display: flex;
  align-items: flex-end;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: @accent-light;
  color: @accent;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;

  i {
    font-size: 14px;
  }
}

.fm-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #ebeef0;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 4px;
    &:hover {
      background: #909399;
    }
  }
}

.fm-grid-spacer {
  position: relative;
}

.fm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.fm-card {
  background: @card-bg;
  border: 1px solid @card-border;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    border-color: @card-hover-border;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
    transform: translateY(-1px);
  }

  &--selected {
    border-color: @card-selected-border;
    box-shadow: 0 0 0 2px fade(@card-selected-border, 20%);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: @header-bg;
  border-bottom: 1px solid #f0f0f0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-species {
  font-size: 14px;
  font-weight: 700;
  color: @text-primary;
}

.card-id {
  font-size: 11px;
  color: @text-muted;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.card-region-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.3px;
}

.card-body {
  display: flex;
  padding: 12px 14px;
  gap: 12px;
  min-height: 120px;
}

.card-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.meta-label {
  color: @text-muted;
  font-weight: 500;
  white-space: nowrap;
}

.meta-value {
  color: @text-primary;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  word-break: break-all;
}

.card-svg-preview {
  width: 180px;
  height: 110px;
  flex-shrink: 0;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.svg-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.svg-placeholder-icon {
  width: 80%;
  height: 50%;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 10px;
  color: @text-muted;
}

.card-footer {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid #f0f0f0;
  background: #fcfcfd;
  gap: 14px;
}

.coord-group {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
}

.coord-label {
  color: @text-muted;
  font-weight: 600;
}

.coord-value {
  color: @text-primary;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.card-detail-btn {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: @accent;
  padding: 0;
}

/* Detail Drawer */
.detail-panel {
  padding: 0 20px 20px;
}

.detail-svg-large {
  width: 100%;
  height: 220px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid @card-border;
  margin-bottom: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-img-large {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.svg-placeholder-large {
  color: @text-muted;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section-title {
  font-size: 13px;
  font-weight: 700;
  color: @text-primary;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid @accent;
  display: inline-block;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-grid--3col {
  grid-template-columns: 1fr 1fr 1fr;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item--coord {
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 6px;
  text-align: center;
}

.detail-label {
  font-size: 11px;
  color: @text-muted;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-value {
  font-size: 14px;
  color: @text-primary;
  font-weight: 600;
}

.detail-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
}

.detail-value--region {
  display: flex;
  align-items: center;
  gap: 6px;
}

.region-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid @card-border;
}
</style>
