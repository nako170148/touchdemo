/**
 * Variation 1 - iPad版
 * 実際のマルチタッチ入力対応
 */

class Variation1iPad {
    constructor() {
        this.touchArea = document.getElementById('touchArea');
        this.instruction = document.getElementById('instruction');
        this.touchCountEl = document.getElementById('touchCount');
        this.modeEl = document.getElementById('mode');
        this.gestureInfoEl = document.getElementById('gestureInfo');
        this.resetBtn = document.getElementById('resetBtn');
        
        this.activeTouches = new Map();
        this.state = {
            phase: 'waiting',
            initialFingers: null,
            activeGesture: null
        };
        
        this.FINGER_NAMES = ['人差し指', '中指', '薬指', '小指'];
        
        this.init();
    }
    
    init() {
        // デバッグ表示エリアを作成
        this.debugEl = document.createElement('div');
        this.debugEl.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; z-index: 9999; max-height: 150px; overflow-y: auto;';
        document.body.appendChild(this.debugEl);
        this.debug('初期化完了');
        
        // タッチイベント
        this.touchArea.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.touchArea.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.touchArea.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.touchArea.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // リセットボタン
        this.resetBtn.addEventListener('click', this.reset.bind(this));
        
        console.log('iPad版 Variation 1 初期化完了');
    }
    
    debug(message) {
        const time = new Date().toLocaleTimeString();
        console.log(message);
        this.debugEl.innerHTML = `[${time}] ${message}<br>` + this.debugEl.innerHTML;
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        
        this.debug(`touchstart: ${event.touches.length}本のタッチ`);
        
        const rect = this.touchArea.getBoundingClientRect();
        
        for (let touch of event.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.activeTouches.set(touch.identifier, { x, y, id: touch.identifier });
        }
        
        this.debug(`現在のタッチ数: ${this.activeTouches.size}`);
        
        this.updateDisplay();
        
        // 4本指検出
        if (this.activeTouches.size === 4 && this.state.phase === 'waiting') {
            this.debug('4本指検出！');
            this.detectFourFingers();
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        const rect = this.touchArea.getBoundingClientRect();
        
        for (let touch of event.changedTouches) {
            if (this.activeTouches.has(touch.identifier)) {
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.activeTouches.set(touch.identifier, { x, y, id: touch.identifier });
            }
        }
        
        this.updateDisplay();
        
        if (this.state.phase === 'four_finger_detected' || this.state.phase === 'gesture_active') {
            this.detectGesture();
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }
        
        this.updateDisplay();
        
        if (this.activeTouches.size === 0) {
            // すべての指が離れた
            if (this.state.activeGesture) {
                console.log('ジェスチャ完了:', this.state.activeGesture);
            }
            setTimeout(() => this.reset(), 500);
        } else if (this.state.phase === 'four_finger_detected' || this.state.phase === 'gesture_active') {
            this.detectGesture();
        }
    }
    
    detectFourFingers() {
        const touches = Array.from(this.activeTouches.values());
        
        // x座標でソート
        const sorted = touches.sort((a, b) => a.x - b.x);
        
        // 指を識別
        this.state.initialFingers = sorted.map((touch, i) => ({
            ...touch,
            finger: i,
            name: this.FINGER_NAMES[i]
        }));
        
        this.state.phase = 'four_finger_detected';
        
        this.instruction.textContent = '4本指を検出しました！特定の指を離してください';
        this.instruction.className = 'instruction detected';
        this.modeEl.textContent = '4本指検出';
        
        console.log('4本指検出:', this.state.initialFingers.map(f => f.name));
    }
    
    detectGesture() {
        if (!this.state.initialFingers) return;
        
        const currentTouches = Array.from(this.activeTouches.values());
        const remaining = this.identifyRemainingFingers(currentTouches);
        
        if (remaining && remaining.length > 0 && remaining.length < 4) {
            const gesture = this.classifyGesture(remaining);
            
            if (gesture) {
                const isNew = !this.state.activeGesture || 
                             this.state.activeGesture.id !== gesture.id;
                
                if (isNew) {
                    this.state.activeGesture = gesture;
                    this.state.phase = 'gesture_active';
                    
                    this.instruction.textContent = `${gesture.id}: ${gesture.description}`;
                    this.instruction.className = 'instruction gesture';
                    this.modeEl.textContent = 'ジェスチャ検出';
                    
                    this.gestureInfoEl.innerHTML = `
                        <div class="gesture-id">${gesture.id}</div>
                        <div class="gesture-desc">${gesture.description}</div>
                        <div class="gesture-desc">使用する指: ${gesture.fingerNames.join(', ')}</div>
                    `;
                    
                    console.log('ジェスチャ検出:', gesture);
                }
            }
        }
    }
    
    identifyRemainingFingers(currentTouches) {
        const remaining = [];
        const threshold = 100;
        
        for (let touch of currentTouches) {
            let minDist = Infinity;
            let closest = null;
            
            for (let finger of this.state.initialFingers) {
                const dist = Math.sqrt(
                    Math.pow(touch.x - finger.x, 2) + 
                    Math.pow(touch.y - finger.y, 2)
                );
                
                if (dist < minDist && dist < threshold) {
                    minDist = dist;
                    closest = finger;
                }
            }
            
            if (closest) {
                remaining.push({
                    ...touch,
                    finger: closest.finger,
                    name: closest.name
                });
            }
        }
        
        return remaining;
    }
    
    classifyGesture(remainingFingers) {
        const fingerIndices = remainingFingers.map(f => f.finger).sort((a, b) => a - b);
        const fingerNames = remainingFingers.map(f => f.name);
        
        let gestureId = '';
        let description = '';
        
        if (fingerIndices.length === 1) {
            const finger = fingerIndices[0];
            gestureId = `V1-1${String.fromCharCode(97 + finger)}`;
            
            const modes = [
                '通常ポインティング/選択モード',
                'スクロールモード',
                '描画/ペンモード',
                '消しゴム/削除モード'
            ];
            description = modes[finger];
            
        } else if (fingerIndices.length === 2) {
            const combinations = {
                '0,1': { id: 'V1-2a', desc: '2本指スクロール' },
                '0,2': { id: 'V1-2b', desc: 'ピンチズーム' },
                '0,3': { id: 'V1-2c', desc: '回転操作' },
                '1,2': { id: 'V1-2d', desc: 'パン操作' },
                '1,3': { id: 'V1-2e', desc: 'ブラシサイズ調整' },
                '2,3': { id: 'V1-2f', desc: '不透明度調整' }
            };
            
            const key = fingerIndices.join(',');
            if (combinations[key]) {
                gestureId = combinations[key].id;
                description = combinations[key].desc;
            }
            
        } else if (fingerIndices.length === 3) {
            const combinations = {
                '0,1,2': { id: 'V1-3a', desc: '3本指スワイプ（ウィンドウ切替）' },
                '0,1,3': { id: 'V1-3b', desc: '3本指ドラッグ' },
                '0,2,3': { id: 'V1-3c', desc: '3本指タップ（特殊機能）' },
                '1,2,3': { id: 'V1-3d', desc: '3本指ピンチ' }
            };
            
            const key = fingerIndices.join(',');
            if (combinations[key]) {
                gestureId = combinations[key].id;
                description = combinations[key].desc;
            }
        }
        
        return gestureId ? {
            id: gestureId,
            description: description,
            fingerCount: fingerIndices.length,
            fingers: fingerIndices,
            fingerNames: fingerNames
        } : null;
    }
    
    updateDisplay() {
        // 既存のタッチポイントをクリア
        const existingPoints = this.touchArea.querySelectorAll('.touch-point');
        existingPoints.forEach(p => p.remove());
        
        // タッチ数更新
        this.touchCountEl.textContent = this.activeTouches.size;
        
        // タッチポイント表示
        for (let touch of this.activeTouches.values()) {
            const point = document.createElement('div');
            point.className = 'touch-point';
            point.style.left = touch.x + 'px';
            point.style.top = touch.y + 'px';
            
            // 識別済みの指の場合
            if (this.state.initialFingers) {
                const identified = this.state.initialFingers.find(f => {
                    const dist = Math.sqrt(
                        Math.pow(touch.x - f.x, 2) + 
                        Math.pow(touch.y - f.y, 2)
                    );
                    return dist < 100;
                });
                
                if (identified) {
                    point.classList.add('identified');
                    point.textContent = identified.name[0];
                } else {
                    point.textContent = '●';
                }
            } else {
                point.textContent = '●';
            }
            
            this.touchArea.appendChild(point);
        }
        
        // 離された指を表示（半透明）
        if (this.state.initialFingers && this.state.phase !== 'waiting') {
            for (let finger of this.state.initialFingers) {
                const stillTouching = Array.from(this.activeTouches.values()).some(t => {
                    const dist = Math.sqrt(
                        Math.pow(t.x - finger.x, 2) + 
                        Math.pow(t.y - finger.y, 2)
                    );
                    return dist < 100;
                });
                
                if (!stillTouching) {
                    const point = document.createElement('div');
                    point.className = 'touch-point removed';
                    point.style.left = finger.x + 'px';
                    point.style.top = finger.y + 'px';
                    point.textContent = finger.name[0];
                    this.touchArea.appendChild(point);
                }
            }
        }
    }
    
    reset() {
        this.activeTouches.clear();
        this.state = {
            phase: 'waiting',
            initialFingers: null,
            activeGesture: null
        };
        
        this.instruction.textContent = '4本指（人差し指、中指、薬指、小指）を同時にタッチしてください';
        this.instruction.className = 'instruction';
        this.modeEl.textContent = '待機中';
        this.touchCountEl.textContent = '0';
        this.gestureInfoEl.innerHTML = '<div class="gesture-id">-</div>';
        
        const existingPoints = this.touchArea.querySelectorAll('.touch-point');
        existingPoints.forEach(p => p.remove());
    }
}

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
    new Variation1iPad();
});
