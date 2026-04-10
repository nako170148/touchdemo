/**
 * デバッグ表示パネル
 * 画面上部に半透明のデバッグログを表示する
 */
export class DebugPanel {
    constructor() {
        this.debugEl = document.createElement('div');
        this.debugEl.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; z-index: 9999; max-height: 150px; overflow-y: auto;';
        document.body.appendChild(this.debugEl);
    }

    log(message) {
        const time = new Date().toLocaleTimeString();
        console.log(message);
        this.debugEl.innerHTML = `[${time}] ${message}<br>` + this.debugEl.innerHTML;
    }
}
