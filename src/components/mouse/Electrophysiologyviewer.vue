<template>
  <div class="ephys-viewer">
    <!-- Header / Filter Bar -->
    <div class="ephys-filter-bar">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Brain Region</label>
          <el-select
              v-model="filterAcronym"
              multiple
              filterable
              collapse-tags
              placeholder="All Regions"
              size="small"
              class="filter-select"
              @change="applyFilters"
          >
            <el-option
                v-for="item in acronymOptions"
                :key="item"
                :label="item"
                :value="item"
            />
          </el-select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Probe ID</label>
          <el-select
              v-model="filterPid"
              multiple
              filterable
              collapse-tags
              placeholder="All Probes"
              size="small"
              class="filter-select"
              @change="applyFilters"
          >
            <el-option
                v-for="item in pidOptions"
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
            <el-option label="Region" value="acronym" />
            <el-option label="Probe ID" value="pid" />
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
        class="ephys-grid-container"
        @scroll="handleScroll"
    >
      <div
          class="ephys-grid-spacer"
          :style="{ height: totalHeight + 'px' }"
      >
        <div
            class="ephys-grid"
            :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
              v-for="item in visibleItems"
              :key="item.neuron_id"
              class="ephys-card"
              :class="{ 'ephys-card--selected': selectedNeuronId === item.neuron_id }"
              @click="selectNeuron(item)"
          >
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-species">Neuropixel</span>
                <span class="card-id">neuron: {{ item.cid }}</span>
              </div>
              <div class="card-header-right">
                <span
                    class="card-region-badge"
                    :style="{ backgroundColor: getRegionColor(item.acronym) }"
                >
                  {{ item.acronym }}
                </span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-meta">
                <div class="meta-row">
                  <span class="meta-label">Probe:</span>
                  <span class="meta-value">{{ item.pid }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Atlas ID:</span>
                  <span class="meta-value">{{ item.atlas_id }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">CCF-ME ID:</span>
                  <span class="meta-value">{{ item.me_atlas_id }}</span>
                </div>
              </div>

              <div class="card-waveform">
                <img
                    v-if="item._imgLoaded"
                    :src="getWaveformSrc(item.neuron_id)"
                    :alt="'Waveform ' + item.neuron_id"
                    class="waveform-img"
                    loading="lazy"
                    @error="handleImgError($event, item)"
                >
                <div
                    v-else
                    class="waveform-placeholder"
                >
                  <svg
                      viewBox="0 0 120 60"
                      class="waveform-svg-placeholder"
                  >
                    <polyline
                        points="0,30 15,30 25,28 30,10 35,55 40,25 50,30 60,30 70,28 75,12 80,52 85,27 95,30 120,30"
                        fill="none"
                        stroke="#c0c4cc"
                        stroke-width="1.5"
                    />
                  </svg>
                  <span class="placeholder-text">Loading...</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="coord-group">
                <span class="coord-label">x:</span>
                <span class="coord-value">{{ formatCoord(item.me_x) }}</span>
              </div>
              <div class="coord-group">
                <span class="coord-label">y:</span>
                <span class="coord-value">{{ formatCoord(item.me_y) }}</span>
              </div>
              <div class="coord-group">
                <span class="coord-label">z:</span>
                <span class="coord-value">{{ formatCoord(item.me_z) }}</span>
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
        :title="'Neuron ' + (detailItem ? detailItem.neuron_id : '')"
        size="480px"
        direction="rtl"
        :append-to-body="true"
    >
      <div
          v-if="detailItem"
          class="detail-panel"
      >
        <div class="detail-waveform-large">
          <img
              :src="getWaveformSrc(detailItem.neuron_id)"
              :alt="'Waveform ' + detailItem.neuron_id"
              class="waveform-img-large"
              @error="handleImgErrorLarge"
          >
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">
            Recording Info
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Neuron ID</span>
              <span class="detail-value">{{ detailItem.neuron_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cluster ID</span>
              <span class="detail-value">{{ detailItem.cid }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Probe ID</span>
              <span class="detail-value">{{ detailItem.pid }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Brain Region</span>
              <span class="detail-value detail-value--region">
                <span
                    class="region-dot"
                    :style="{ backgroundColor: getRegionColor(detailItem.acronym) }"
                />
                {{ detailItem.acronym }}
              </span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">
            Atlas Registration
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">CCFv3 Atlas ID</span>
              <span class="detail-value">{{ detailItem.atlas_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">CCF-ME Atlas ID</span>
              <span class="detail-value">{{ detailItem.me_atlas_id }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">
            Coordinates (CCF-ME)
          </h4>
          <div class="detail-grid detail-grid--3col">
            <div class="detail-item detail-item--coord">
              <span class="detail-label">X</span>
              <span class="detail-value detail-value--mono">{{ detailItem.me_x }}</span>
            </div>
            <div class="detail-item detail-item--coord">
              <span class="detail-label">Y</span>
              <span class="detail-value detail-value--mono">{{ detailItem.me_y }}</span>
            </div>
            <div class="detail-item detail-item--coord">
              <span class="detail-label">Z</span>
              <span class="detail-value detail-value--mono">{{ detailItem.me_z }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">
            Waveform Info
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Waveform Length</span>
              <span class="detail-value">128 samples</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sample Rate</span>
              <span class="detail-value">30 kHz (dt=1/30ms)</span>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <el-button
              type="primary"
              size="small"
              @click="locateInViewer(detailItem)"
          >
            <i class="el-icon-location-outline" /> Locate in 3D Viewer
          </el-button>
          <el-button
              size="small"
              @click="exportNeuronData(detailItem)"
          >
            <i class="el-icon-download" /> Export Data
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import { debounce } from 'lodash'

interface EphysNeuron {
  // eslint-disable-next-line camelcase
  neuron_id: string
  pid: string
  cid: string
  acronym: string
  // eslint-disable-next-line camelcase
  atlas_id: number
  // eslint-disable-next-line camelcase
  me_atlas_id: number
  // eslint-disable-next-line camelcase
  me_x: number
  // eslint-disable-next-line camelcase
  me_y: number
  // eslint-disable-next-line camelcase
  me_z: number
  _imgLoaded?: boolean
}

// Deterministic color from string hash
function stringToColor (str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 52%)`
}

const CARD_HEIGHT = 220 // estimated card height in px
const COLS = 3
const GAP = 16
const ROW_HEIGHT = CARD_HEIGHT + GAP
const BUFFER_ROWS = 3

@Component
export default class ElectrophysiologyViewer extends Vue {
  @Ref('scrollContainer') scrollContainer!: HTMLDivElement

  // Data
  public allData: EphysNeuron[] = []
  public filteredData: EphysNeuron[] = []

  // Filters
  private filterAcronym: string[] = []
  private filterPid: string[] = []
  private filterNeuronId: string = ''
  private sortField: string = 'neuron_id'

  // Virtual scroll state
  private scrollTop: number = 0
  private containerHeight: number = 800

  // Detail drawer
  private detailVisible: boolean = false
  private detailItem: EphysNeuron | null = null
  private selectedNeuronId: string = ''

  // Options for filters
  private acronymOptions: string[] = []
  private pidOptions: string[] = []

  // Color cache
  private colorCache: Map<string, string> = new Map()

  // Debounced filter
  private debouncedApplyFilters: any = null

  // Waveform image base path - adjust to your actual path
  private waveformBasePath: string = '/v3/data/ephys/waveform/'

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

  // ─── Computed-like getters ───

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

  get visibleItems (): EphysNeuron[] {
    const start = this.startRow * COLS
    const end = this.endRow * COLS
    return this.filteredData.slice(start, end).map(item => {
      if (item._imgLoaded === undefined) {
        this.$set(item, '_imgLoaded', true)
      }
      return item
    })
  }

  // ─── Public methods ───

  /**
   * Load data from parent or API. Call this after fetching ephys data.
   */
  public setData (data: EphysNeuron[]) {
    this.allData = data

    // Build filter option lists
    const acronymSet = new Set<string>()
    const pidSet = new Set<string>()
    data.forEach(d => {
      if (d.acronym) acronymSet.add(d.acronym)
      if (d.pid) pidSet.add(d.pid)
    })
    this.acronymOptions = Array.from(acronymSet).sort()
    this.pidOptions = Array.from(pidSet).sort()

    this.applyFilters()
  }

  public applyFilters () {
    let result = this.allData

    if (this.filterAcronym.length > 0) {
      const set = new Set(this.filterAcronym)
      result = result.filter(d => set.has(d.acronym))
    }

    if (this.filterPid.length > 0) {
      const set = new Set(this.filterPid)
      result = result.filter(d => set.has(d.pid))
    }

    if (this.filterNeuronId) {
      const keyword = this.filterNeuronId.toLowerCase()
      result = result.filter(d => d.neuron_id.toLowerCase().includes(keyword))
    }

    // Sort
    result = [...result].sort((a: any, b: any) => {
      const va = a[this.sortField]
      const vb = b[this.sortField]
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va).localeCompare(String(vb))
    })

    this.filteredData = result
    // Reset scroll
    if (this.scrollContainer) {
      this.scrollContainer.scrollTop = 0
    }
    this.scrollTop = 0
  }

  // ─── Event handlers ───

  private handleScroll () {
    this.scrollTop = this.scrollContainer.scrollTop
  }

  private onResize () {
    this.containerHeight = this.scrollContainer?.clientHeight || 800
  }

  private selectNeuron (item: EphysNeuron) {
    this.selectedNeuronId = item.neuron_id
    this.$emit('neuronSelect', item)
  }

  private showDetail (item: EphysNeuron) {
    this.detailItem = item
    this.detailVisible = true
  }

  private locateInViewer (item: EphysNeuron) {
    this.$emit('locateNeuron', item)
    this.detailVisible = false
  }

  private exportNeuronData (item: EphysNeuron) {
    const dataStr = JSON.stringify(item, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neuron_${item.neuron_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Helpers ───

  private getRegionColor (acronym: string): string {
    if (!acronym) return '#999'
    if (this.colorCache.has(acronym)) return this.colorCache.get(acronym)!
    const color = stringToColor(acronym)
    this.colorCache.set(acronym, color)
    return color
  }

  private getWaveformSrc (neuronId: string): string {
    return `${this.waveformBasePath}${neuronId}.png`
  }

  private formatCoord (val: number): string {
    if (val === undefined || val === null) return '–'
    return val.toFixed(1)
  }

  private handleImgError (event: Event, item: EphysNeuron) {
    this.$set(item, '_imgLoaded', false)
  }

  private handleImgErrorLarge (event: Event) {
    // Could set a fallback
  }

  /**
   * Allows parent to set waveform image base path
   */
  public setWaveformBasePath (path: string) {
    this.waveformBasePath = path
  }
}
</script>

<style scoped lang="less">
/* ═══════════════════════════════════════════
   Electrophysiology Viewer — Utilitarian Lab Aesthetic
   ═══════════════════════════════════════════ */

@card-bg: #ffffff;
@card-border: #e4e7ed;
@card-hover-border: #409eff;
@card-selected-border: #9F1239;
@header-bg: #fafbfc;
@text-primary: #1a1a2e;
@text-secondary: #606266;
@text-muted: #909399;
@accent: #9F1239;
@accent-light: #e6f7f5;

.ephys-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* ─── Filter Bar ─── */
.ephys-filter-bar {
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

/* ─── Grid Container (Virtual Scroll) ─── */
.ephys-grid-container {
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

.ephys-grid-spacer {
  position: relative;
}

.ephys-grid {
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

/* ─── Card ─── */
.ephys-card {
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
  min-height: 110px;
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

.card-waveform {
  width: 160px;
  height: 100px;
  flex-shrink: 0;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.waveform-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.waveform-svg-placeholder {
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

/* ─── Detail Drawer ─── */
.detail-panel {
  padding: 0 20px 20px;
}

.detail-waveform-large {
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid @card-border;
  margin-bottom: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-img-large {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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
