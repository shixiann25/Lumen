#!/bin/bash
# 三天都挂后台定时跑（加州时间 4:00am = 奥兰多 7:00am）
# 用法：chmod +x schedule_all.sh && ./schedule_all.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

PYTHON=$(which python3)

run_at() {
    local DATE=$1
    local WHEN=$2  # "HH:MM" 加州时间
    local HOUR=${WHEN%%:*}
    local MIN=${WHEN##*:}

    echo "计划 $DATE 于加州 $WHEN 开始抢票..."

    # 使用 launchd at-style（macOS 推荐用 launchd，这里用 sleep 差值简单实现）
    NOW_EPOCH=$(date +%s)
    TARGET=$(date -j -f "%Y-%m-%d %H:%M" "$(date +%Y-%m-%d) $WHEN" +%s 2>/dev/null)
    # 如果 $DATE 不是今天，需要指定日期
    TARGET_FULL=$(date -j -f "%Y-%m-%d %H:%M" "$DATE $WHEN" +%s 2>/dev/null)

    SLEEP_SEC=$(( TARGET_FULL - NOW_EPOCH ))
    if [ "$SLEEP_SEC" -lt 0 ]; then
        echo "  ⚠️  $DATE 的抢票时间已过，跳过"
        return
    fi

    (
        echo "[$DATE] 将在 ${SLEEP_SEC}s 后启动"
        sleep "$SLEEP_SEC"
        echo "[$DATE] 开始运行 grab_ll.py"
        cd "$SCRIPT_DIR"
        "$PYTHON" grab_ll.py --date "$DATE" >> "$LOG_DIR/${DATE}.log" 2>&1
        echo "[$DATE] 脚本结束"
    ) &

    echo "  → 后台 PID $!"
}

# 外住客（ADVANCE_DAYS=0）：当天早上 4:00am PT 抢
run_at "2026-05-01" "04:00"
run_at "2026-05-02" "04:00"
run_at "2026-05-03" "04:00"

echo ""
echo "三个任务已挂后台，日志在 $LOG_DIR/"
echo "查看进度: tail -f $LOG_DIR/2026-05-01.log"
