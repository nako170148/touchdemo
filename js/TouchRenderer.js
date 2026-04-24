/**
 * タッチポイント描画
 * タッチエリア上のタッチポイントの表示・更新
 */
export class TouchRenderer {
    constructor(touchArea) {
        this.touchArea = touchArea;
    }

    //タッチポイントを描画する
    render(activeTouches, state) {
        // 既存のタッチポイントをクリア
        const existingPoints = this.touchArea.querySelectorAll('.touch-point');
        existingPoints.forEach(p => p.remove());

        // タッチポイント表示
        for (let touch of activeTouches.values()) {
            const point = document.createElement('div');
            point.className = 'touch-point';
            point.style.left = touch.x + 'px';
            point.style.top = touch.y + 'px';

            // 識別済みの指の場合←タッチIDで判定
            if (state.initialFingers) {
                const identified = state.initialFingers.find(f => f.touchId === touch.id);

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

        // 離された指を表示
        if (state.initialFingers && state.phase !== 'waiting') {
            for (let finger of state.initialFingers) {
                // タッチIDで判定
                const stillTouching = Array.from(activeTouches.values()).some(t => t.id === finger.touchId);

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
}
