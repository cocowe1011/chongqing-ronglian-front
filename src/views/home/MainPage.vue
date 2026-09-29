<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">示例信息</div>
          <div class="scrollable-content">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">
                    示例字段一
                  </div>
                  <div class="data-card-border-borderDown">
                    {{ sampleInfo.field1 || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">示例字段二</div>
                  <div class="data-card-border-borderDown">
                    {{ sampleInfo.field2 || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">示例字段三</div>
                  <div class="data-card-border-borderDown">
                    {{ sampleInfo.field3 || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">示例字段四</div>
                  <div class="data-card-border-borderDown">
                    {{ sampleInfo.field4 || '--' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            <span>操作</span>
            <el-button
              type="primary"
              size="small"
              icon="Search"
              @click="showOrderQueryDialog"
            >
              查询历史订单
            </el-button>
          </div>
          <div class="operation-buttons">
            <button
              class="btn-start"
              @click="toggleButtonState('start')"
              :class="{ pressed: buttonStates.start }"
            >
              <el-icon><SwitchButton /></el-icon><span>全线启动</span>
            </button>
            <button
              class="btn-stop"
              @click="toggleButtonState('stop')"
              :class="{ pressed: buttonStates.stop }"
            >
              <el-icon><CircleCloseFilled /></el-icon><span>全线停止</span>
            </button>
            <button
              v-show="false"
              class="btn-reset"
              @click="toggleButtonState('reset')"
              :class="{ pressed: buttonStates.reset }"
            >
              <el-icon><VideoPause /></el-icon><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')">
              <el-icon><Refresh /></el-icon><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')">
              <el-icon><Delete /></el-icon><span>全线清空</span>
            </button>
          </div>
        </div>

        <!-- 日志区域 -->
        <div class="log-section">
          <div class="section-header">
            日志记录
            <div class="log-tabs">
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'running' }"
                @click="activeLogType = 'running'"
              >
                运行日志
              </div>
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'alarm' }"
                @click="switchToAlarmLog"
              >
                报警日志
                <div v-if="unreadAlarms > 0" class="alarm-badge">
                  {{ unreadAlarms }}
                </div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div
                  v-for="log in currentLogs"
                  :key="log.id"
                  :class="[
                    'log-item',
                    { alarm: log.type === 'alarm', unread: log.unread }
                  ]"
                >
                  <div class="log-time">{{ log.timeStr }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <el-icon><ChatLineSquare /></el-icon>
                <p>
                  {{
                    activeLogType === 'running'
                      ? '暂无运行日志'
                      : '暂无报警日志'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容区域 -->
      <div class="main-content">
        <div class="floor-container">
          <!-- 左侧区域 -->
          <div class="floor-left">
            <div class="floor-title">生产线监控</div>
            <div class="floor-image-container">
              <div class="floor-map-legend">
                <span class="legend-item">
                  <i class="legend-dot legend-dot--photo"></i>
                  <span class="legend-text">
                    <span class="legend-name">光电</span>
                    <span class="legend-desc">圆形，触发为红色</span>
                  </span>
                </span>
                <span class="legend-item">
                  <i class="legend-dot legend-dot--motor"></i>
                  <span class="legend-text">
                    <span class="legend-name">电机</span>
                    <span class="legend-desc">方形，运行为绿色</span>
                  </span>
                </span>
                <span class="legend-item">
                  <i class="legend-arrow"></i>
                  <span class="legend-text">
                    <span class="legend-name">箭头</span>
                    <span class="legend-desc">输送线物料流向</span>
                  </span>
                </span>
              </div>
              <div class="image-wrapper">
                <img
                  src="@/assets/changzhou-img/image.webp"
                  alt="平面图"
                  class="floor-image"
                  @load="updateMarkerPositions"
                />
                <!-- 修改队列标识 -->
                <div
                  v-for="marker in queueMarkers"
                  :key="marker.id"
                  class="queue-marker"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.queueId)"
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      <span class="queue-marker-count__queue">{{
                        getQueueTrayCount(marker.queueId)
                      }}</span>
                    </span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                </div>
                <!-- DBW6 对接输入信号 -->
                <!-- 10001光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit0 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">10001光电</div>
                </div>
                <!-- 10002光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit1 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">10002光电</div>
                </div>
                <!-- 10003光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit2 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">10003光电</div>
                </div>
                <!-- 10004光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit3 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">10004光电</div>
                </div>
                <!-- 10006升到位 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit4 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">10006升到位</div>
                </div>
                <!-- 10006降到位 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit5 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">10006降到位</div>
                </div>
                <!-- 10007光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit6 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">10007光电</div>
                </div>
                <!-- 10008光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit7 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">10008光电</div>
                </div>
                <!-- 10009光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit8 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">10009光电</div>
                </div>
                <!-- 10010光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit9 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">10010光电</div>
                </div>
                <!-- 10012上升到位 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit10 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit10')"
                >
                  <div class="marker-label">10012上升到位</div>
                </div>
                <!-- 10012下降到位 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit11 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit11')"
                >
                  <div class="marker-label">10012下降到位</div>
                </div>
                <!-- 10013光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit12 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit12')"
                >
                  <div class="marker-label">10013光电</div>
                </div>
                <!-- 10014光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit13 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit13')"
                >
                  <div class="marker-label">10014光电</div>
                </div>
                <!-- 10015光电 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal.bit14 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal, 'bit14')"
                >
                  <div class="marker-label">10015光电</div>
                </div>
                <!-- DBW8 电机运行信号 10001-10015（bit15 备用不生成） -->
                <!-- 10001电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit0 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit0')"
                >
                  <div class="marker-label">10001电机</div>
                </div>
                <!-- 10002电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit1 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit1')"
                >
                  <div class="marker-label">10002电机</div>
                </div>
                <!-- 10003电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit2 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit2')"
                >
                  <div class="marker-label">10003电机</div>
                </div>
                <!-- 10004电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit3 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit3')"
                >
                  <div class="marker-label">10004电机</div>
                </div>
                <!-- 10005电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit4 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit4')"
                >
                  <div class="marker-label">10005电机</div>
                </div>
                <!-- 10006电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit5 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit5')"
                >
                  <div class="marker-label">10006电机</div>
                </div>
                <!-- 10007电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit6 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit6')"
                >
                  <div class="marker-label">10007电机</div>
                </div>
                <!-- 10008电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit7 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit7')"
                >
                  <div class="marker-label">10008电机</div>
                </div>
                <!-- 10009电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit8 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit8')"
                >
                  <div class="marker-label">10009电机</div>
                </div>
                <!-- 10010电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit9 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit9')"
                >
                  <div class="marker-label">10010电机</div>
                </div>
                <!-- 10011电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit10 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit10')"
                >
                  <div class="marker-label">10011电机</div>
                </div>
                <!-- 10012电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit11 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit11')"
                >
                  <div class="marker-label">10012电机</div>
                </div>
                <!-- 10013电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit12 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit12')"
                >
                  <div class="marker-label">10013电机</div>
                </div>
                <!-- 10014电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit13 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit13')"
                >
                  <div class="marker-label">10014电机</div>
                </div>
                <!-- 10015电机运行信号 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunning.bit14 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunning, 'bit14')"
                >
                  <div class="marker-label">10015电机</div>
                </div>
                <!-- 输送线流动箭头 -->
                <div
                  v-for="(arrow, index) in conveyorArrows"
                  :key="'conveyor-' + index"
                  class="marker-with-flow flow-item"
                  :data-x="arrow.x"
                  :data-y="arrow.y"
                  :style="{
                    width: arrow.width + 'px',
                    transform: `translate(-50%, -50%) scale(0.5) rotateZ(${arrow.rotation}deg)`
                  }"
                >
                  <div
                    v-for="item in arrow.arrowCount"
                    :key="item"
                    class="conveyor-arrow-item"
                  ></div>
                </div>
                <!-- 输送线数据看板：上货队列与分拣口 -->
                <div class="marker-with-panel" data-x="1150" data-y="1200">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 210px"
                  >
                    <div class="data-panel-header">数据看板</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">示例数值：</span>
                        <span class="barcode-value">{{
                          sampleValue || '--'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div
      class="side-info-panel-queue"
      :style="{
        width: isQueueExpanded ? '850px' : 'auto',
        height: isQueueExpanded ? 'calc(100% - 40px)' : 'auto'
      }"
    >
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ expanded: isQueueExpanded }">
        <div class="section-header">
          <template v-if="isQueueExpanded">
            <div class="header-left">
              <span
                ><el-icon><Histogram /></el-icon> 队列信息</span
              >
            </div>
            <span
              class="arrow-icon"
              :class="{ 'expanded-arrow': isQueueExpanded }"
              @click="changeQueueExpanded"
              >▼</span
            >
          </template>
          <template v-else>
            <el-icon @click="changeQueueExpanded"><Histogram /></el-icon>
          </template>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, queuesIndex) in queues"
                :key="'queue-' + queue.id + '-' + queuesIndex"
                class="queue"
                :class="{ active: selectedQueueIndex === queue.id - 1 }"
                @click="showTrays(queue.id - 1)"
                @dragover.prevent
                @drop="handleDrop(queue.id - 1)"
              >
                <span class="queue-name">{{ queue.queueName }}</span>
                <span class="tray-count">{{
                  queue.trayInfo?.length || 0
                }}</span>
                <!-- AGV状态标签 -->
              </div>
            </div>

            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.queueName }}</h3>
                <div class="queue-header-actions">
                  <span class="tray-total"
                    >包裹数量: {{ selectedQueue.trayInfo?.length || 0 }}</span
                  >
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{
                      dragging:
                        isDragging &&
                        dragSourceQueue === selectedQueueIndex &&
                        draggedTrayIndex === index
                    }"
                    draggable="true"
                    @dragstart="
                      handleDragStart($event, tray, selectedQueueIndex, index)
                    "
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <span
                          class="tray-detail allocated-port"
                          v-if="tray.allocatedPortNo"
                          >目的地：分拣口{{ tray.allocatedPortNo }}</span
                        >
                        <span
                          class="tray-detail destination-code"
                          v-if="tray.destinationCode"
                          >编码：{{ tray.destinationCode }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >渠道：{{ tray.channel || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >包装重量：{{ tray.packingWeight || '--' }}</span
                        >
                        <span class="tray-detail"
                          >小包数量：{{ tray.expectedQty || '--' }}</span
                        >
                      </div>
                      <span class="tray-time">{{ tray.time }}</span>
                    </div>
                    <div class="tray-actions">
                      <el-button
                        type="primary"
                        size="small"
                        icon="ArrowUp"
                        circle
                        :disabled="index === 0"
                        @click.stop="moveTrayUp(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="primary"
                        size="small"
                        icon="ArrowDown"
                        circle
                        :disabled="index === nowTrays.length - 1"
                        @click.stop="moveTrayDown(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="danger"
                        size="small"
                        icon="Delete"
                        circle
                        @click.stop="deleteTray(tray, index)"
                      ></el-button>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">
                  <el-icon><Box /></el-icon>
                  <p>暂无托盘信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试面板 -->
    <div class="test-panel-container">
      <!-- 测试按钮 -->
      <div class="test-toggle-btn" @click="showTestPanel = !showTestPanel">
        <el-icon><Setting /></el-icon>
      </div>
      <!-- 测试面板 -->
      <div class="test-panel" :class="{ collapsed: !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <el-icon @click.stop="showTestPanel = false"><Close /></el-icon>
        </div>
        <div class="test-panel-content">
          <!-- 添加扫码测试部分 -->
          <div class="test-section">
            <span class="test-label">测试项:</span>
            <div class="qrcode-test-container">
              <div class="qrcode-input-group">
                <el-input
                  v-model="testInput"
                  size="small"
                  placeholder="输入测试内容"
                  class="qrcode-input"
                ></el-input>
              </div>
              <el-button type="warning" size="small" @click="runSampleTest">
                执行测试
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单查询对话框 -->
    <OrderQueryDialog v-model:visible="orderQueryDialogVisible" />
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import { ipcRenderer } from 'electron';
import OrderQueryDialog from '@/components/OrderQueryDialog.vue';

export default {
  name: 'MainPage',
  components: {
    OrderQueryDialog
  },
  data() {
    return {
      sampleInfo: {
        field1: '',
        field2: '',
        field3: '',
        field4: ''
      },
      sampleValue: '',
      testInput: '',
      showTestPanel: false,
      orderQueryDialogVisible: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      runningLogs: [], // 修改为空数组
      alarmLogs: [], // 修改为空数组
      nowTrays: [],
      draggedTray: null,
      draggedTrayIndex: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      queues: [
        {
          id: 1,
          queueName: '队列示例',
          trayInfo: []
        }
      ],
      // 添加队列位置标识数据
      queueMarkers: [{ id: 1, name: '队列示例', queueId: 1, x: 650, y: 780 }],
      // 输送线流动箭头配置（坐标按平面图调整）
      conveyorArrows: [
        {
          x: 390,
          y: 245,
          width: 200,
          rotation: -2,
          arrowCount: 6
        }
      ],
      logId: 1000, // 添加一个日志ID计数器
      // DBW0 输送线看门狗心跳
      conveyorHeartbeat: 0,
      // DBW2 输送线当前运行状态
      conveyorRunStatus: 0,
      // DBW4 区域报警 BIT 0~7
      areaAlarm: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0'
      },
      // DBW6 对接输入信号 BIT 0~15
      photoelectricSignal: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW8 电机运行信号 BIT 0~15
      motorRunning: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW10 A工位当前码垛数量
      stationAPalletQty: 0,
      // DBW12 B工位当前码垛数量
      stationBPalletQty: 0,
      // DBW14 A工位码垛完成呼叫AGV出垛
      stationACallAgv: 0,
      // DBW16 B工位码垛完成呼叫AGV出垛
      stationBCallAgv: 0,
      // DBW18 机器人抓取成功
      robotGrabSuccess: 0,
      // DBB30 码垛位扫码信息
      palletScanCode: '',
      // DBB50 A工位空托盘码信息
      stationAEmptyTrayCode: '',
      // DBB70 B工位空托盘码信息
      stationBEmptyTrayCode: '',
      // 数据准备就绪标志位
      isDataReady: false
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running'
        ? this.runningLogs
        : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter((log) => log.unread).length;
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    }
  },
  mounted() {
    this.initializeMarkers();
    this.loadQueueInfoFromDatabase();
    // 数据加载完成后创建监听（跳过 id 为 1-5 的队列）
    this._queueWatchers = []; // 保存 watcher 取消函数
    this._queueInitDone = false; // 初始化标记，跳过首次赋值触发的watch
    this.$nextTick(() => {
      this.queues.forEach((queue, index) => {
        const unwatch = this.$watch(`queues.${index}`, {
          handler() {
            if (!this._queueInitDone) return;
            this.updateQueueInfo(queue.id);
          },
          deep: true
        });
        this._queueWatchers.push(unwatch);
      });
    });
    // 保存监听器引用，以便组件销毁时移除，避免重复注册和内存泄漏
    this.receivedMsgHandler = (event, values) => {
      void event;
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // DBW0 输送线看门狗心跳
      this.conveyorHeartbeat = Number(values.DBW0 ?? 0);
      // DBW2 输送线当前运行状态
      this.conveyorRunStatus = Number(values.DBW2 ?? 0);

      // DBW4 区域报警 BIT 0~7
      let word4 = this.convertToWord(values.DBW4 ?? 0);
      this.areaAlarm.bit0 = getBit(word4, 8);
      this.areaAlarm.bit1 = getBit(word4, 9);
      this.areaAlarm.bit2 = getBit(word4, 10);
      this.areaAlarm.bit3 = getBit(word4, 11);
      this.areaAlarm.bit4 = getBit(word4, 12);
      this.areaAlarm.bit5 = getBit(word4, 13);
      this.areaAlarm.bit6 = getBit(word4, 14);
      this.areaAlarm.bit7 = getBit(word4, 15);

      // DBW6 对接输入信号 BIT 0~15
      let word6 = this.convertToWord(values.DBW6 ?? 0);
      this.photoelectricSignal.bit0 = getBit(word6, 8);
      this.photoelectricSignal.bit1 = getBit(word6, 9);
      this.photoelectricSignal.bit2 = getBit(word6, 10);
      this.photoelectricSignal.bit3 = getBit(word6, 11);
      this.photoelectricSignal.bit4 = getBit(word6, 12);
      this.photoelectricSignal.bit5 = getBit(word6, 13);
      this.photoelectricSignal.bit6 = getBit(word6, 14);
      this.photoelectricSignal.bit7 = getBit(word6, 15);
      this.photoelectricSignal.bit8 = getBit(word6, 0);
      this.photoelectricSignal.bit9 = getBit(word6, 1);
      this.photoelectricSignal.bit10 = getBit(word6, 2);
      this.photoelectricSignal.bit11 = getBit(word6, 3);
      this.photoelectricSignal.bit12 = getBit(word6, 4);
      this.photoelectricSignal.bit13 = getBit(word6, 5);
      this.photoelectricSignal.bit14 = getBit(word6, 6);
      this.photoelectricSignal.bit15 = getBit(word6, 7);

      // DBW8 电机运行信号 BIT 0~15
      let word8 = this.convertToWord(values.DBW8 ?? 0);
      this.motorRunning.bit0 = getBit(word8, 8);
      this.motorRunning.bit1 = getBit(word8, 9);
      this.motorRunning.bit2 = getBit(word8, 10);
      this.motorRunning.bit3 = getBit(word8, 11);
      this.motorRunning.bit4 = getBit(word8, 12);
      this.motorRunning.bit5 = getBit(word8, 13);
      this.motorRunning.bit6 = getBit(word8, 14);
      this.motorRunning.bit7 = getBit(word8, 15);
      this.motorRunning.bit8 = getBit(word8, 0);
      this.motorRunning.bit9 = getBit(word8, 1);
      this.motorRunning.bit10 = getBit(word8, 2);
      this.motorRunning.bit11 = getBit(word8, 3);
      this.motorRunning.bit12 = getBit(word8, 4);
      this.motorRunning.bit13 = getBit(word8, 5);
      this.motorRunning.bit14 = getBit(word8, 6);
      this.motorRunning.bit15 = getBit(word8, 7);

      // DBW10 A工位当前码垛数量
      this.stationAPalletQty = Number(values.DBW10 ?? 0);
      // DBW12 B工位当前码垛数量
      this.stationBPalletQty = Number(values.DBW12 ?? 0);
      // DBW14 A工位码垛完成呼叫AGV出垛
      this.stationACallAgv = Number(values.DBW14 ?? 0);
      // DBW16 B工位码垛完成呼叫AGV出垛
      this.stationBCallAgv = Number(values.DBW16 ?? 0);
      // DBW18 机器人抓取成功
      this.robotGrabSuccess = Number(values.DBW18 ?? 0);

      // DBB30 码垛位扫码信息
      this.palletScanCode = values.DBB30 ?? '';
      // DBB50 A工位空托盘码信息
      this.stationAEmptyTrayCode = values.DBB50 ?? '';
      // DBB70 B工位空托盘码信息
      this.stationBEmptyTrayCode = values.DBB70 ?? '';
    };
    ipcRenderer.on('receivedMsg', this.receivedMsgHandler);
    // 给PLC数据加载时间
    this._dataReadyTimer = setTimeout(() => {
      this.addLog('isDataReady数据加载完成');
      this.isDataReady = true;
    }, 3000);
  },
  methods: {
    // 获取队列托盘数量
    getQueueTrayCount(queueId) {
      const queue = this.queues.find((item) => item.id === queueId);
      return queue?.trayInfo?.length || 0;
    },
    runSampleTest() {
      const text = (this.testInput || '').trim() || '空';
      this.addLog(`测试项：${text}`);
    },
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      // 当展开面板时，刷新当前选中队列的托盘信息
      if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
        this.showTrays(this.selectedQueueIndex);
      }
    },
    // 显示订单查询对话框
    showOrderQueryDialog() {
      this.orderQueryDialogVisible = true;
    },
    toggleButtonState(button) {
      if (button === 'start') {
        this.$confirm('确定要全线启动吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线启动成功');
            this.addLog('全线启动成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'stop') {
        this.$confirm('确定要全线停止吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线停止成功');
            this.addLog('全线停止成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'reset') {
        this.$confirm('确定要全线暂停吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            this.buttonStates[button] = !this.buttonStates[button];
            ipcRenderer.send('writeSingleValueToPLC', 'W_DBW4', 1);
            setTimeout(() => {
              ipcRenderer.send('writeSingleValueToPLC', 'W_DBW4', 0);
            }, 2000);
            this.$message.success('全线暂停成功');
            this.addLog('全线暂停成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'fault_reset') {
        this.$confirm('确定要故障复位吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 0);
            }, 2000);
            this.$message.success('故障复位成功');
            this.addLog('故障复位成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'clear') {
        this.$confirm('确定要全线清空吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 把所有的队列、初始状态都清空（复制新数组触发监听器）
            this.queues.forEach((queue) => {
              queue.trayInfo = [];
            });
            this.runningLogs = []; // 修改为空数组
            this.alarmLogs = []; // 修改为空数组
            this.nowTrays = [];
            this.$message.success('全线清空成功');
            this.addLog('全线清空成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    initializeMarkers() {
      this.$nextTick(() => {
        this.updateMarkerPositions();
        window.addEventListener('resize', this.updateMarkerPositions);
      });
    },
    updateMarkerPositions() {
      const images = document.querySelectorAll('.floor-image');
      images.forEach((image) => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll(
          '.marker, .marker-with-panel, .marker-with-button, .marker-with-flow, .queue-marker, .motor-marker, .preheating-room-marker, .analysis-status-marker'
        );
        const carts = imageWrapper.querySelectorAll('.cart-container');
        const wrapperRect = imageWrapper.getBoundingClientRect();

        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;

        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;

        markers.forEach((marker) => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + x * scaleX}px`;
            marker.style.top = `${imageOffsetY + y * scaleY}px`;
          }
        });

        // 更新小车位置和大小
        carts.forEach((cart) => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + x * scaleX}px`;
            cart.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!isNaN(width)) {
              cart.style.width = `${width * scaleX}px`;
            }
          }
        });
      });
    },
    showTrays(index) {
      if (index < 0 || index >= this.queues.length) {
        this.nowTrays = [];
        return;
      }

      this.selectedQueueIndex = index;
      const selectedQueue = this.queues[index];

      if (!selectedQueue) {
        this.nowTrays = [];
        return;
      }

      try {
        // 确保 trayInfo 是数组
        const trayInfo = Array.isArray(selectedQueue.trayInfo)
          ? selectedQueue.trayInfo
          : [];

        this.nowTrays = trayInfo.map((tray, trayIndex) => {
          const packageNo = tray.packageNo || tray.trayCode || '';
          return {
            id: packageNo || `item-${trayIndex}`,
            name: packageNo ? `大包 ${packageNo}` : '未知大包',
            time: tray.trayTime || '',
            channel: tray.channel || '',
            packingWeight: tray.packingWeight || '',
            expectedQty: tray.expectedQty || '',
            allocatedPortNo: tray.allocatedPortNo || '',
            destinationCode: tray.destinationCode || ''
          };
        });
      } catch (error) {
        console.error('处理托盘信息时出错:', error);
        this.nowTrays = [];
      }
    },
    handleDragStart(event, tray, queueIndex, trayIndex) {
      if (!tray || queueIndex === undefined || trayIndex === undefined) return;

      this.isDragging = true;
      this.draggedTray = tray;
      this.draggedTrayIndex = trayIndex;
      this.dragSourceQueue = queueIndex;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);

      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    async handleDrop(targetQueueIndex) {
      const draggedTray = this.draggedTray;
      const dragSourceQueue = this.dragSourceQueue;
      const draggedTrayIndex = this.draggedTrayIndex;
      if (
        !draggedTray ||
        dragSourceQueue === null ||
        draggedTrayIndex === null ||
        targetQueueIndex === null
      )
        return;
      if (dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo)
        ? sourceQueue.trayInfo
        : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo)
        ? targetQueue.trayInfo
        : [];

      try {
        // 确认移动操作
        await this.$confirm(
          `确认将托盘 ${draggedTray.name} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}？`,
          '移动托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        if (
          draggedTrayIndex < 0 ||
          draggedTrayIndex >= sourceQueue.trayInfo.length
        ) {
          throw new Error('找不到要移动的托盘');
        }

        const trayIndex = draggedTrayIndex;

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (
          currentQueueIndex === targetQueueIndex ||
          currentQueueIndex === dragSourceQueue
        ) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(
          `托盘 ${draggedTray.name} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}`
        );

        this.$message({
          type: 'success',
          message: `${draggedTray.name} 已成功移动到 ${targetQueue.queueName}`,
          duration: 2000
        });
      } catch (error) {
        if (error === 'cancel' || error === 'close') {
          // 用户取消操作
          return;
        }
        console.error('移动托盘时出错:', error);
        this.$message.error(error.message || '移动托盘失败，请重试');
        this.addLog(`移动大包失败：${error.message || '请重试'}`);
      } finally {
        this.draggedTray = null;
        this.draggedTrayIndex = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      // 查找对应ID的队列
      const queueIndex = this.queues.findIndex((queue) => queue.id === queueId);
      if (queueIndex !== -1) {
        // 直接更新前端队列数据
        this.queues[queueIndex].trayInfo = trayInfo;
        // 添加日志
        this.addLog(`队列 ${this.queues[queueIndex].queueName} 数据已更新`);
      } else {
        this.$message.error('找不到队列ID: ' + queueId);
      }
    },
    async deleteTray(tray, index) {
      if (!this.selectedQueue) return;

      try {
        // 确认是否删除
        await this.$confirm(
          '确认要删除该托盘吗？删除后请注意是否需要同步修改PLC队列数据！',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 从队列中移除托盘，直接使用传递的index
        if (index >= 0 && index < this.selectedQueue.trayInfo.length) {
          this.selectedQueue.trayInfo.splice(index, 1);

          // 更新队列数据
          this.updateQueueTrays(
            this.selectedQueue.id,
            this.selectedQueue.trayInfo
          );

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(
            `托盘 ${tray.name} 已从 ${this.selectedQueue.queueName} 删除`
          );

          this.$message.success('托盘删除成功');
        }
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          this.$message.error('删除托盘失败，请重试');
        }
      }
    },
    // 上移托盘
    async moveTrayUp(index) {
      if (!this.selectedQueue || index <= 0) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const prevTray = trayInfo[index - 1];
        const currentLabel = this.nowTrays[index]?.name || '';
        const prevLabel = this.nowTrays[index - 1]?.name || '';

        // 确认上移操作
        await this.$confirm(
          `确认将 ${currentLabel} 上移一位（与 ${prevLabel} 交换位置）？`,
          '上移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = prevTray;
        trayInfo[index - 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `${currentLabel} 在 ${this.selectedQueue.queueName} 中上移`
        );

        this.$message.success('托盘上移成功');
      } catch (error) {
        if (error === 'cancel' || error === 'close') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘上移失败，请重试');
      }
    },
    // 下移托盘
    async moveTrayDown(index) {
      if (!this.selectedQueue || index >= this.nowTrays.length - 1) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const nextTray = trayInfo[index + 1];
        const currentLabel = this.nowTrays[index]?.name || '';
        const nextLabel = this.nowTrays[index + 1]?.name || '';

        // 确认下移操作
        await this.$confirm(
          `确认将 ${currentLabel} 下移一位（与 ${nextLabel} 交换位置）？`,
          '下移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = nextTray;
        trayInfo[index + 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `${currentLabel} 在 ${this.selectedQueue.queueName} 中下移`
        );

        this.$message.success('托盘下移成功');
      } catch (error) {
        if (error === 'cancel' || error === 'close') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘下移失败，请重试');
      }
    },
    // 点击队列标识
    handleQueueMarkerClick(queueId) {
      // 展开队列面板
      this.isQueueExpanded = true;
      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex((item) => item.id === queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    // 添加新的日志方法
    addLog(message, type = 'running') {
      const now = new Date();
      const log = {
        id: this.logId++,
        type,
        message,
        timestamp: now.getTime(),
        timeStr: now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        unread: type === 'alarm'
      };

      // 只要是日志就往运行日志中添加
      this.runningLogs.unshift(log);
      // 保持日志数量在合理范围内
      if (this.runningLogs.length > 100) {
        this.runningLogs.pop();
      }

      if (type === 'alarm') {
        this.alarmLogs.unshift(log);
        if (this.alarmLogs.length > 100) {
          this.alarmLogs.pop();
        }
      }
      // 同时写入本地文件
      const logTypeText = type === 'running' ? '运行日志' : '报警日志';
      ipcRenderer.send('writeLogToLocal', `[${logTypeText}] ${message}`);
    },
    toggleBitValue(obj, bit) {
      obj[bit] = obj[bit] === '1' ? '0' : '1';
    },
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0; // 负数转换为无符号的16位整数
      }
      return value; // 非负数保持不变
    },
    // 更新数据库队列信息
    updateQueueInfo(id) {
      const queue = this.queues.find((item) => item.id === id);
      if (!queue) return;
      HttpUtil.post('/queue_info/update', {
        id,
        trayInfo: JSON.stringify(queue.trayInfo)
      }).catch((err) => {
        this.$message.error(err);
      });
    },
    // 从数据库加载队列信息
    loadQueueInfoFromDatabase() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (res.data && res.data.length > 0) {
            // 遍历数据库返回的队列信息
            res.data.forEach((queueData) => {
              // 按id查找前端队列（数据库残留的已删除队列id匹配不到即跳过）
              const queueIndex = this.queues.findIndex(
                (item) => item.id === queueData.id
              );
              // 确保队列索引有效
              if (queueIndex >= 0 && queueIndex < this.queues.length) {
                try {
                  // 解析托盘信息JSON字符串
                  const trayInfo = queueData.trayInfo
                    ? JSON.parse(queueData.trayInfo)
                    : [];
                  // 赋值给对应的队列
                  this.queues[queueIndex].trayInfo = Array.isArray(trayInfo)
                    ? trayInfo
                    : [];
                  this.addLog(
                    `已加载队列${
                      queueData.queueName || queueData.id
                    }的托盘信息，共${
                      this.queues[queueIndex].trayInfo.length
                    }个托盘`
                  );
                } catch (error) {
                  console.error(
                    `解析队列${queueData.id}的托盘信息失败:`,
                    error
                  );
                  this.queues[queueIndex].trayInfo = [];
                  this.addLog(
                    `队列${queueData.id}托盘信息解析失败，已重置为空`
                  );
                }
              }
            });
            this.addLog('队列信息加载完成');
          } else {
            this.addLog('数据库中暂无队列信息');
          }
        })
        .catch((err) => {
          console.error('加载队列信息失败:', err);
          this.$message.error('加载队列信息失败: ' + err);
          this.addLog('队列信息加载失败');
        })
        .finally(() => {
          // 等本次赋值触发的监听先跑完，再允许写回，避免加载时把队列又提交一次
          this.$nextTick(() => {
            this._queueInitDone = true;
            if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
              this.showTrays(this.selectedQueueIndex);
            }
          });
        });
    },
    // 切换到报警日志时清除未读状态
    switchToAlarmLog() {
      this.activeLogType = 'alarm';
      // 清除所有报警日志的未读状态
      this.alarmLogs.forEach((log) => {
        log.unread = false;
      });
    }
  },
  beforeUnmount() {
    if (this._dataReadyTimer) {
      clearTimeout(this._dataReadyTimer);
      this._dataReadyTimer = null;
    }
    window.removeEventListener('resize', this.updateMarkerPositions);
    // 清理PLC数据接收监听器，防止重复注册和内存泄漏
    if (this.receivedMsgHandler) {
      ipcRenderer.removeListener('receivedMsg', this.receivedMsgHandler);
      this.receivedMsgHandler = null;
    }
    // 取消队列监听器
    if (this._queueWatchers && this._queueWatchers.length > 0) {
      this._queueWatchers.forEach((unwatch) => {
        if (typeof unwatch === 'function') {
          unwatch();
        }
      });
      this._queueWatchers = [];
    }
  }
};
</script>
<style lang="less" scoped>
.smart-workshop {
  --mp-surface: #ffffff;
  --mp-surface-muted: #eef2f8;
  --mp-border: #d4deef;
  --mp-border-light: #dce4f2;
  --mp-text: #262626;
  --mp-text-secondary: #8c8c8c;
  --mp-text-muted: #606266;
  --mp-accent: #4385ff;
  --mp-accent-hover: #3e7bfa;
  --mp-accent-deep: #2f54eb;
  --mp-accent-bg: rgba(67, 133, 255, 0.08);
  --mp-accent-bg-hover: rgba(67, 133, 255, 0.14);
  --mp-accent-border: rgba(67, 133, 255, 0.25);
  --mp-module-border: rgba(67, 133, 255, 0.42);
  --mp-module-header-start: #4572ef;
  --mp-module-header-mid: #5594ff;
  --mp-module-header-end: #5ad4f6;
  --mp-module-header-font-size: 17px;
  --mp-module-header-padding: 9px 13px;
  --mp-module-header-height: 38px;
  --mp-shadow: 0 2px 8px rgba(47, 84, 235, 0.08);
  --mp-shadow-lg: 0 4px 14px rgba(47, 84, 235, 0.1);
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;
  color: var(--mp-text);
  .header {
    position: relative;
    width: 100%;
    height: 80px;
    overflow: hidden;
    flex-shrink: 0;
    .header-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      position: relative;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 1;
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
      }

      .current-time {
        font-size: 24px;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    }
  }
  .content-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    .side-info-panel {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 5px;
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
      .plc-info-section,
      .operation-panel {
        background: var(--mp-surface);
        padding: 0;
        border-radius: 12px;
        box-shadow: var(--mp-shadow);
        border: 1px solid var(--mp-module-border);
        color: var(--mp-text);
        box-sizing: border-box;
        overflow: hidden;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--mp-module-header-font-size);
          color: #fff;
          font-weight: 700;
          margin: 0;
          padding: var(--mp-module-header-padding);
          border-bottom: none;
          background: linear-gradient(
            135deg,
            var(--mp-module-header-start) 0%,
            var(--mp-module-header-mid) 55%,
            var(--mp-module-header-end) 100%
          );
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          letter-spacing: 0.5px;
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .el-button {
            background: rgba(255, 255, 255, 0.16);
            border: 1px solid rgba(255, 255, 255, 0.45);
            color: #fff;
            font-size: 12px;
          }
          .el-button:hover {
            background: rgba(255, 255, 255, 0.28);
            border-color: rgba(255, 255, 255, 0.65);
            color: #fff;
          }
        }
        .scrollable-content {
          overflow-y: auto;
          padding: 10px 12px;
          box-sizing: border-box;
        }
      }
      .plc-info-section {
        .scrollable-content {
          .status-overview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            .data-card {
              box-sizing: border-box;
              height: 65px;
              width: 185px;
            }

            .data-card-border {
              width: 100%;
              height: 100%;
              border-radius: 12px;
              background: var(--mp-surface-muted);
              border: 1px solid var(--mp-border);
              box-shadow: none;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 0 12px;
              box-sizing: border-box;
            }

            .data-card-border-borderTop {
              font-weight: 400;
              letter-spacing: 0;
              color: var(--mp-text-secondary);
              text-align: left;
              font-size: 12px;
              line-height: 16px;
              margin-bottom: 4px;
            }
            .granient-text {
              background-image: linear-gradient(
                to right,
                rgba(72, 146, 254, 1),
                rgba(71, 207, 245, 1)
              );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
            }

            .data-card-border-borderDown {
              font-weight: 700;
              letter-spacing: 0;
              color: var(--mp-text);
              text-align: left;
              font-size: 15px;
              line-height: 20px;
              /* 添加省略号效果 */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
          }
        }
      }
      .log-section {
        background: var(--mp-surface);
        padding: 0;
        border-radius: 12px;
        box-shadow: var(--mp-shadow);
        border: 1px solid var(--mp-module-border);
        height: 257px;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--mp-module-header-padding);
          color: #fff;
          font-size: var(--mp-module-header-font-size);
          font-weight: 700;
          border-bottom: none;
          background: linear-gradient(
            135deg,
            var(--mp-module-header-start) 0%,
            var(--mp-module-header-mid) 55%,
            var(--mp-module-header-end) 100%
          );
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          letter-spacing: 0.5px;
          .log-tabs {
            display: flex;
            gap: 4px;
            background: rgba(0, 0, 0, 0.08);
            padding: 3px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          .log-tab {
            position: relative;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.82);
            cursor: pointer;
            padding: 3px 11px;
            border-radius: 4px;
            transition: all 0.3s ease;
            .alarm-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              background: #f56c6c;
              color: #fff;
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 10px;
              min-width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          .log-tab.active {
            color: var(--mp-accent-deep);
            background: #fff;
            font-weight: 600;
          }
          .log-tab:hover:not(.active) {
            color: #fff;
            background: rgba(255, 255, 255, 0.16);
          }
        }
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 6px 8px;
          box-sizing: border-box;
          .log-list {
            padding: 0;
            width: 100%;
            box-sizing: border-box;
            .log-item {
              background: var(--mp-surface-muted);
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
              cursor: pointer;
              width: 100%;
              box-sizing: border-box;
              border: 1px solid var(--mp-border);
              .log-time {
                font-size: 12px;
                color: var(--mp-text-secondary);
                margin-bottom: 6px;
              }
              .log-item-content {
                color: var(--mp-text);
                font-size: 13px;
                line-height: 1.6;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: normal;
                hyphens: auto;
                display: block;
                width: 100%;
                padding-right: 10px;
              }
            }
            .log-item:hover {
              background: #eef2f8;
              border-color: var(--mp-accent-border);
            }

            .log-item.alarm {
              background: rgba(245, 108, 108, 0.06);
            }

            .log-item.alarm.unread {
              background: rgba(245, 108, 108, 0.1);
              border-left: 2px solid #f56c6c;
            }
            /* 添加空状态样式 */
            .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 0;
              color: var(--mp-text-secondary);
              .el-icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: #c0c4cc;
              }
              p {
                font-size: 14px;
                margin: 0 0 16px 0;
              }
              .el-button {
                color: #4385ff;
                font-size: 14px;
                .el-icon {
                  font-size: 14px;
                  margin-right: 4px;
                  color: inherit;
                }
              }
              .el-button:hover {
                color: #3e7bfa;
              }
            }
          }
        }
        .scrollable-content::-webkit-scrollbar {
          width: 4px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: rgba(67, 133, 255, 0.12);
          border-radius: 2px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: rgba(67, 133, 255, 0.25);
        }
      }
      .operation-panel {
        .operation-buttons {
          display: flex;
          justify-content: flex-start;
          gap: 8px;
          margin-top: 0;
          padding: 10px 12px;
          box-sizing: border-box;
          button {
            width: 70px;
            height: 70px;
            font-size: 0.8em;
            color: #fff;
            background: linear-gradient(135deg, #4385ff, #2f54eb);
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(67, 133, 255, 0.25);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 8px;
            gap: 5px;
            .el-icon {
              font-size: 1.8em;
            }
            span {
              font-size: 12px;
              margin-top: 4px;
            }
          }
          button:hover {
            background: linear-gradient(135deg, #5a9bff, #4385ff);
            box-shadow: 0 6px 16px rgba(67, 133, 255, 0.35);
          }
          button.pressed {
            transform: scale(0.98);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
          }
          button.btn-start.pressed {
            background: linear-gradient(135deg, #52c41a, #237804);
          }
          button.btn-start.pressed:hover {
            background: linear-gradient(135deg, #73d13d, #389e0d);
          }
          button.btn-stop.pressed {
            background: linear-gradient(135deg, #ff4d4f, #a8071a);
          }
          button.btn-stop.pressed:hover {
            background: linear-gradient(135deg, #ff7875, #cf1322);
          }
          button.btn-reset.pressed {
            background: linear-gradient(135deg, #faad14, #d48806);
          }
          button.btn-reset.pressed:hover {
            background: linear-gradient(135deg, #ffc53d, #fa8c16);
          }
          button.btn-disable.pressed {
            background: linear-gradient(135deg, #8c8c8c, #595959);
          }
          button.btn-disable.pressed:hover {
            background: linear-gradient(135deg, #a6a6a6, #737373);
          }
        }
      }
    }
    .main-content {
      flex: 1;
      display: flex;
      padding: 5px 5px 5px 0px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      .floor-container {
        display: flex;
        gap: 10px;
        height: 100%;
        width: 100%;
        min-height: 0;

        .floor-left {
          .floor-image-container {
            flex: 1;
            background: #ffffff;
            padding: 4px 6px 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--mp-border);
            min-height: 0;
            margin: 0;
            height: calc(100% - var(--mp-module-header-height));
            position: relative;
            box-sizing: border-box;

            .floor-map-legend {
              position: absolute;
              bottom: 10px;
              left: 10px;
              z-index: 20;
              display: flex;
              flex-direction: column;
              gap: 6px;
              padding: 8px 10px;
              background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.96) 0%,
                rgba(245, 248, 252, 0.94) 100%
              );
              border: 1px solid var(--mp-border);
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              pointer-events: none;

              .legend-item {
                display: grid;
                grid-template-columns: 18px 1fr;
                align-items: center;
                column-gap: 8px;
              }

              .legend-text {
                display: flex;
                flex-direction: column;
                gap: 1px;
                line-height: 1.2;
                min-width: 0;
              }

              .legend-name {
                font-size: 12px;
                font-weight: 600;
                color: var(--mp-text);
              }

              .legend-desc {
                font-size: 10px;
                color: var(--mp-text-muted, #6b7280);
              }

              .legend-dot {
                justify-self: center;
                display: inline-block;
                width: 10px;
                height: 10px;
                font-style: normal;

                &--photo {
                  border-radius: 50%;
                  background: rgba(128, 128, 128, 0.85);
                }

                &--motor {
                  border-radius: 1px;
                  background: rgba(128, 128, 128, 0.85);
                }
              }

              .legend-arrow {
                justify-self: center;
                position: relative;
                display: inline-block;
                width: 18px;
                height: 10px;
                font-style: normal;

                &::before {
                  content: '';
                  position: absolute;
                  left: 0;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 8px;
                  height: 6px;
                  background-color: #4385ff;
                }

                &::after {
                  content: '';
                  position: absolute;
                  left: 6px;
                  top: 50%;
                  transform: translateY(-50%) rotate(45deg);
                  width: 0;
                  height: 0;
                  border-right: 8px solid #4385ff;
                  border-bottom: 8px solid transparent;
                }
              }
            }

            .image-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: white;
              .floor-image {
                display: block;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
              }
              /* --- 光电点位样式 --- */
              .marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: #4385ff;
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0;
                  transition: opacity 0.3s;
                  pointer-events: none; /* 添加此行 */
                }
              }
              .marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色核心 */
              }
              /* 扫描状态 (红色) */
              .marker.scanning::before {
                background: rgba(255, 0, 0, 0.8); /* 红色核心 */
              }

              /* 默认隐藏标签，hover时显示 */
              .marker:hover .marker-label {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); /* 灰色辉光 */
              }
              /* 始终显示标签的点位 */
              .marker-show-label .marker-label {
                opacity: 1;
              }
              /* 控制标签位置的样式 */
              .marker.label-top .marker-label {
                top: auto; /* 重置默认 top */
                bottom: calc(100% + 5px); /* 定位到上方 */
                left: 50%;
                transform: translateX(-50%);
              }
              .marker.label-left .marker-label {
                top: 50%; /* 垂直居中 */
                left: auto; /* 重置默认 left */
                right: calc(100% + 5px); /* 定位到左方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              .marker.label-right .marker-label {
                top: 50%; /* 垂直居中 */
                left: calc(100% + 5px); /* 定位到右方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              /* --- 光电点位样式结束 --- */

              /* --- 新增电机点位样式 --- */
              .motor-marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: rgba(0, 0, 0, 0.8);
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0; /* 默认隐藏 */
                  transition: opacity 0.3s;
                }
              }

              .motor-marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色方块 */
                /* 无 border-radius，保持方形 */
              }

              .motor-marker.running::before {
                background: #00ff3f; /* 运行状态绿色方块 */
              }

              /* 始终显示电机标签 */
              .motor-marker.marker-show-label .marker-label {
                opacity: 1;
              }
              /* 悬停显示电机标签 */
              .motor-marker:hover .marker-label {
                opacity: 1;
              }

              /* 控制电机标签位置的样式 (复制并适配) */
              .motor-marker.label-top .marker-label {
                top: auto;
                bottom: calc(100% + 5px);
                left: 50%;
                transform: translateX(-50%);
              }
              .motor-marker.label-left .marker-label {
                top: 50%;
                left: auto;
                right: calc(100% + 5px);
                transform: translateY(-50%);
              }
              .motor-marker.label-right .marker-label {
                top: 50%;
                left: calc(100% + 5px);
                transform: translateY(-50%);
              }
              /* --- 电机点位样式结束 --- */

              /* 流水线流动箭头容器定位（置于光电/电机之下，避免遮挡点位） */
              .marker-with-flow {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 1;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              /* 带数据面板的标识点样式 */
              .marker-with-panel {
                position: absolute;
                width: 16px;
                height: 16px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                .data-panel {
                  position: absolute;
                  background: linear-gradient(135deg, #0e1a27, #3c4c63);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  border-radius: 8px;
                  padding: 12px;
                  width: 170px;
                  // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  opacity: 0;
                  transition: all 0.3s ease;
                  pointer-events: none;
                  .data-panel-header {
                    font-size: 14px;
                    color: #409eff;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(64, 158, 255, 0.2);
                  }
                  .data-panel-content {
                    font-size: 12px;
                    .status-dot {
                      display: inline-block;
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      margin-right: 4px;
                    }
                    .data-panel-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      color: rgba(255, 255, 255, 0.9);
                      .data-panel-label {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        white-space: nowrap;
                        flex-shrink: 0;
                        margin-right: 6px;
                        display: inline-flex;
                        align-items: center;
                      }
                      .barcode-value {
                        flex: 1;
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }
                    }
                    /* 新增：复选框组样式 */
                    .checkbox-group {
                      display: flex;
                      justify-content: space-between; /* 或 space-between */
                      align-items: center;
                      padding-top: 5px; /* 增加一点顶部间距 */
                    }

                    .checkbox-group .el-checkbox {
                      margin-right: 10px; /* 增加复选框之间的间距 */
                    }

                    /* 调整复选框标签颜色 */
                    .checkbox-group :deep(.el-checkbox__label) {
                      color: rgba(255, 255, 255, 0.8); /* 调整标签颜色 */
                      font-size: 12px; /* 调整标签字体大小 */
                    }

                    /* 执行控制区域的特殊样式 */
                    .exec-controls {
                      display: flex;
                      align-items: center;
                      gap: 3px;
                    }

                    /* 调整选中状态下的颜色 */
                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked + .el-checkbox__label
                      ) {
                      color: #0ac5a8; /* 选中时标签颜色 */
                    }

                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked .el-checkbox__inner
                      ) {
                      background-color: #0ac5a8; /* 选中时背景色 */
                      border-color: #0ac5a8; /* 选中时边框色 */
                    }

                    /* 扫码分组网格布局 */
                    .scan-groups-grid {
                      display: flex;
                      flex-direction: column;
                      gap: 12px;
                    }

                    .scan-group-row {
                      display: grid;
                      grid-template-columns: repeat(4, 1fr);
                      gap: 8px;
                    }

                    .scan-group {
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      min-height: 50px;
                      background: rgba(64, 158, 255, 0.08);
                      border: 1px solid rgba(64, 158, 255, 0.2);
                      border-left: 3px solid #409eff;
                      border-radius: 6px;
                      padding: 3px 10px;
                    }

                    .scan-group.with-watermark {
                      position: relative;
                      overflow: hidden;
                    }

                    .belt-ids-card {
                      background: rgba(10, 197, 168, 0.1);
                      border-color: rgba(10, 197, 168, 0.25);
                      border-left-color: #0ac5a8;

                      .group-watermark {
                        color: rgba(10, 197, 168, 0.55);
                      }
                    }

                    .sort-port-card {
                      background: rgba(120, 150, 200, 0.1);
                      border-color: rgba(120, 150, 200, 0.25);
                      border-left-color: #7896c8;

                      .group-watermark {
                        color: rgba(170, 195, 235, 0.65);
                        text-shadow: 0 0 5px rgba(0, 0, 0, 0.55);
                      }

                      .port-send-btn {
                        background: rgba(120, 150, 200, 0.1);
                        border-color: rgba(120, 150, 200, 0.3);
                        color: #8aa8d0;

                        &:hover {
                          background: rgba(120, 150, 200, 0.2);
                          border-color: rgba(120, 150, 200, 0.5);
                          color: #a8c0e0;
                        }
                      }
                    }

                    .group-watermark {
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);
                      font-size: 24px;
                      font-weight: 900;
                      color: rgba(100, 185, 255, 0.65);
                      text-shadow: 0 0 5px rgba(0, 0, 0, 0.55);
                      pointer-events: none;
                      user-select: none;
                      z-index: 0;
                      letter-spacing: -1px;
                    }

                    .group-items {
                      display: flex;
                      flex-direction: column;
                      gap: 3px;
                      position: relative;
                      z-index: 1;
                    }

                    .scan-item {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding: 1px 0;
                    }

                    .scan-label {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.75);
                    }

                    .scan-value {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.95);
                      font-weight: 500;
                      text-align: right;
                      flex: 1;
                      word-break: break-all;
                    }

                    .panel-divider {
                      height: 1px;
                      background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(64, 158, 255, 0.4) 20%,
                        rgba(64, 158, 255, 0.4) 80%,
                        transparent 100%
                      );
                      margin: 0;
                    }

                    .port-send-btn {
                      background: rgba(64, 158, 255, 0.15);
                      border: 1px solid rgba(64, 158, 255, 0.4);
                      color: rgba(64, 158, 255, 0.9);
                      border-radius: 3px;
                      padding: 2px 6px;
                      font-size: 14px;
                      cursor: pointer;
                      transition: all 0.2s;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      line-height: 1;
                    }

                    .port-send-btn:hover {
                      background: rgba(64, 158, 255, 0.3);
                      border-color: rgba(64, 158, 255, 0.6);
                      color: #409eff;
                    }
                  }
                }

                /* 管理员密码对话框样式 */
                .admin-password-content {
                  padding: 20px 0;
                }

                .admin-password-content .el-form-item {
                  margin-bottom: 20px;
                }

                .admin-password-content .el-input {
                  width: 100%;
                }

                .dialog-footer {
                  text-align: right;
                  padding-top: 20px;
                }
                /* 面板位置样式 */
                .data-panel.position-right {
                  left: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-left {
                  right: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-top {
                  bottom: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .data-panel.position-bottom {
                  top: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                /* 始终显示的面板 */
                .data-panel.always-show {
                  opacity: 1;
                  pointer-events: auto; /* 重新启用指针事件 */
                }
                /* 竖向布局样式 */
                .data-panel.vertical-layout {
                  width: 110px;
                  padding: 8px;
                  .data-panel-row {
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  .data-panel-label {
                    margin-bottom: 2px;
                  }
                }
              }
              /* 悬停时显示面板 */
              .marker-with-panel:hover .data-panel:not(.always-show) {
                opacity: 1;
              }

              /* 带按钮的标识点样式 */
              .marker-with-button {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 5;
                cursor: pointer;
              }
              .marker-with-button .warehouse-btn {
                background: linear-gradient(135deg, #0e1a27, #3c4c63);
                color: white;
                font-weight: bold;
                border: none;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                border-radius: 4px;
                padding: 10px 15px;
                transition: all 0.3s ease;
              }
              .marker-with-button .warehouse-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              }

              /* 预热房选择样式 */
              .preheating-room-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 10;
                background: linear-gradient(135deg, #005aff 0%, #000000 100%);
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                width: 80px;
                .preheating-room-content {
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                  .preheating-room-header {
                    width: 100%;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 11px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.2);
                    font-weight: bold;
                  }
                  .preheating-room-body {
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                  }
                }
              }
              .preheating-room-marker :deep(.el-select) {
                width: 100%;
                --el-fill-color-blank: rgba(255, 255, 255, 0.15);
                --el-border-color: rgba(255, 255, 255, 0.2);
                --el-border-color-hover: rgba(255, 255, 255, 0.45);
                --el-text-color-regular: #fff;
                --el-text-color-placeholder: rgba(255, 255, 255, 0.5);
              }
              .preheating-room-marker :deep(.el-select__wrapper),
              .preheating-room-marker :deep(.el-input__wrapper) {
                background-color: rgba(255, 255, 255, 0.15);
                box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
                min-height: 24px;
                height: 24px;
                padding: 0 8px;
                border-radius: 3px;
              }
              .preheating-room-marker :deep(.el-select__selected-item),
              .preheating-room-marker :deep(.el-input__inner),
              .preheating-room-marker :deep(.el-select__placeholder) {
                color: #fff;
                font-size: 11px;
                line-height: 24px;
                height: 24px;
              }

              /* 解析状态标签样式 */
              .analysis-status-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 15;
              }

              /* 自定义状态标签样式，让绿色更突出 */
              .analysis-status-marker :deep(.el-tag) {
                background-color: #00cc44;
                border: 1px solid #00aa33;
                color: #ffffff;
              }
            }
          }
        }
        .floor-left {
          flex: 1;
          background: var(--mp-surface);
          padding: 0;
          border-radius: 12px;
          box-shadow: var(--mp-shadow);
          border: 1px solid var(--mp-module-border);
          color: var(--mp-text);
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
          .floor-title {
            font-size: var(--mp-module-header-font-size);
            color: #fff;
            font-weight: 700;
            padding: var(--mp-module-header-padding);
            flex-shrink: 0;
            border-bottom: none;
            background: linear-gradient(
              135deg,
              var(--mp-module-header-start) 0%,
              var(--mp-module-header-mid) 55%,
              var(--mp-module-header-end) 100%
            );
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            letter-spacing: 0.5px;
            .el-icon {
              margin-right: 6px;
            }
          }
          .floor-image-container {
            .image-wrapper {
              .queue-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 10;
                background: rgba(10, 30, 50, 0.85);
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid rgba(64, 158, 255, 0.5);
                transition: all 0.3s ease;
                min-width: 40px;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                color: #ffffff;
                .queue-marker-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  color: #fff;
                  font-size: 12px;
                  .queue-marker-name {
                    color: #fff;
                  }

                  .queue-marker-count {
                    display: inline-flex;
                    align-items: baseline;
                    font-size: 14px;
                    font-weight: bold;
                    color: #409eff;

                    .queue-marker-count__plc {
                      color: #e6a23c;
                    }
                  }
                }
              }
              .queue-marker:hover {
                background: rgba(24, 61, 97, 0.9);
                border-color: rgba(64, 158, 255, 0.6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              }

              /* 特殊队列标记样式 - 上货1、上货2、缓存区1、缓存区2 */
              .special-queue {
                background: rgba(0, 123, 191, 0.9) !important;
                border: 1px solid rgba(0, 123, 191, 0.7) !important;
              }

              .special-queue .queue-marker-count {
                color: #ffffff !important;
              }

              .special-queue .queue-marker-name {
                color: #ffffff !important;
              }

              .queue-marker--locked {
                border-color: rgba(245, 108, 108, 0.7) !important;
                background: rgba(60, 20, 20, 0.85) !important;
              }

              .queue-marker-lock-overlay {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 16px;
                height: 16px;
                background: #f56c6c;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                cursor: pointer;
                z-index: 10;
              }

              .queue-marker-lock-overlay:hover {
                background: #e6413e;
                transform: scale(1.2);
              }

              // AGV调用失败样式
              .queue-marker--failed {
                border-color: rgba(230, 162, 60, 0.7) !important;
                background: rgba(60, 40, 10, 0.85) !important;
              }

              .queue-marker-fail-overlay {
                position: absolute;
                top: -6px;
                left: -6px;
                width: 16px;
                height: 16px;
                background: #e6a23c;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                z-index: 10;
              }

              .special-queue:hover {
                background: rgba(0, 123, 191, 0.95) !important;
                border-color: rgba(40, 167, 235, 0.8) !important;
              }

              /* 添加小车样式 */
              .cart-container {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }

              .cart-image {
                width: 100%;
                height: auto;
                object-fit: contain;
              }
            }
          }
        }
      }
    }
  }
  .side-info-panel-queue {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    transition: all 0.3s ease;
    pointer-events: auto;
    /* 基础样式 */
    .queue-section {
      background: rgba(30, 42, 56);
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.1);
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: color 0.3s ease;
        font-size: 20px;
        color: #7eb8ff;
        font-weight: 900;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      .expandable-content-queue {
        flex: 1;
        min-height: 0;
        display: flex;
        overflow: hidden;
        height: calc(100% - 50px);
        .queue-container {
          flex: 1;
          display: flex;
          background: rgba(30, 42, 56, 0.9);
          border-radius: 12px;
          padding: 15px;
          gap: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          .queue-container-left {
            width: 280px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding-right: 15px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            height: 100%;
            min-height: 0;
            /* 队列项样式 */
            .queue {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: nowrap;
              background: rgba(48, 65, 85, 0.9);
              border-radius: 8px;
              padding: 12px 15px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: 1px solid rgba(255, 255, 255, 0.15);

              .queue-name {
                flex-shrink: 0;
              }

              .tray-count {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 10px;
                min-width: 24px;
                text-align: center;
                flex-shrink: 0;
              }

              .el-tag {
                flex-shrink: 1;
                min-width: 0;
                max-width: 130px;
                overflow: hidden;
                .el-tag__content {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }
            }

            .queue:hover {
              background: rgba(48, 65, 85, 1);
              border-color: rgba(64, 158, 255, 0.45);
              transform: translateX(2px);
            }

            .queue.active {
              background: rgba(64, 158, 255, 0.14);
              border-color: rgba(64, 158, 255, 0.45);
            }
          }
          /* 滚动条样式 */
          .queue-container-left::-webkit-scrollbar,
          .tray-list::-webkit-scrollbar {
            width: 4px;
          }

          .queue-container-left::-webkit-scrollbar-track,
          .tray-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
          }

          .queue-container-left::-webkit-scrollbar-thumb,
          .tray-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }

          .queue-container-left::-webkit-scrollbar-thumb:hover,
          .tray-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          .queue-container-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 0 15px;
            height: 100%;
            min-height: 0;
            .selected-queue-header {
              flex-shrink: 0;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              h3 {
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
              }
              .queue-header-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                .el-button {
                  background: rgba(64, 158, 255, 0.18);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  color: #7eb8ff;
                }
                .el-button:hover:not(:disabled) {
                  background: rgba(64, 158, 255, 0.28);
                  border-color: rgba(64, 158, 255, 0.45);
                  color: #fff;
                }
                .tray-total {
                  background: rgba(255, 255, 255, 0.1);
                  color: rgba(255, 255, 255, 0.7);
                  font-size: 13px;
                  padding: 4px 12px;
                  border-radius: 15px;
                  cursor: pointer;
                }
              }
            }
            .tray-list {
              flex: 1;
              overflow-y: auto;
              min-height: 0;
              padding-right: 5px;

              /* 托盘项样式 */
              .tray-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(48, 65, 85, 0.9);
                margin: 0 0 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                cursor: move;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.15);
                position: relative;

                .tray-info {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  width: 100%;
                  .tray-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    .tray-name {
                      font-weight: 500;
                      color: rgba(255, 255, 255, 0.9);
                      font-size: 14px;
                    }

                    .tray-batch-group {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      flex-wrap: wrap;
                      justify-content: flex-end;
                    }

                    .tray-batch {
                      font-size: 12px;
                      color: #7eb8ff;
                      background: rgba(64, 158, 255, 0.1);
                      padding: 2px 8px;
                      border-radius: 4px;
                      white-space: nowrap;

                      .sequence-number {
                        color: #ffa500;
                        font-weight: bold;
                        margin-left: 4px;
                      }
                    }

                    .tray-detail {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.7);
                      word-break: break-word;
                      line-height: 1.4;
                      flex: 1;
                      text-align: left;
                    }
                    .allocated-port {
                      color: #409eff;
                      font-weight: bold;
                      flex: 0 0 auto;
                    }
                    .destination-code {
                      color: #e6a23c;
                      font-weight: bold;
                      flex: 0 0 auto;
                    }
                  }
                  .tray-time {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
                .tray-actions {
                  display: flex;
                  gap: 4px;
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                }

                .move-btn {
                  width: 24px;
                  height: 24px;
                  padding: 0;
                  border-radius: 50%;

                  &:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                  }

                  &:not(.is-disabled):hover {
                    background-color: #409eff;
                    border-color: #409eff;
                  }
                }

                .el-button {
                  &:not(.move-btn) {
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border-radius: 50%;
                  }
                }
              }
              .tray-item:hover {
                background: rgba(48, 65, 85, 1);
                border-color: rgba(64, 158, 255, 0.45);
                transform: translateX(2px);
                .tray-actions {
                  opacity: 1;
                }
              }
              .tray-item:last-child {
                margin-bottom: 0;
              }
              .tray-item.dragging {
                opacity: 0.6;
                transform: scale(0.98);
                border: 1px dashed rgba(255, 255, 255, 0.3);
              }
              /* 添加空状态样式 */
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 0;
                color: rgba(255, 255, 255, 0.6);
                .el-icon {
                  font-size: 48px;
                  margin-bottom: 16px;
                  color: rgba(255, 255, 255, 0.3);
                }
                p {
                  font-size: 14px;
                  margin: 0 0 16px 0;
                }
                .el-button {
                  color: #7eb8ff;
                  font-size: 14px;
                  .el-icon {
                    font-size: 14px;
                    margin-right: 4px;
                    color: inherit;
                  }
                }
                .el-button:hover {
                  color: #6aabf5;
                }
              }
            }
          }
        }
      }
    }
    /* 展开状态的样式 */
    .queue-section.expanded {
      padding: 15px;
      width: 850px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* 收起状态的样式 */
    .queue-section:not(.expanded) {
      width: 40px;
      height: 40px;
      padding: 0;
      background: none;
      box-shadow: none;
      border: none;
      .section-header {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #4385ff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(67, 133, 255, 0.25);
        transition: all 0.3s ease;
        padding: 0;
        span {
          display: none;
        }
        .el-icon {
          color: #fff;
          font-size: 20px;
          animation: rotate 10s linear infinite;
        }
      }
      .section-header:hover {
        transform: scale(1.1);
        background: #3e7bfa;
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

/* 添加新的测试面板样式 */
.test-panel-container {
  position: absolute; /* 修改位置，为测试按钮留出空间 */
  right: 80px; /* 修改位置，为队列按钮留出空间 */
  top: 20px;
  z-index: 1000;
}

.test-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4385ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(67, 133, 255, 0.25);
  transition: all 0.3s ease;
}

.test-toggle-btn:hover {
  transform: scale(1.1);
  background: #3e7bfa;
}

.test-toggle-btn .el-icon {
  color: #fff;
  font-size: 20px;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-panel {
  position: absolute;
  right: 50px;
  top: 0;
  width: 300px;
  max-height: 80vh; /* 限制最大高度为视窗高度的80% */
  background: rgba(30, 42, 56, 0.98);
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  transform-origin: top right;
  opacity: 1;
  transform: scale(1);
  display: flex;
  flex-direction: column;
}

.test-panel.collapsed {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.test-panel-header {
  padding: 15px;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 15px 15px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7eb8ff;
  font-weight: bold;
  pointer-events: auto;
  flex-shrink: 0;
}

.test-panel-content {
  padding: 10px;
  overflow-y: auto;
  pointer-events: auto;
  flex: 1;
}

/* 添加滚动条样式 */
.test-panel-content::-webkit-scrollbar {
  width: 4px;
}

.test-panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.28);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.45);
}

.test-panel-header .el-icon {
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-panel-header .el-icon:hover {
  color: #ff4d4f;
}

.test-section {
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.test-label {
  display: block;
  color: #7eb8ff;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: bold;
}

.position-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.position-btn {
  padding: 6px 12px;
  background: rgba(64, 158, 255, 0.18);
  border: 1px solid rgba(64, 158, 255, 0.35);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.position-btn:hover {
  background: rgba(64, 158, 255, 0.32);
}

.position-btn:active {
  transform: scale(0.95);
}

/* 小车位置滑块样式 */
.cart-position-test-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.cart-position-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-position-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-value {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.cart-position-slider-container {
  padding: 5px 0;
}

.cart-position-slider {
  width: 100%;
}

.cart-position-slider :deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
  height: 6px;
}

.cart-position-slider :deep(.el-slider__bar) {
  background-color: #409eff;
  height: 6px;
}

.cart-position-slider :deep(.el-slider__button) {
  border: 2px solid #409eff;
  background-color: #fff;
  width: 20px;
  height: 20px;
}

.cart-position-slider :deep(.el-slider__button:hover) {
  border-color: #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.45);
}

/* 测试添加结束 */

.qrcode-test-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.qrcode-test-container .el-button {
  padding: 4px 8px;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.qrcode-btn-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.qrcode-btn-grid .el-button {
  width: 100%;
}

.qrcode-input-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.qrcode-input-grid .qrcode-input-group {
  gap: 2px;
}

.qrcode-input-grid .qrcode-label {
  width: 32px;
  font-size: 11px;
}

.qrcode-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qrcode-label {
  width: 40px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  flex-shrink: 0;
}

.send-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.qrcode-input {
  flex: 1;
  // Element Plus：背景/边框在 wrapper，文字色在 inner；旧写法只改 inner 会导致白字打在浅色底上看不见
  --el-input-bg-color: rgba(255, 255, 255, 0.1);
  --el-input-text-color: #fff;
  --el-input-border-color: rgba(64, 158, 255, 0.25);
  --el-input-hover-border-color: #409eff;
  --el-input-focus-border-color: #409eff;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.4);
}

.qrcode-input :deep(.el-input__wrapper) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--el-input-border-color) inset;
  padding: 0 6px;
  min-height: 24px;
  height: 24px;
}

.qrcode-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-input-hover-border-color) inset;
}

.qrcode-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset;
}

.qrcode-input :deep(.el-input__inner) {
  color: var(--el-input-text-color);
  height: 24px;
  line-height: 24px;
  font-size: 11px;
}

.qrcode-input :deep(.el-input__inner::placeholder) {
  font-size: 11px;
  color: var(--el-input-placeholder-color);
}

.qrcode-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.qrcode-actions .el-button {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
}

.qrcode-actions .el-button:hover {
  background: rgba(64, 158, 255, 0.28);
  border-color: rgba(64, 158, 255, 0.45);
  color: #fff;
}

/* PLC 变量写入测试分组样式 */
.plc-test-wrapper :deep(.el-collapse) {
  border: none;
  background: transparent;
}

.plc-test-wrapper :deep(.el-collapse-item__header) {
  background: rgba(64, 158, 255, 0.1);
  color: #7eb8ff;
  border: none;
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}

.plc-test-wrapper :deep(.el-collapse-item__header.is-active) {
  background: rgba(64, 158, 255, 0.18);
}

.plc-test-wrapper :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.plc-test-wrapper :deep(.el-collapse-item__content) {
  padding: 8px 4px;
  color: #fff;
}

.compact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.compact-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compact-label {
  width: 70px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  text-align: right;
}

.plc-test-wrapper :deep(.el-input) {
  --el-input-bg-color: rgba(255, 255, 255, 0.1);
  --el-input-text-color: #fff;
  --el-input-border-color: rgba(64, 158, 255, 0.25);
  --el-input-hover-border-color: #409eff;
  --el-input-focus-border-color: #409eff;
}

.plc-test-wrapper :deep(.el-input__wrapper) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--el-input-border-color) inset;
  padding: 0 5px;
  min-height: 24px;
  height: 24px;
}

.plc-test-wrapper :deep(.el-input__inner) {
  height: 24px;
  line-height: 24px;
  color: var(--el-input-text-color);
}

.plc-test-wrapper :deep(.el-button--small) {
  padding: 4px 8px;
  min-width: 32px;
}

/* 添加队列移动相关样式 */
.queue-move-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.queue-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-move-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.queue-move-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.upload-area-actions {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

.upload-area-actions .el-button {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
  width: 100%;
}

.upload-area-actions .el-button:hover:not(:disabled) {
  background: rgba(64, 158, 255, 0.28);
  border-color: rgba(64, 158, 255, 0.45);
  color: #fff;
}

.upload-area-actions .el-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.quantity-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.quantity-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quantity-title {
  font-size: 14px;
  color: #7eb8ff;
  font-weight: bold;
}

.quantity-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 42, 56, 0.8);
  border-radius: 4px;
  padding: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  margin-bottom: 5px;

  .quantity-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    min-width: 30px;
  }

  .quantity-value {
    font-size: 14px;
    color: #7eb8ff;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
  }

  .quantity-buttons {
    display: flex;
    gap: 5px;

    .quantity-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: rgba(64, 158, 255, 0.18);
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }

      &.plus {
        background: rgba(64, 158, 255, 0.32);
        &:hover {
          background: rgba(64, 158, 255, 0.48);
        }
      }

      &.minus {
        background: rgba(245, 108, 108, 0.3);
        &:hover {
          background: rgba(245, 108, 108, 0.5);
        }
      }
    }
  }
}

/* 添加新的测试面板样式 */
.task-test-container {
  margin-top: 10px;

  .task-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

/* 托盘检索弹窗样式 */
.tray-search-form {
  .search-result {
    margin-top: 20px;
  }

  .no-result {
    margin-top: 20px;

    .no-result-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
      background: rgba(30, 42, 56, 0.8);
      border-radius: 8px;
      border: 1px solid rgba(255, 193, 7, 0.3);

      .el-icon {
        font-size: 48px;
        color: #ffc107;
        margin-bottom: 15px;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin: 0;
        text-align: center;
      }
    }
  }
}

/* 队列信息标题操作按钮样式 */
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;

  .arrow-icon {
    cursor: pointer;
    transition: all 0.3s ease;
    color: #7eb8ff;
    font-size: 16px;

    &:hover {
      color: #fff;
      transform: scale(1.1);
    }
  }
}

/* 流动箭头（scoped 根级；配色与页面 --mp-accent 主题一致） */
.conveyor-arrow-item {
  position: relative;
  display: inline-block;
  width: 45px;
  height: 34px;
}
.conveyor-arrow-item::before {
  content: '';
  display: inline-block;
  position: relative;
  width: 20px;
  height: 16px;
  background-color: #4385ff;
}
.conveyor-arrow-item::after {
  content: '';
  position: relative;
  top: 4px;
  right: 12px;
  display: inline-block;
  width: 0;
  height: 0;
  border-right: 24px solid #4385ff;
  border-bottom: 24px solid transparent;
  transform: rotate(45deg);
}

.flow-item {
  height: 34px;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  backface-visibility: hidden;
  .conveyor-arrow-item {
    position: relative;
    animation: carousel 1s linear infinite;
    will-change: transform;
  }
}

@keyframes carousel {
  0% {
    transform: translateX(-45px) translateZ(0);
  }
  100% {
    transform: translateX(0px) translateZ(0);
  }
}
</style>
