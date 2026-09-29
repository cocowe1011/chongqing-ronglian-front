import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  dialog,
  Tray,
  screen
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import nodes7 from 'nodes7';
import HttpUtil from '@/utils/HttpUtil';
import logger from 'electron-log';
// 设置日志文件的保存路径
logger.transports.file.file = app.getPath('userData') + '/app.log';

// 初始化日志记录器
logger.transports.file.level = 'info';
logger.transports.console.level = 'info';
// 日期样式
logger.transports.file.format =
  '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
console.log(app.getPath('userData'));
logger.transports.file.file = app.getPath('userData') + '/app.log';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const plcConnLogger = require('./utils/plcConnLogger');
var appTray = null;
let closeStatus = false;
var conn = new nodes7();

// 读取缩放配置文件（D://chongqing-ronglian-front/config/zoom.json，升级不覆盖）
function readZoomConfig() {
  const configDir = 'D://chongqing-ronglian-front/config';
  const configPath = path.join(configDir, 'zoom.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      // 非数字值(如""、null)原样返回，由渲染进程判断是否执行缩放
      return config.zoomFactor;
    }
  } catch (error) {
    logger.error('读取缩放配置失败: ' + error.message);
  }
  // 配置文件不存在时才创建默认文件
  if (!fs.existsSync(configPath)) {
    const defaultConfig = { zoomFactor: null };
    try {
      if (!fs.existsSync(configDir))
        fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8'
      );
    } catch (error) {
      logger.error('创建默认缩放配置失败: ' + error.message);
    }
  }
  return null;
}

// 记录日志的辅助函数
function logToFile(message) {
  const timestamp = new Date().toLocaleString();
  const logPath =
    'D://chongqing-ronglian-front/log/' +
    new Date().toLocaleDateString().replaceAll('/', '-') +
    'runlog.txt';
  fs.appendFile(logPath, `[${timestamp}] ${message}\n`, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// 日志缓冲相关变量
let logBuffer = [];
let logBufferTimer = null;
const LOG_BUFFER_SIZE = 10; // 缓冲区大小
const LOG_FLUSH_INTERVAL = 5000; // 5秒刷新一次

// 优化的日志写入函数
function writeLogToLocalOptimized(logData) {
  // 添加时间戳
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] ${logData}\n`;

  // 添加到缓冲区
  logBuffer.push(logEntry);

  // 如果缓冲区满了，立即刷新
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    flushLogBuffer();
  } else if (!logBufferTimer) {
    // 设置定时器，定期刷新缓冲区
    logBufferTimer = setTimeout(() => {
      flushLogBuffer();
    }, LOG_FLUSH_INTERVAL);
  }
}

// 刷新日志缓冲区
function flushLogBuffer() {
  if (logBuffer.length === 0) return;

  const logPath =
    'D://chongqing-ronglian-front/log/' +
    (new Date().toLocaleDateString() + '.txt').replaceAll('/', '-');

  // 确保日志目录存在
  const logDir = 'D://chongqing-ronglian-front/log';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 检查日志文件大小，如果超过10MB则进行轮转
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        // 创建备份文件
        const backupPath = logPath.replace('.txt', `_${Date.now()}.txt`);
        fs.renameSync(logPath, backupPath);
        console.log(`日志文件过大，已轮转到: ${backupPath}`);
      }
    }
  } catch (error) {
    console.error('检查日志文件大小时出错:', error);
  }

  // 批量写入日志
  const logContent = logBuffer.join('');
  fs.appendFile(logPath, logContent, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

  // 清空缓冲区
  logBuffer = [];

  // 清除定时器
  if (logBufferTimer) {
    clearTimeout(logBufferTimer);
    logBufferTimer = null;
  }
}
// electron 开启热更新
try {
  require('electron-reloader')(module, {});
} catch (_) {
  // 忽略热更新错误
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时确保所有日志都被写入
app.on('before-quit', () => {
  flushLogBuffer();
  plcConnLogger.flush();
});

// 单实例锁，防止应用被多开 - 必须在app.ready之前检查
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 直接退出，不创建任何窗口，避免白色背景框
  console.log('检测到已有程序运行，直接退出');
  // 使用 process.exit 确保立即退出，避免任何延迟
  process.exit(0);
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

global.sharedObject = {
  userInfo: {},
  zoomFactor: null
};
let mainWindow = null;
app.on('ready', () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    frame: false,
    show: false, // 先不显示窗口，等页面加载完成后再显示，避免白屏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    icon: './build/icons/icon.ico'
  });

  // 缩放：readZoomConfig原样返回配置值，渲染进程判断typeof==='number'才执行
  const zoomFactor = readZoomConfig();
  global.sharedObject.zoomFactor = zoomFactor;

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
    mainWindow.show();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html');
    // 页面加载完成后立即显示窗口，让用户先看到登录界面
    mainWindow.webContents.on('did-finish-load', () => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    // mainWindow.webContents.openDevTools();
  }
  ipcMain.on('logStatus', (event, arg) => {
    console.log(arg);
    if (arg === 'login') {
      mainWindow.setResizable(true);
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height
      });
    } else {
      // 太几把坑了，windows系统setSize center方法失效 必须先mainWindow.unmaximize()
      mainWindow.unmaximize();
      mainWindow.setSize(1100, 600);
      mainWindow.center();
      global.sharedObject.userInfo = {};
      // mainWindow.setResizable(false)
    }
  });
  // 定义自定义事件
  ipcMain.on('close-window', function () {
    mainWindow.close();
  });
  // 定义自定义事件
  ipcMain.on('min-window', (event, arg) => {
    mainWindow.minimize();
  });
  // writeValuesToPLC
  ipcMain.on('writeValuesToPLC', (event, arg1, arg2) => {
    writeValuesToPLC(arg1, arg2);
  });
  // writeSingleValueToPLC - 单独给PLC某个变量写值，通过批量写入数组实现
  ipcMain.on('writeSingleValueToPLC', (event, arg1, arg2) => {
    writeSingleValueToPLC(arg1, arg2);
  });
  // cancelWriteToPLC - 取消PLC某个变量的写入
  ipcMain.on('cancelWriteToPLC', (event, arg1) => {
    cancelWriteToPLC(arg1);
  });
  // 获取PLC变量定义（只在组件挂载时调用一次，因为启动后不会变）
  ipcMain.handle('getPlcVariables', () => {
    return {
      variables
    };
  });
  // 获取写入数据（轮询调用，因为经常变化）
  ipcMain.handle('getWriteData', () => {
    return {
      writeAddArr,
      writeStrArr
    };
  });
  // 定义自定义事件
  ipcMain.on('max-window', (event, arg) => {
    if (arg === 'max-window') {
      return mainWindow.maximize();
    }
    mainWindow.unmaximize();
    mainWindow.setBounds({
      x: 10,
      y: 10,
      width: screen.getPrimaryDisplay().workAreaSize.width - 20,
      height: screen.getPrimaryDisplay().workAreaSize.height - 20
    });
  });
  // 启动plc conPLC
  ipcMain.on('conPLC', (event, arg1, arg2) => {
    if (process.env.NODE_ENV === 'production') {
      conPLC();
    }
    // setInterval(() => {
    //   console.log(writeStrArr.toString());
    // }, 50);
    // sendHeartToPLC()
  });
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainWin-max', 'max-window');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainWin-max', 'unmax-window');
  });
  mainWindow.on('close', (e) => {
    closeStatus = true;
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog
      .showMessageBox({
        type: 'warning',
        title: '提醒！',
        message: '确认关闭程序吗？',
        buttons: ['关闭程序', '放入托盘', '取消'], //选择按钮，点击确认则下面的idx为0，取消为1
        cancelId: 2 //这个的值是如果直接把提示框×掉返回的值，这里设置成和"取消"按钮一样的值，下面的idx也会是1
      })
      .then((idx) => {
        if (idx.response == 2) {
          e.preventDefault();
        } else if (idx.response == 0) {
          mainWindow = null;
          app.exit();
        } else {
          mainWindow.setSkipTaskbar(true);
          mainWindow.hide();
        }
      });
  });
  if (process.env.NODE_ENV === 'development') {
    let revert = false;
    setInterval(() => {
      if (mainWindow) {
        if (revert) {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 0
            },
            writeStrArr.toString()
          );
        } else {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 1
            },
            writeStrArr.toString()
          );
        }
        revert = !revert;
      }
    }, 500);
  }
  setAppTray();

  if (process.env.NODE_ENV === 'production') {
    try {
      const javaPath = path.join(
        __static,
        './jre',
        'jre1.8.0_251',
        'bin',
        'java'
      );
      const jarPath = path.join(
        __static,
        './jarlib',
        'chongqing-ronglian-record-middle.jar'
      );

      // 优化的Java启动参数 - 针对启动速度优化
      const javaOpts = [
        // 内存设置 - 减小初始内存以加快启动，保留足够最大内存
        '-Xmx4096m', // 最大堆内存
        '-Xms256m', // 初始堆内存 256MB（大幅降低启动时的内存分配时间）
        '-XX:MaxMetaspaceSize=256m', // 最大元空间大小
        '-XX:MetaspaceSize=128m', // 初始元空间大小

        // GC设置
        '-XX:+UseG1GC', // 使用G1垃圾收集器
        '-XX:MaxGCPauseMillis=200', // 最大GC停顿时间
        '-XX:+HeapDumpOnOutOfMemoryError', // 内存溢出时导出堆转储
        '-XX:HeapDumpPath=D://chongqing-ronglian-front/dump', // 堆转储文件路径

        // 启动速度优化 - 减少JIT编译开销
        '-XX:+TieredCompilation', // 分层编译
        '-XX:TieredStopAtLevel=1', // 只使用C1编译器，大幅提升启动速度

        // 性能优化
        '-XX:+DisableExplicitGC', // 禁止显式GC调用
        '-XX:+UseStringDeduplication', // 开启字符串去重

        // 错误处理
        '-XX:+ExitOnOutOfMemoryError', // 发生OOM时退出
        '-XX:ErrorFile=D://chongqing-ronglian-front/log/hs_err_%p.log', // JVM错误日志
        // 编码
        '-Dfile.encoding=UTF-8',
        // 应用参数
        '-jar',
        jarPath
      ];
      // 确保日志目录存在
      const logDir = 'D://chongqing-ronglian-front/log';
      const dumpDir = 'D://chongqing-ronglian-front/dump';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      if (!fs.existsSync(dumpDir)) {
        fs.mkdirSync(dumpDir, { recursive: true });
      }

      logToFile(`启动Java进程，使用参数: ${javaOpts.join(' ')}`);
      const process = spawn(javaPath, javaOpts);

      process.on('error', (err) => {
        logToFile(`Java程序启动错误: ${err.message}`);
      });

      process.on('exit', (code, signal) => {
        logToFile(`Java程序退出，退出码: ${code}, 信号: ${signal}`);
      });
    } catch (error) {
      logToFile(`Java程序启动异常: ${error.message}`);
    }
  }

  // 开发者工具
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow.webContents.openDevTools();
  });
  globalShortcut.register('CommandOrControl+F11', () => {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件
  ipcMain.on('full_screen', function () {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件 - 优化后的日志写入
  ipcMain.on('writeLogToLocal', (event, arg) => {
    writeLogToLocalOptimized(arg);
  });
});

function conPLC() {
  logger.info('开始连接PLC');
  // 查询配置
  HttpUtil.get('/cssConfig/getConfig')
    .then((res) => {
      logger.info(JSON.stringify(res));
      if (!res.data.plcPort) {
        logger.info('配置查询失败');
        // We have an error. Maybe the PLC is not reachable.
        conPLC();
        return false;
      }
      plcConnLogger.setEndpoint(res.data.plcIp, res.data.plcPort);
      conn.initiateConnection(
        {
          port: Number(res.data.plcPort),
          host: res.data.plcIp,
          rack: 0,
          slot: 1,
          // 默认 1500ms 易在偶发大包读时整批 BAD 255；3s 覆盖短毛刺且不拖太久
          timeout: 3000,
          debug: false
        },
        (err) => {
          if (typeof err !== 'undefined') {
            logger.info('连接PLC失败' + JSON.stringify(err));
            // We have an error. Maybe the PLC is not reachable.
            conPLC();
            return false;
            // process.exit();
          }
          conn.setTranslationCB(function (tag) {
            return variables[tag];
          }); // This sets the "translation" to allow us to work with object names
          logger.info('连接PLC成功');
          plcConnLogger.startHeartbeatWatch();
          // —— 读取点位（全部 DB1000；表中 DB1001 读地址按现场块号更正）——
          conn.addItems('DBW0'); // 输送线看门狗心跳 DB1000.DBW0
          conn.addItems('DBW2'); // 输送线当前运行状态
          conn.addItems('DBW4'); // 区域报警（BIT 0~7，整字读）
          conn.addItems('DBW6'); // 对接输入信号（BIT 0~15，整字读）
          conn.addItems('DBW8'); // 电机运行信号（BIT 0~15，整字读）
          conn.addItems('DBW10'); // A工位当前码垛数量 DB1000.DBW10
          conn.addItems('DBW12'); // B工位当前码垛数量 DB1000.DBW12
          conn.addItems('DBW14'); // A工位码垛完成呼叫AGV出垛
          conn.addItems('DBW16'); // B工位码垛完成呼叫AGV出垛
          conn.addItems('DBW18'); // 机器人抓取成功
          conn.addItems('DBB30'); // 码垛位扫码信息 DB1000.DBB30-49
          conn.addItems('DBB50'); // A工位空托盘码信息 DB1000.DBB50-69
          conn.addItems('DBB70'); // B工位空托盘码信息 DB1000.DBB70-89
          // 单连接串行读写，避免 read/write 并发导致整批 BAD 255
          startPlcIoScheduler();
        }
      );
    })
    .catch((err) => {
      logger.info('config error!');
    });
}

/** PLC IO：同一时刻只允许一次读或一次写 */
const PLC_IO_CYCLE_MS = 50;
let plcIoBusy = false;
let plcIoPhase = 'read'; // 'read' | 'write'
let plcIoSchedulerStarted = false;
/** 写周期计数：每 3 次写翻转一次 W_DBW0（写约 100ms/次 → 心跳约 300ms） */
let heartWriteCount = 1;
let heartValue = 0;

function startPlcIoScheduler() {
  if (plcIoSchedulerStarted) return;
  plcIoSchedulerStarted = true;
  setInterval(tickPlcIo, PLC_IO_CYCLE_MS);
}

/** 写前更新心跳缓冲，随本拍 writeItems 一并下发 */
function refreshHeartBuffer() {
  if (heartWriteCount > 2) {
    heartWriteCount = 1;
    heartValue = 1 - heartValue;
  }
  heartWriteCount++;
  writeValuesToPLC('W_DBW0', heartValue);
}

function tickPlcIo() {
  if (plcIoBusy) return;

  if (plcIoPhase === 'read') {
    plcIoBusy = true;
    conn.readAllItems((anythingBad, values) => {
      try {
        valuesReady(anythingBad, values);
      } finally {
        plcIoBusy = false;
        plcIoPhase = 'write';
      }
    });
    return;
  }

  if (!writeAddArr.length) {
    plcIoPhase = 'read';
    return;
  }

  refreshHeartBuffer();
  plcIoBusy = true;
  const addrs = writeAddArr.slice();
  const vals = writeStrArr.slice();
  conn.writeItems(addrs, vals, (anythingBad) => {
    try {
      valuesWritten(anythingBad);
    } finally {
      plcIoBusy = false;
      plcIoPhase = 'read';
    }
  });
}

var variables = {
  // —— 读取（读取点位.csv）——
  DBW0: 'DB1000,INT0', // 输送线看门狗心跳
  DBW2: 'DB1000,INT2', // 输送线当前运行状态
  DBW4: 'DB1000,INT4', // 区域报警（BIT 0~7，整字读）
  DBW6: 'DB1000,INT6', // 对接输入信号（BIT 0~15，整字读）
  DBW8: 'DB1000,INT8', // 电机运行信号（BIT 0~15，整字读）
  DBW10: 'DB1000,INT10', // A工位当前码垛数量
  DBW12: 'DB1000,INT12', // B工位当前码垛数量
  DBW14: 'DB1000,INT14', // A工位码垛完成呼叫AGV出垛
  DBW16: 'DB1000,INT16', // B工位码垛完成呼叫AGV出垛
  DBW18: 'DB1000,INT18', // 机器人抓取成功
  DBB30: 'DB1000,C30.20', // 码垛位扫码信息 DBB30-49
  DBB50: 'DB1000,C50.20', // A工位空托盘码信息 DBB50-69
  DBB70: 'DB1000,C70.20', // B工位空托盘码信息 DBB70-89
  // —— 写入（写入点位.csv / DB1001，均为标量 INT）——
  W_DBW0: 'DB1001,INT0', // WCS看门狗心跳
  W_DBW2: 'DB1001,INT2', // WCS-全线启动（系统在线）
  W_DBW4: 'DB1001,INT4', // WCS-全线停止
  W_DBW6: 'DB1001,INT6', // WCS-故障复位
  W_DBW8: 'DB1001,INT8', // 码垛A工位产品下发规格
  W_DBW10: 'DB1001,INT10', // 码垛B工位产品下发规格
  W_DBW12: 'DB1001,INT12', // 码垛A工位产品下发托盘已经码垛数量
  W_DBW14: 'DB1001,INT14', // 码垛B工位产品下发托盘已经码垛数量
  W_DBW16: 'DB1001,INT16', // 码垛A工位允许码垛
  W_DBW18: 'DB1001,INT18', // 码垛B工位允许码垛
  W_DBW20: 'DB1001,INT20', // 码垛A工位尾箱清码垛
  W_DBW22: 'DB1001,INT22', // 码垛B工位尾箱清码垛
  W_DBW24: 'DB1001,INT24', // 手动执行电机编号1
  W_DBW26: 'DB1001,INT26', // 手动执行电机编号2
  W_DBW28: 'DB1001,INT28', // 手动执行电机编号3
  W_DBW30: 'DB1001,INT30', // 手自动模式切换
  W_DBW32: 'DB1001,INT32', // 手动启动
  W_DBW34: 'DB1001,INT34', // 按1松0
  W_DBW36: 'DB1001,INT36', // 上升
  W_DBW38: 'DB1001,INT38' // 下降
};

var writeStrArr = [0, 0, 0, 0];
var writeAddArr = [
  'W_DBW0', // WCS看门狗心跳
  'W_DBW2', // WCS-全线启动
  'W_DBW4', // WCS-全线停止
  'W_DBW6' // WCS-故障复位
];

// 给PLC写值
function writeValuesToPLC(add, values) {
  const index = writeAddArr.indexOf(add);
  if (index !== -1) {
    writeStrArr[index] = values;
  } else {
    console.warn(`Address ${add} not found in writeAddArr.`);
  }
}

// 单独给PLC某个变量写值，通过操作批量写入数组实现，避免写入冲突
function writeSingleValueToPLC(add, values) {
  if (!variables[add]) {
    console.warn(`Address ${add} not found in variables.`);
    return;
  }

  // 查找地址在批量写入数组中的索引
  const index = writeAddArr.indexOf(add);

  if (index !== -1) {
    // 地址已存在，直接更新值（这个操作是原子的）
    writeStrArr[index] = values;
    console.log(`更新PLC地址 ${add} 的值为：${values}`);
  } else {
    // 地址不存在，使用原子性操作添加到批量写入数组
    const newAddArr = [...writeAddArr, add];
    const newStrArr = [...writeStrArr, values];

    // 原子性替换数组内容
    writeAddArr.length = 0;
    writeStrArr.length = 0;
    writeAddArr.push(...newAddArr);
    writeStrArr.push(...newStrArr);

    console.log(`添加PLC地址 ${add} 到批量写入数组，值：${values}`);
  }
}

// 取消PLC某个变量的写入，从批量写入数组中移除
function cancelWriteToPLC(add) {
  // 使用 filter 方法重建数组，避免 splice 的并发问题
  const originalLength = writeAddArr.length;
  const newAddArr = [];
  const newStrArr = [];

  for (let i = 0; i < writeAddArr.length; i++) {
    if (writeAddArr[i] !== add) {
      newAddArr.push(writeAddArr[i]);
      newStrArr.push(writeStrArr[i]);
    }
  }

  // 检查是否找到并移除了地址
  if (newAddArr.length === originalLength) {
    console.warn(`Address ${add} not found in writeAddArr, cannot cancel.`);
    return false;
  }

  // 原子性替换数组内容
  writeAddArr.length = 0;
  writeStrArr.length = 0;
  writeAddArr.push(...newAddArr);
  writeStrArr.push(...newStrArr);

  console.log(`已从批量写入数组中移除PLC地址：${add}`);

  // 验证数组长度一致性
  if (writeAddArr.length !== writeStrArr.length) {
    console.error(
      `数组长度不一致！地址数组长度：${writeAddArr.length}，值数组长度：${writeStrArr.length}`
    );
  }

  return true;
}

function valuesWritten(anythingBad) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG WRITING VALUES!!!!');
    plcConnLogger.markWriteFail();
  } else {
    plcConnLogger.markWriteOk();
  }
}

function valuesReady(anythingBad, values) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG READING VALUES!!!!');
    plcConnLogger.markReadFail(values);
  } else {
    plcConnLogger.markReadOk(values && values.DBW0, values);
  }
  // console.log(values)
  mainWindow.webContents.send('receivedMsg', values, writeStrArr.toString());
}

const setAppTray = () => {
  // 系统托盘右键菜单
  var trayMenuTemplate = [
    {
      label: '退出',
      click: function () {
        app.quit();
      }
    }
  ];

  // 系统托盘图标目录
  appTray = new Tray(path.join(__static, './icon.ico'));

  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 设置此托盘图标的悬停提示内容
  appTray.setToolTip('WCS系统');

  // 设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu);

  appTray.on('click', function () {
    //主窗口显示隐藏切换
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
    }
  });
};
