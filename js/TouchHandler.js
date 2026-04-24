/**
 * タッチ状態管理
 */
export class TouchHandler {
    constructor() {
        this.activeTouches = new Map();
    }

    //touchstart 時にタッチを追加する
    addTouches(event, rect) {
        for (let touch of event.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.activeTouches.set(touch.identifier, { x, y, id: touch.identifier });
        }
    }

    //touchmove 時にタッチ位置を更新する
    updatePositions(event, rect) {
        for (let touch of event.changedTouches) {
            if (this.activeTouches.has(touch.identifier)) {
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.activeTouches.set(touch.identifier, { x, y, id: touch.identifier });
            }
        }
    }

    // touchend / touchcancel 時にタッチを削除する
    removeTouches(event) {
        for (let touch of event.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }
    }

    get size() {
        return this.activeTouches.size;
    }

    values() {
        return this.activeTouches.values();
    }

    clear() {
        this.activeTouches.clear();
    }
}
