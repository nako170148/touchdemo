/**
 * モード管理・実行
 * 各指モード（カーソル/スクロール/マーカー/消しゴム）の動作を担当
 */
export class ModeManager {
    constructor(touchArea) {
        this.touchArea = touchArea;
        this.activeMode = null;
        this.lastPosition = null;
        this.scrollOffset = { x: 0, y: 0 };

        this.MODES = {
            0: { id: 'marker',  name: '描画モード',       color: '#e91e63' },
            1: { id: 'eraser',  name: '消しゴムモード',       color: '#9e9e9e' },
            2: { id: 'cursor',  name: 'カーソルモード', color: '#2196f3' },
            3: { id: 'scroll',  name: 'スクロールモード',     color: '#ff9800' }
        };

        this.setupCanvas();
        this.setupCursor();
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'mode-canvas';
        this.touchArea.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.touchArea.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setupCursor() {
        this.cursorEl = document.createElement('div');
        this.cursorEl.className = 'mode-cursor';
        this.cursorEl.style.display = 'none';
        this.touchArea.appendChild(this.cursorEl);
    }

    /** モードを有効化する */
    activate(fingerIndex) {
        this.activeMode = this.MODES[fingerIndex] || null;
        this.lastPosition = null;

        if (this.activeMode?.id === 'cursor') {
            this.cursorEl.style.display = 'block';
        }

        return this.activeMode;
    }

    /** モードを無効化する */
    deactivate() {
        this.cursorEl.style.display = 'none';
        this.activeMode = null;
        this.lastPosition = null;
    }

    /** 指の移動に応じてモードのアクションを実行する */
    onMove(x, y) {
        if (!this.activeMode) return;

        switch (this.activeMode.id) {
            case 'cursor':  this.handleCursor(x, y); break;
            case 'scroll':  this.handleScroll(x, y); break;
            case 'marker':  this.handleMarker(x, y); break;
            case 'eraser':  this.handleEraser(x, y); break;
        }

        this.lastPosition = { x, y };
    }

    handleCursor(x, y) {
        this.cursorEl.style.left = x + 'px';
        this.cursorEl.style.top = y + 'px';
    }

    handleScroll(x, y) {
        if (!this.lastPosition) return;

        const dy = this.lastPosition.y - y;
        window.scrollBy(0, dy);
    }

    handleMarker(x, y) {
        if (!this.lastPosition) return;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastPosition.x, this.lastPosition.y);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = '#e91e63';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    handleEraser(x, y) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    /** 描画をすべてクリアする */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.scrollOffset = { x: 0, y: 0 };
    }

    getMode(fingerIndex) {
        return this.MODES[fingerIndex] || null;
    }
}
