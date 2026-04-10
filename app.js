import { DebugPanel } from './js/DebugPanel.js';
import { GestureClassifier } from './js/GestureClassifier.js';
import { TouchRenderer } from './js/TouchRenderer.js';
import { TouchHandler } from './js/TouchHandler.js';
import { UIManager } from './js/UIManager.js';

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
        
        this.debugPanel = new DebugPanel();
        this.gestureClassifier = new GestureClassifier(this.FINGER_NAMES);
        this.touchRenderer = new TouchRenderer(this.touchArea);
        this.touchHandler = new TouchHandler();
        this.ui = new UIManager();
        
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
    
    debug(msg) { this.debugPanel.log(msg); }
    
    selectHand(hand) {
        this.handType = hand;
        this.state.phase = 'waiting';
        this.ui.showWaiting(hand);
        this.debug(`${hand === 'left' ? '左手' : '右手'}を選択しました`);
    }
    
    onTouchStart(event) {
        event.preventDefault();
        this.debug(`touchstart: ${event.touches.length}本のタッチ`);
        
        this.touchHandler.addTouches(event, this.touchArea.getBoundingClientRect());
        this.debug(`現在のタッチ数: ${this.touchHandler.size}`);
        this.updateDisplay();
        
        if (this.touchHandler.size === 4 && this.state.phase === 'waiting') {
            this.debug('4本指検出！');
            this.detectFourFingers();
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        this.touchHandler.updatePositions(event, this.touchArea.getBoundingClientRect());
        this.updateDisplay();
        
        if (this.state.phase === 'four_finger_detected' || this.state.phase === 'gesture_active') {
            this.detectGesture();
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        this.touchHandler.removeTouches(event);
        this.updateDisplay();
        
        if (this.touchHandler.size === 0) {
            if (this.state.activeGesture) {
                this.debug(`ジェスチャ完了: ${this.state.activeGesture.id}`);
            }
            this.state = { phase: 'waiting', initialFingers: null, activeGesture: null };
            this.ui.showWaitingAfterRelease();
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
            this.state.phase = 'gesture_active';
            this.ui.showGesture(gesture);
            this.debug(`${gesture.id}: ${gesture.description}`);
        }
    }
    
    updateDisplay() {
        this.ui.updateTouchCount(this.touchHandler.size);
        this.touchRenderer.render(this.touchHandler.activeTouches, this.state);
    }
    
    reset() {
        this.touchHandler.clear();
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
