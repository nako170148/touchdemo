// import { DebugPanel } from './js/DebugPanel.js';
import { GestureClassifier } from './js/GestureClassifier.js';
import { TouchRenderer } from './js/TouchRenderer.js';
import { TouchHandler } from './js/TouchHandler.js';
import { UIManager } from './js/UIManager.js';
import { ModeManager } from './js/ModeManager.js';

/**
 * Variation 1 - iPad版
 * 実際のマルチタッチ入力対応（オーケストレーター）
 */
class Variation1iPad {
    constructor() {
        this.touchArea = document.getElementById('touchArea');
        
        this.handType = null; // 'left' or 'right'
        this.state = { phase: 'hand_selection', initialFingers: null, activeGesture: null };
        
        this.FINGER_NAMES = ['人差し指', '中指', '薬指', '小指'];
        
        // this.debugPanel = new DebugPanel();
        this.gestureClassifier = new GestureClassifier(this.FINGER_NAMES);
        this.touchRenderer = new TouchRenderer(this.touchArea);
        this.touchHandler = new TouchHandler();
        this.ui = new UIManager();
        this.modeManager = new ModeManager(this.touchArea);
        
        this.init();
    }
    
    init() {
        this.debug('初期化完了');
        
        document.getElementById('leftHandBtn').addEventListener('click', () => this.selectHand('left'));
        document.getElementById('rightHandBtn').addEventListener('click', () => this.selectHand('right'));
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        const opts = { passive: false };
        this.touchArea.addEventListener('touchstart', this.onTouchStart.bind(this), opts);
        this.touchArea.addEventListener('touchmove', this.onTouchMove.bind(this), opts);
        this.touchArea.addEventListener('touchend', this.onTouchEnd.bind(this), opts);
        this.touchArea.addEventListener('touchcancel', this.onTouchEnd.bind(this), opts);
    }
    
    debug(msg) { console.log(msg); }
    
    selectHand(hand) {
        this.handType = hand;
        this.state.phase = 'waiting';
        this.ui.showWaiting(hand);
        this.debug(`${hand === 'left' ? '左手' : '右手'}を選択しました`);
    }
    
    onTouchStart(event) {
        event.preventDefault();
        if (this.state.phase === 'hand_selection') return;
        
        this.touchHandler.addTouches(event, this.touchArea.getBoundingClientRect());
        this.updateDisplay();
        
        // モード記憶中: 1本指で再開、3本指以上で終了
        if (this.state.phase === 'mode_remembered') {
            if (this.touchHandler.size === 1) {
                const touch = Array.from(this.touchHandler.activeTouches.values())[0];
                this.state.activeTouchId = touch.id;
                this.state.phase = 'mode_active';
                this.ui.showModeActive(this.modeManager.activeMode);
                this.debug(`モード再開: ${this.modeManager.activeMode.name}`);
            } else if (this.touchHandler.size >= 3) {
                this.modeManager.deactivate();
                this.state = { phase: 'waiting', initialFingers: null, activeGesture: null };
                this.ui.showWaitingAfterRelease();
                this.debug('3本指タッチでモード終了');
            }
            return;
        }
        
        this.debug(`touchstart: ${event.touches.length}本のタッチ`);
        this.debug(`現在のタッチ数: ${this.touchHandler.size}`);
        
        if (this.touchHandler.size === 4 && this.state.phase === 'waiting') {
            this.debug('4本指検出！');
            this.detectFourFingers();
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        if (this.state.phase === 'hand_selection') return;
        
        const rect = this.touchArea.getBoundingClientRect();
        this.touchHandler.updatePositions(event, rect);
        this.updateDisplay();
        
        if (this.state.phase === 'mode_active') {
            // モード実行中: アクティブな指の位置を ModeManager に渡す
            let touch = null;
            if (this.state.activeTouchId != null) {
                // 再タッチからのモード
                touch = this.touchHandler.activeTouches.get(this.state.activeTouchId);
            } else if (this.state.initialFingers && this.state.activeGesture) {
                // 4本指からのモード
                const activeFinger = this.state.initialFingers[this.state.activeGesture.fingers[0]];
                if (activeFinger) {
                    touch = this.touchHandler.activeTouches.get(activeFinger.touchId);
                }
            }
            if (touch) {
                this.modeManager.onMove(touch.x, touch.y);
            }
        } else if (this.state.phase === 'four_finger_detected' || this.state.phase === 'gesture_active') {
            this.detectGesture();
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        if (this.state.phase === 'hand_selection') return;
        
        this.touchHandler.removeTouches(event);
        this.updateDisplay();
        
        if (this.touchHandler.size === 0) {
            if (this.state.phase === 'mode_active') {
                // モードを記憶して待機
                this.modeManager.lastPosition = null;
                this.state.phase = 'mode_remembered';
                this.state.activeTouchId = null;
                this.ui.showModeRemembered(this.modeManager.activeMode);
                this.debug(`モード記憶: ${this.modeManager.activeMode.name}`);
            } else if (this.state.phase === 'mode_remembered') {
                // モード記憶中は何もしない
            } else {
                if (this.state.activeGesture) {
                    this.debug(`ジェスチャ完了: ${this.state.activeGesture.description}`);
                }
                this.modeManager.deactivate();
                this.state = { phase: 'waiting', initialFingers: null, activeGesture: null };
                this.ui.showWaitingAfterRelease();
            }
        } else if (this.state.phase === 'four_finger_detected' || this.state.phase === 'gesture_active') {
            this.detectGesture();
        }
    }
    
    detectFourFingers() {
        this.state.initialFingers = this.gestureClassifier.detectFourFingers(
            this.touchHandler.activeTouches, this.handType
        );
        this.state.phase = 'four_finger_detected';
        this.ui.showFourFingerDetected();
        this.debug('4本指検出: ' + this.state.initialFingers.map(f => f.name).join(', '));
    }
    
    detectGesture() {
        if (!this.state.initialFingers) return;
        
        const currentTouches = Array.from(this.touchHandler.activeTouches.values());
        const remaining = this.gestureClassifier.identifyRemainingFingers(
            currentTouches, this.state.initialFingers, (m) => this.debug(m)
        );
        
        if (!remaining || remaining.length === 0 || remaining.length >= 4) return;
        
        const gesture = this.gestureClassifier.classifyGesture(remaining);
        if (!gesture) return;
        
        const isNew = !this.state.activeGesture || this.state.activeGesture.id !== gesture.id;
        if (isNew) {
            this.state.activeGesture = gesture;
            
            // 1本指の場合はモードを起動
            if (gesture.fingerCount === 1) {
                const mode = this.modeManager.activate(gesture.fingers[0]);
                this.state.phase = 'mode_active';
                if (mode) {
                    this.ui.showModeActive(mode);
                    this.debug(`モード起動: ${mode.name}`);
                }
            } else {
                this.state.phase = 'gesture_active';
                this.ui.showGesture(gesture);
                this.debug(`${gesture.id}: ${gesture.description}`);
            }
        }
    }
    
    updateDisplay() {
        this.ui.updateTouchCount(this.touchHandler.size);
        this.touchRenderer.render(this.touchHandler.activeTouches, this.state);
    }
    
    reset() {
        this.touchHandler.clear();
        this.modeManager.deactivate();
        this.modeManager.clearCanvas();
        this.handType = null;
        this.state = { phase: 'hand_selection', initialFingers: null, activeGesture: null };
        this.ui.showHandSelection();
        this.touchRenderer.render(this.touchHandler.activeTouches, this.state);
    }
}

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
    new Variation1iPad();
});
