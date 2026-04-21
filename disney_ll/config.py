# ============================================================
# Disney Lightning Lane 自动抢票配置
# ============================================================

# --- 账号 ---
DISNEY_EMAIL = "your_email@example.com"
DISNEY_PASSWORD = "your_password"

# --- 行程日期（YYYY-MM-DD，奥兰多当地日期）---
VISIT_DATES = [
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
]

# --- 抢票提前天数（Disney 规则：度假区住客 7 天前，外住客当天）---
# 如果住 Disney 官方酒店，改成 7；外住改成 0（当天 7am 抢）
ADVANCE_DAYS = 0  # 0 = 当天抢

# --- 目标乐园 ---
# 可选: "Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"
PARKS = {
    "2026-05-01": "Magic Kingdom",
    "2026-05-02": "Hollywood Studios",
    "2026-05-03": "EPCOT",
}

# --- 想抢的项目（按优先级排列，抢到第一个后继续抢下一个）---
# 名字要和 Disney App 显示的英文名一致
PRIORITY_ATTRACTIONS = [
    "TRON Lightcycle / Run",
    "Seven Dwarfs Mine Train",
    "Space Mountain",
    "Guardians of the Galaxy: Cosmic Rewind",
    "TIANA'S Bayou Adventure",
]

# --- 游玩人数（账号下的 Family & Friends）---
# 留空则抢账号下所有人；指定名字则只选这些人
PARTY_MEMBERS = []  # 例如: ["张三", "李四"]

# --- 时间设置（奥兰多 = ET，加州 = PT = ET - 3h）---
# 抢票开放时间（Disney 固定 7:00 AM ET）
LL_OPEN_HOUR_ET = 7
LL_OPEN_MINUTE_ET = 0

# 提前多少秒开始刷新等待开放（建议 30s）
WARMUP_SECONDS = 30

# 每次重试间隔（秒）
RETRY_INTERVAL = 2

# 最大重试次数（超出后放弃）
MAX_RETRIES = 60
