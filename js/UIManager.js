/**
 * UI状態管理
 * DOM要素の表示切替・テキスト更新を担当
 */
export class UIManager {
    constructor() {
        this.instruction = document.getElementById('instruction');
        this.touchCountEl = document.getElementById('touchCount');
        this.modeEl = document.getElementById('mode');
        this.gestureInfoEl = document.getElementById('gestureInfo');
        this.handTypeEl = document.getElementById('handType');
        this.handSelection = document.getElementById('handSelection');
        this.statusPanel = document.getElementById('statusPanel');
        this.controlsPanel = document.getElementById('controlsPanel');
    }

    /** 手の選択後、待機画面に切り替える */
    showWaiting(hand) {
        this.handSelection.style.display = 'none';
        this.statusPanel.style.display = 'flex';
        this.gestureInfoEl.style.display = 'block';
        this.controlsPanel.style.display = 'flex';

        this.handTypeEl.textContent = hand === 'left' ? '左手' : '右手';
        this.instruction.textContent = '4本指（人差し指、中指、薬指、小指）を同時にタッチしてください';
        this.instruction.className = 'instruction';
        this.modeEl.textContent = '待機中';
    }

    /** 4本指検出時の表示 */
    showFourFingerDetected() {
        this.instruction.textContent = '4本指を検出しました！特定の指を離してください';
        this.instruction.className = 'instruction detected';
        this.modeEl.textContent = '4本指検出';
    }

    /** ジェスチャ検出時の表示 */
    showGesture(gesture) {
        this.instruction.textContent = `${gesture.id}: ${gesture.description}`;
        this.instruction.className = 'instruction gesture';
        this.modeEl.textContent = 'ジェスチャ検出';

        this.gestureInfoEl.innerHTML = `
            <div class="gesture-id">${gesture.id}</div>
            <div class="gesture-desc">${gesture.description}</div>
            <div class="gesture-desc">使用する指: ${gesture.fingerNames.join(', ')}</div>
        `;
    }

    /** モードがアクティブになった時の表示 */
    showModeActive(mode) {
        this.instruction.textContent = `${mode.name}`;
        this.instruction.className = 'instruction mode-active';
        this.instruction.style.borderColor = mode.color;
        this.modeEl.textContent = mode.name;

        this.gestureInfoEl.innerHTML = `
            <div class="gesture-id" style="color: ${mode.color}">${mode.name}</div>
            <div class="gesture-desc">指を動かして操作してください</div>
        `;
    }

    /** すべての指が離れた後、待機状態に戻す */
    showWaitingAfterRelease() {
        this.instruction.textContent = '4本指（人差し指、中指、薬指、小指）を同時にタッチしてください';
        this.instruction.className = 'instruction';
        this.modeEl.textContent = '待機中';
        this.gestureInfoEl.innerHTML = '<div class="gesture-id">-</div>';
    }

    /** タッチ数を更新する */
    updateTouchCount(count) {
        this.touchCountEl.textContent = count;
    }

    /** リセット：手の選択画面に戻す */
    showHandSelection() {
        this.handSelection.style.display = 'flex';
        this.statusPanel.style.display = 'none';
        this.gestureInfoEl.style.display = 'none';
        this.controlsPanel.style.display = 'none';

        this.instruction.textContent = '使用する手を選択してください';
        this.instruction.className = 'instruction';
        this.touchCountEl.textContent = '0';
        this.gestureInfoEl.innerHTML = '<div class="gesture-id">-</div>';
    }
}
