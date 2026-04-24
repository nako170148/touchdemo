/**
 * 4本指の検出、指の識別、ジェスチャの分類
 */
export class GestureClassifier {
    constructor(fingerNames) {
        this.FINGER_NAMES = fingerNames;
    }

    /**
     * 4本指を検出し、x座標と手の種類で指を識別する
     * @param {Map} activeTouches - アクティブなタッチのMap
     * @param {string} handType - 'left' or 'right'
     * @returns {Array} 識別された指の配列
     */
    detectFourFingers(activeTouches, handType) {
        const touches = Array.from(activeTouches.values());

        // x座標でソート
        const sorted = touches.sort((a, b) => a.x - b.x);

        // 左手の場合は逆順，　右手の場合は順
        if (handType === 'left') {
            sorted.reverse();
        }

        // 指を識別（タッチIDと指の対応）
        return sorted.map((touch, i) => ({
            touchId: touch.id,
            x: touch.x,
            y: touch.y,
            finger: i,
            name: this.FINGER_NAMES[i]
        }));
    }

    //現在のタッチから残っている指を特定する（タッチIDで追跡）
    identifyRemainingFingers(currentTouches, initialFingers, debug) {
        const remaining = [];

        debug(`現在のタッチ: ${currentTouches.map(t => `ID:${t.id}`).join(', ')}`);
        debug(`初期指: ${initialFingers.map(f => `${f.name}(ID:${f.touchId})`).join(', ')}`);

        // タッチIDで指を特定
        for (let touch of currentTouches) {
            const matchedFinger = initialFingers.find(f => f.touchId === touch.id);

            if (matchedFinger) {
                remaining.push({
                    x: touch.x,
                    y: touch.y,
                    id: touch.id,
                    finger: matchedFinger.finger,
                    name: matchedFinger.name
                });
                debug(`マッチ: タッチID ${touch.id} → ${matchedFinger.name}`);
            } else {
                debug(`マッチなし: タッチID ${touch.id}`);
            }
        }

        return remaining;
    }

    // 残った指の組み合わせからジェスチャを分類する
    classifyGesture(remainingFingers) {
        const fingerIndices = remainingFingers.map(f => f.finger).sort((a, b) => a - b);
        const fingerNames = remainingFingers.map(f => f.name);

        let gestureId = '';
        let description = '';

        if (fingerIndices.length === 1) {
            const finger = fingerIndices[0];
            gestureId = `V1-1${String.fromCharCode(97 + finger)}`;

            const modes = [
                '描画モード',
                '消しゴムモード',
                'カーソルモード',
                'スクロールモード'
            ];
            description = modes[finger];

        } else if (fingerIndices.length === 2) {
            const combinations = {
                '0,1': { id: 'V1-2a', desc: '切り取りモード' },
                '0,2': { id: 'V1-2b', desc: 'ピンチズーム' },
                '0,3': { id: 'V1-2c', desc: 'ブラー効果' },
                '1,2': { id: 'V1-2d', desc: 'ブラシサイズ調整' },
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
}
