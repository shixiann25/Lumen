import { useLang } from '../contexts/LangContext'

export default function LearnPage() {
  const { lang, t } = useLang()

  // ── Chinese content ──────────────────────────────────────────────────────────
  const zhSections = [
    {
      id: 'exposure',
      index: '01',
      title: '曝光控制',
      sub: '光圈 / 快门 / ISO 共同决定进光量',
      params: [
        {
          param: '光圈', en: 'Aperture', icon: '◉', color: '#B8965A', bg: '#FBF4E8',
          mnemonic: '镜头的"瞳孔大小"',
          core: 'f 值越小，光圈越大，进光越多，背景越模糊',
          detail: 'f/1.8–2.8 适合人像弱光；f/8–16 适合风景让前后都清晰',
          relation: '开大一档光圈 = 进光加倍，可以把快门加快一档或 ISO 降一档来保持同样亮度',
        },
        {
          param: '快门', en: 'Shutter Speed', icon: '◷', color: '#7B9EBA', bg: '#EBF3FA',
          mnemonic: '传感器的"开眼时间"',
          core: '越快凝固运动，越慢进光多但容易糊',
          detail: '1/500s 以上冻结动作；低于 1/60s 手持易糊，建议用三脚架',
          relation: '慢快门一档 = 进光加倍，可以收小光圈或降 ISO 来维持正确曝光',
        },
        {
          param: 'ISO', en: 'Sensitivity', icon: '◑', color: '#8BAA8B', bg: '#F0EBFA',
          mnemonic: '传感器的"听力"',
          core: '越高越亮，但噪点越多',
          detail: '先大光圈、再慢快门，实在不够才提 ISO；3200 以内通常可接受',
          relation: 'ISO 是最后手段——调整它不影响景深或运动模糊，但代价是画质变差',
        },
      ],
      scenariosLabel: '实战口诀',
      scenarios: [
        { scene: '拍人像想虚化背景', tip: '开大光圈（f/1.8–2.8），同时提高快门防糊' },
        { scene: '拍流水想要丝滑', tip: '慢快门（1s 以上），收小光圈，上三脚架' },
        { scene: '室内弱光拍不清楚', tip: '先开大光圈 → 再降快门 → 最后提 ISO' },
      ],
      meteringLabel: '测光模式',
      meteringModes: [
        { mode: '评价测光', icon: '⊞', when: '默认', desc: '对整个画面均匀测光，相机自动判断亮度。适合大多数光线均匀的场景，是默认模式。' },
        { mode: '点测光', icon: '⊙', when: '逆光主体', desc: '只测画面中心一个小点。逆光拍人像时必用——对准人脸测光，确保脸部曝光正确，背景可以过曝。' },
        { mode: '中央重点', icon: '◎', when: '人像', desc: '以中心为主、兼顾边缘。兼顾性强，适合主体在中央的场景。' },
      ],
      histogramLabel: '直方图怎么看',
      histogramAxis: { left: '暗部', center: '中间调', right: '亮部' },
      histogramReadings: [
        { icon: '←', label: '波形堆左边', desc: '画面偏暗，欠曝——可以增加曝光补偿', color: '#7B9EBA' },
        { icon: '→', label: '波形贴右墙', desc: '高光溢出，细节丢失——需要减少曝光', color: '#E07B7B' },
        { icon: '◎', label: '波形居中偏右', desc: '曝光正常，亮部有细节', color: '#8BAA8B' },
      ],
    },
    {
      id: 'focus',
      index: '02',
      title: '对焦',
      sub: '拍清楚的关键——让相机知道你要拍什么',
      afLabel: '自动对焦模式',
      afModes: [
        { mode: 'AF-S（单次自动对焦）', when: '拍静止主体', desc: '半按快门锁定焦点，主体不动时最准确。拍人像、静物、风景都用这个。' },
        { mode: 'AF-C（连续自动对焦）', when: '拍运动主体', desc: '持续追踪运动中的主体，半按快门不锁定。拍跑步的人、动物、体育场景。' },
        { mode: '人脸 / 眼睛识别', when: '拍人像必开', desc: '现代相机都有，直接识别眼睛对焦。拍人时开启它，省去手动移动对焦点的麻烦。' },
      ],
      dofLabel: '景深与清晰范围',
      dofIntro: '景深越浅，主体之外的区域越模糊。三个因素影响景深：',
      dofFactors: [
        { factor: '光圈越大（f 值越小）', effect: '景深越浅 → 背景模糊越明显' },
        { factor: '焦距越长（mm 越大）', effect: '景深越浅 → 长焦人像虚化更美' },
        { factor: '距离越近', effect: '景深越浅 → 近距拍花草很容易虚化' },
      ],
      tipsLabel: '实用对焦技巧',
      tips: [
        { tip: '锁焦再构图', desc: '先把对焦点对准主体，半按快门锁焦，保持半按移动到想要的构图，再完全按下。' },
        { tip: '对焦点移到眼睛', desc: '拍人像时把对焦点直接移到眼睛位置，比中心点锁焦再构图更准确，不会因为移动而失焦。' },
        { tip: '弱光对焦技巧', desc: '暗处 AI 对焦容易"拉风箱"——找画面中高对比度的边缘（如窗框、灯边）先对焦锁定，再移到主体。' },
      ],
    },
    {
      id: 'composition',
      index: '03',
      title: '构图',
      sub: '如何安排画面——让照片更有力量',
      cards: [
        { name: '三分法', icon: '⊞', bg: '#FBF4E8', desc: '把画面横竖各分三等份，将主体放在交叉点上，比正中央更有张力。', tip: '拍人像时眼睛放上方三分线；风景时地平线放上三分或下三分，不要居中。' },
        { name: '引导线', icon: '↗', bg: '#EBF3FA', desc: '利用道路、栏杆、河流等线条，引导视线指向主体。', tip: '站在线的延伸方向拍，线条从画面边缘延伸向主体，效果最强。' },
        { name: '框架构图', icon: '▭', bg: '#EAFAF0', desc: '用门洞、窗户、树枝等自然框架把主体圈在其中，增加层次感。', tip: '前景框架不需要清晰，刻意虚化也好，只要能框住主体就够。' },
        { name: '对称与反射', icon: '⇄', bg: '#F0EBFA', desc: '水面、镜子等形成的对称感，给画面带来秩序感和安静气质。', tip: '拍水面倒影时把地平线放正中，让上下完全对称，效果最强。' },
        { name: '前景与层次', icon: '◫', bg: '#FBF4E8', desc: '加入近处的前景元素，让画面有远近层次感，更有空间纵深。', tip: '虚化的前景让主体更突出，清晰的前景增加信息量，两种都可以试。' },
        { name: '留白', icon: '□', bg: '#EBF3FA', desc: '给主体周围留出空白，让视线有呼吸感，避免画面过于拥挤。', tip: '主体朝向的方向多留白——人看向右边，右边要给更多空间。' },
        { name: '视角与高度', icon: '↕', bg: '#EAFAF0', desc: '改变拍摄高度和角度，同一场景能拍出完全不同的感觉。', tip: '低角度让主体显得高大有力；俯拍适合展示全局；平视最自然亲近。' },
        { name: '简洁与减法', icon: '−', bg: '#F0EBFA', desc: '去掉画面中不必要的干扰元素，让主体更突出。', tip: '拍前扫一眼取景框边缘——有没有多余的电线杆、路人，能走一步避开就避开。' },
      ],
      focalLabel: '焦段选择',
      focalIntro: '焦段决定你能「看到多宽」以及透视关系，本质上是一种构图决策。',
      focalRows: [
        { range: '16–24mm', type: '广角', icon: '◁◁', desc: '视野极宽，有透视变形，近大远小夸张。适合建筑、风景、室内空间。' },
        { range: '35–50mm', type: '标准', icon: '◁', desc: '接近人眼视角，自然不夸张。35mm 街头日常首选；50mm 万能。' },
        { range: '85–135mm', type: '人像', icon: '▷', desc: '背景压缩，虚化美，人脸比例自然。拍半身/全身人像的黄金焦段。' },
        { range: '200mm+', type: '长焦', icon: '▷▷', desc: '远处主体拉近，极强压缩感。拍体育、野生动物、月亮。' },
      ],
    },
    {
      id: 'light',
      index: '04',
      title: '光线',
      sub: '光从哪里来，如何影响画面',
      directionLabel: '光线方向',
      directions: [
        { dir: '顺光', icon: '→', desc: '光源在摄影师身后，正面打亮主体', pros: '颜色还原准确，曝光好控制', cons: '缺乏立体感，画面较平', use: '证件照、产品拍摄' },
        { dir: '侧光', icon: '↗', desc: '光源来自侧面，一半亮一半暗', pros: '立体感强，细节丰富，最有质感', cons: '阴影面要注意噪点', use: '人像、静物、建筑纹理' },
        { dir: '逆光', icon: '←', desc: '光源在主体背后，拍摄者面对光', pros: '轮廓光、剪影、发丝光效果漂亮', cons: '主体易欠曝，需点测光', use: '人像轮廓光、日落剪影' },
        { dir: '散射光', icon: '○', desc: '阴天或遮挡后的漫反射光', pros: '柔和均匀，无强阴影，皮肤好看', cons: '反差低，光线较暗', use: '人像、花卉、食物' },
      ],
      qualityLabel: '光线质感',
      hardLight: { name: '硬光', src: '直射阳光、闪光灯直打', effect: '阴影边缘清晰、反差强，轮廓感突出', scene: '戏剧感人像、雕塑纹理' },
      softLight: { name: '软光', src: '阴天、柔光箱、窗帘透光', effect: '阴影过渡柔和，皮肤质感好', scene: '日常人像、食物、产品' },
      softLabel: '适合：',
      bestTimeLabel: '最佳拍摄时段',
      bestTimes: [
        { name: '黄金时段', time: '日出后 / 日落前各约 1 小时', color: '#B8965A', desc: '光线低角度斜射，暖橙色调，阴影长而柔，户外人像和风景的最佳时机。' },
        { name: '蓝调时刻', time: '日落后 / 日出前约 20 分钟', color: '#7B9EBA', desc: '天空呈深蓝色，城市灯光刚亮起，天地亮度均衡，拍夜景不需要超长曝光。' },
        { name: '正午硬光', time: '上午 10 点 — 下午 2 点', color: '#8BAA8B', desc: '阳光直射，阴影短且硬。避开拍人像，但适合拍需要强反差的纹理或建筑。' },
      ],
      wbLabel: '白平衡',
      wbIntro: '白平衡控制照片的冷暖色调。拍 RAW 格式可以后期随意修改，拍 JPG 时选对更重要。',
      wbModes: [
        { label: 'AWB 自动白平衡', desc: '适合大多数场景，相机自动判断色温' },
        { label: '日光（5500K）', desc: '晴天户外，还原自然颜色' },
        { label: '阴天（6500K）', desc: '阴天或阴影中，稍微偏暖补偿蓝调' },
        { label: '钨丝灯（3200K）', desc: '室内白炽灯下，避免橙黄偏色' },
        { label: '手动开尔文值', desc: '精确控制，进阶用户适用' },
      ],
      flashLabel: '闪光灯入门',
      flashTechniques: [
        { name: '机顶闪（直打）', desc: '方便携带，但光线硬、人脸平、红眼。用扩散片或跳闪（对着天花板）变软光。' },
        { name: '跳闪', desc: '把闪光灯头转向天花板或白墙，光线反射后变软，自然得多，室内首选用法。' },
        { name: '离机闪', desc: '闪光灯离开相机，用无线触发，光线方向完全自由。可模拟窗光、侧光等效果。' },
        { name: '慢速同步', desc: '慢快门 + 闪光灯，既有环境光氛围感，又能补亮主体。夜间人像常用。' },
        { name: '闪光补偿', desc: '闪光太强时调 -1 到 -2 档，让光线更自然，避免"闪光灯脸"。' },
      ],
    },
    {
      id: 'scenes',
      index: '05',
      title: '场景实战',
      sub: '不知道怎么设置？找最接近的场景直接套用',
      scenes: [
        { scene: '晴天户外人像', icon: '☀️', bg: '#FBF4E8', settings: [{ k: '光圈', v: 'f/1.8–2.8' }, { k: '快门', v: '1/500–1000s' }, { k: 'ISO', v: '100–200' }], tip: '正午阳光太硬，选阴影处或背光拍。黄金时段（日出日落前后1小时）是人像最佳时机。逆光拍记得用点测光对准人脸。' },
        { scene: '室内自然光（窗边）', icon: '🪟', bg: '#EBF3FA', settings: [{ k: '光圈', v: 'f/1.8–2.0' }, { k: '快门', v: '1/60–250s' }, { k: 'ISO', v: '400–1600' }], tip: '靠近窗户拍，窗成侧光源，人脸有立体感。窗帘透光比直射更柔和。快门不低于 1/60s 防糊。' },
        { scene: '风景 / 建筑', icon: '🏔️', bg: '#EAFAF0', settings: [{ k: '光圈', v: 'f/8–11' }, { k: '快门', v: '1/125–250s' }, { k: 'ISO', v: '100–400' }], tip: '日落后蓝调时刻（约20分钟）天空颜色最迷人。用三分法放置地平线，前景增加层次感。' },
        { scene: '街头抓拍', icon: '🏙️', bg: '#F0EBFA', settings: [{ k: '光圈', v: 'f/4–8' }, { k: '快门', v: '1/250–500s' }, { k: 'ISO', v: '400–1600' }], tip: '用 A 档（光圈优先）最方便。预先对焦 3–5 米，遇到好画面直接按。街头多观察光线和人流，等待决定性瞬间。' },
        { scene: '夜景 / 城市灯光', icon: '🌃', bg: '#F8F6F2', settings: [{ k: '光圈', v: 'f/8–11' }, { k: '快门', v: '5–30s' }, { k: 'ISO', v: '100–400' }], tip: '必须用三脚架，用自拍延迟（2s）避免按快门时的抖动。蓝调时刻拍，天空和灯光亮度均衡最好看。' },
        { scene: '阴天 / 散射光人像', icon: '☁️', bg: '#FBF4E8', settings: [{ k: '光圈', v: 'f/2.0–4' }, { k: '快门', v: '1/125–500s' }, { k: 'ISO', v: '200–800' }], tip: '阴天整个天空都是柔光箱，皮肤质感非常好。颜色容易偏冷蓝，白平衡选"阴天"预设或稍微提高色温。' },
      ],
    },
  ]

  // ── English content ──────────────────────────────────────────────────────────
  const enSections = [
    {
      id: 'exposure',
      index: '01',
      title: 'Exposure Control',
      sub: 'Aperture / Shutter / ISO together control light intake',
      params: [
        {
          param: 'Aperture', en: 'f-stop', icon: '◉', color: '#B8965A', bg: '#FBF4E8',
          mnemonic: 'f/1.8 → blurry BG · f/11 → sharp all',
          core: 'Controls how much light enters and depth of field',
          detail: 'Lower f-number = wider aperture = more blur. Use f/1.4–2.8 for portraits; f/8–16 for landscapes.',
          relation: 'Wider aperture needs faster shutter or lower ISO to avoid overexposure',
        },
        {
          param: 'Shutter Speed', en: 'time', icon: '◷', color: '#7B9EBA', bg: '#EBF3FA',
          mnemonic: '1/500s → freeze · 1/30s → motion blur',
          core: 'Controls motion — fast freezes, slow blurs',
          detail: 'Rule of thumb: shutter ≥ 1/focal length to avoid camera shake. 1/500s+ for sports; 1/60s for still subjects.',
          relation: 'Slower shutter needs smaller aperture or lower ISO to compensate',
        },
        {
          param: 'ISO', en: 'sensitivity', icon: '◑', color: '#8BAA8B', bg: '#F0EBFA',
          mnemonic: 'ISO 100 → clean · ISO 3200 → grainy',
          core: 'Sensitivity to light — higher = brighter but noisier',
          detail: 'Keep ISO as low as possible. ISO 100–400 outdoors; ISO 800–3200 indoors or at night.',
          relation: 'Higher ISO lets you use faster shutter or smaller aperture in low light',
        },
      ],
      scenariosLabel: 'Quick Reference',
      scenarios: [
        { scene: '☀️ Outdoor portrait', aperture: 'f/1.8–2.8', shutter: '1/500–1/1000s', iso: 'ISO 100–200' },
        { scene: '🏃 Sports / action', aperture: 'f/4–5.6', shutter: '1/1000s+', iso: 'ISO 400–1600' },
        { scene: '🌃 Night / low light', aperture: 'f/1.4–2.8', shutter: '1/30–1/60s', iso: 'ISO 1600–6400' },
      ],
      meteringLabel: 'Metering Modes',
      meteringModes: [
        { mode: 'Evaluative', icon: '⊞', when: 'Default', desc: 'Reads the entire scene — best for most situations' },
        { mode: 'Spot', icon: '⊙', when: 'Backlit subjects', desc: 'Meters only the center point — great for backlit portraits' },
        { mode: 'Center-weighted', icon: '◎', when: 'Portraits', desc: 'Emphasizes the center — more forgiving than spot' },
      ],
      histogramLabel: 'Reading the Histogram',
      histogramAxis: { left: 'Shadows', center: 'Midtones', right: 'Highlights' },
      histogramReadings: [
        { icon: '←', label: 'Peaks on the left', desc: 'Underexposed — increase exposure compensation', color: '#7B9EBA' },
        { icon: '→', label: 'Clipped on the right', desc: 'Blown highlights — reduce exposure', color: '#E07B7B' },
        { icon: '◎', label: 'Centered / slightly right', desc: 'Well exposed — good highlight detail', color: '#8BAA8B' },
      ],
    },
    {
      id: 'focus',
      index: '02',
      title: 'Focus',
      sub: 'The key to sharp shots — tell the camera what to focus on',
      afLabel: 'Autofocus Modes',
      afModes: [
        { mode: 'AF-S (One-Shot)', when: 'Still subjects', desc: 'Locks focus when you half-press. Best for portraits and still life.' },
        { mode: 'AF-C (Continuous)', when: 'Moving subjects', desc: 'Tracks moving subjects continuously. Essential for sports and kids.' },
        { mode: 'Face / Eye AF', when: 'Portraits', desc: 'Automatically detects and tracks eyes. Available on most modern mirrorless cameras.' },
      ],
      dofLabel: 'Depth of Field',
      dofIntro: 'Shallower depth of field means more blur outside the subject. Three factors control it:',
      dofFactors: [
        { factor: 'Aperture', effect: 'f/1.4 = very shallow; f/11 = deep — most impactful control' },
        { factor: 'Focal length', effect: 'Longer focal length = shallower DOF at same aperture' },
        { factor: 'Distance', effect: 'Closer to subject = shallower DOF' },
      ],
      tipsLabel: 'Practical Focus Tips',
      tips: [
        { tip: 'Focus then reframe', desc: 'Half-press to lock focus on the eye, then recompose and shoot.' },
        { tip: 'Move the focus point', desc: "Shift the AF point directly onto the subject's eye instead of reframing." },
        { tip: 'Low-light focusing', desc: 'Use AF-assist beam, or focus on a nearby high-contrast edge at the same distance.' },
      ],
    },
    {
      id: 'composition',
      index: '03',
      title: 'Composition',
      sub: 'Arranging the frame — making photos more powerful',
      cards: [
        { name: 'Rule of Thirds', icon: '◎', bg: '#FBF4E8', desc: 'Divide the frame into a 3×3 grid. Place subjects on the intersections for a more dynamic image.', tip: 'Enable grid lines on your camera or phone viewfinder.' },
        { name: 'Leading Lines', icon: '→', bg: '#EBF3FA', desc: "Use roads, fences, rivers, or shadows to guide the viewer's eye toward the subject.", tip: 'Shoot from low angles to make lines more dramatic.' },
        { name: 'Framing', icon: '⬜', bg: '#EAFAF0', desc: 'Use doorways, windows, arches, or foliage to frame your subject naturally.', tip: "The frame doesn't need to be sharp — soft foreground frames add depth." },
        { name: 'Symmetry & Reflection', icon: '◑', bg: '#F0EBFA', desc: 'Reflections in water or glass, or architectural symmetry, create strong visual impact.', tip: 'Shoot straight on for maximum symmetry effect.' },
        { name: 'Foreground & Layers', icon: '◈', bg: '#FBF4E8', desc: 'Include foreground elements to add depth and dimension to the scene.', tip: 'Use wide aperture to blur foreground elements for a painterly feel.' },
        { name: 'Negative Space', icon: '○', bg: '#EBF3FA', desc: 'Empty sky, a plain wall, or minimal backgrounds let the subject breathe.', tip: 'Especially effective for conveying loneliness, calm, or minimalism.' },
        { name: 'Angle & Perspective', icon: '◷', bg: '#EAFAF0', desc: 'Shooting from high, low, or at eye-level dramatically changes the mood.', tip: 'Get low for children and pets — it creates intimacy rather than looking down.' },
        { name: 'Simplify', icon: '—', bg: '#F0EBFA', desc: 'Remove distracting elements. A clean background makes the subject stand out.', tip: 'Move around until the background is as clean as possible.' },
      ],
      focalLabel: 'Focal Length Guide',
      focalIntro: 'Focal length controls how wide you see and perspective — it is fundamentally a composition decision.',
      focalRows: [
        { range: '16–24mm', type: 'Wide angle', icon: '◁◁', desc: 'Landscape / architecture / interiors — dramatic perspective distortion.' },
        { range: '35–50mm', type: 'Standard', icon: '◁', desc: 'Street / daily life / food — natural, close to human eye.' },
        { range: '85–135mm', type: 'Portrait', icon: '▷', desc: 'Portrait / detail — flattering compression, beautiful blur.' },
        { range: '200mm+', type: 'Telephoto', icon: '▷▷', desc: 'Wildlife / sports — strong compression, isolates subject.' },
      ],
    },
    {
      id: 'light',
      index: '04',
      title: 'Light',
      sub: 'Where light comes from and how it shapes the image',
      directionLabel: 'Light Direction',
      directions: [
        { dir: 'Front light', icon: '→', desc: 'Light source behind the photographer, illuminating the subject directly', pros: 'Even exposure, accurate colors', cons: 'Flat look, lacks dimension', use: 'ID photos, product shots' },
        { dir: 'Side light', icon: '↗', desc: 'Light from one side — one half bright, one half in shadow', pros: 'Great texture, dimension, and drama', cons: 'Shadow side may need noise management', use: 'Portraits, still life, architecture' },
        { dir: 'Backlight', icon: '←', desc: 'Light source behind the subject, facing the photographer', pros: 'Beautiful rim light, silhouettes, hair glow', cons: 'Subject can be underexposed — needs spot metering', use: 'Portrait rim light, sunset silhouettes' },
        { dir: 'Diffused', icon: '○', desc: 'Overcast sky or reflected indirect light', pros: 'Soft and even, no harsh shadows, flattering skin', cons: 'Low contrast, flat look', use: 'Portraits, flowers, food' },
      ],
      qualityLabel: 'Light Quality',
      hardLight: { name: 'Hard Light', src: 'Direct sun, direct flash', effect: 'Sharp shadow edges, high contrast, strong outlines', scene: 'Dramatic portraits, texture shots' },
      softLight: { name: 'Soft Light', src: 'Overcast, softbox, window with curtain', effect: 'Smooth shadow transitions, flattering skin', scene: 'Everyday portraits, food, products' },
      softLabel: 'Best for:',
      bestTimeLabel: 'Best Times to Shoot',
      bestTimes: [
        { name: 'Golden Hour', time: 'First hour after sunrise / last hour before sunset', color: '#B8965A', desc: 'Low-angle warm light, long soft shadows — the best time for outdoor portraits and landscapes.' },
        { name: 'Blue Hour', time: '20 minutes after sunset / before sunrise', color: '#7B9EBA', desc: 'Deep blue sky, city lights just turning on — balanced ambient light without ultra-long exposures.' },
        { name: 'Midday Harsh Light', time: '10am – 2pm', color: '#8BAA8B', desc: 'Direct overhead sun with short, hard shadows. Avoid for portraits; good for texture and architecture.' },
      ],
      wbLabel: 'White Balance',
      wbIntro: 'White balance controls the warm/cool color cast. Shooting RAW lets you adjust freely in post; for JPEG, getting it right in-camera matters more.',
      wbModes: [
        { label: 'AWB (Auto)', desc: 'Works for most scenes — camera auto-detects color temperature' },
        { label: 'Daylight (5500K)', desc: 'Outdoors in sun — natural, accurate colors' },
        { label: 'Cloudy (6500K)', desc: 'Overcast or shade — slightly warm tone to compensate' },
        { label: 'Tungsten (3200K)', desc: 'Indoor incandescent light — removes orange cast' },
        { label: 'Custom Kelvin', desc: 'Precise control — for advanced users' },
      ],
      flashLabel: 'Flash Basics',
      flashTechniques: [
        { name: 'On-camera flash', desc: 'Convenient but harsh. Use a diffuser or bounce off the ceiling to soften.' },
        { name: 'Bounce flash', desc: 'Aim the flash head at the ceiling or a white wall. Reflected light becomes soft and natural — best technique for indoor events.' },
        { name: 'Off-camera flash', desc: 'Detach flash and use wireless trigger for complete control over light direction — simulates window, side, or rim light.' },
        { name: 'Slow sync', desc: 'Slow shutter + flash. Captures ambient mood and illuminates subject. Common for evening portraits.' },
        { name: 'Flash exposure compensation', desc: 'Dial down flash -1 to -2 stops for more natural light that avoids the "flashy" look.' },
      ],
    },
    {
      id: 'scenes',
      index: '05',
      title: 'Scene Practice',
      sub: "Don't know where to start? Find the closest scene and apply directly.",
      scenes: [
        { scene: 'Outdoor Portrait', icon: '☀️', bg: '#FBF4E8', settings: [{ k: 'Aperture', v: 'f/1.8–2.8' }, { k: 'Shutter', v: '1/500–1/1000s' }, { k: 'ISO', v: 'ISO 100–400' }], tip: 'Shoot in shade or during golden hour to get soft, even light on the face.' },
        { scene: 'Landscape', icon: '🏔️', bg: '#EAFAF0', settings: [{ k: 'Aperture', v: 'f/8–11' }, { k: 'Shutter', v: '1/60–1/250s' }, { k: 'ISO', v: 'ISO 100' }], tip: 'Use a tripod if possible; include foreground elements for depth.' },
        { scene: 'Street / Candid', icon: '🏙️', bg: '#F0EBFA', settings: [{ k: 'Aperture', v: 'f/5.6–8' }, { k: 'Shutter', v: '1/500s+' }, { k: 'ISO', v: 'ISO 400–800' }], tip: 'Program (P) mode or set shutter priority — stay ready to shoot at any moment.' },
        { scene: 'Indoor / Low Light', icon: '🪟', bg: '#EBF3FA', settings: [{ k: 'Aperture', v: 'f/1.4–2.8' }, { k: 'Shutter', v: '1/60–1/125s' }, { k: 'ISO', v: 'ISO 1600–6400' }], tip: 'Find a window for natural light; use noise reduction carefully in post.' },
        { scene: 'Still Life / Food', icon: '🌿', bg: '#F8F6F2', settings: [{ k: 'Aperture', v: 'f/2.8–5.6' }, { k: 'Shutter', v: '1/100–1/250s' }, { k: 'ISO', v: 'ISO 100–400' }], tip: 'Side or back window light creates beautiful texture and depth.' },
        { scene: 'Night / Long Exposure', icon: '🌃', bg: '#FBF4E8', settings: [{ k: 'Aperture', v: 'f/8–11' }, { k: 'Shutter', v: '5–30s' }, { k: 'ISO', v: 'ISO 100–400' }], tip: 'Use a tripod and 2-second timer to avoid camera shake.' },
      ],
    },
  ]

  const sections = lang === 'en' ? enSections : zhSections

  const navItems = [
    { label: t('learn.nav.1'), href: '#exposure' },
    { label: t('learn.nav.2'), href: '#focus' },
    { label: t('learn.nav.3'), href: '#composition' },
    { label: t('learn.nav.4'), href: '#light' },
    { label: t('learn.nav.5'), href: '#scenes' },
  ]

  const [exposure, focus, composition, light, scenes] = sections

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-14">
        <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('learn.eyebrow')}</p>
        <h1 className="font-display text-3xl font-semibold text-[#1A1714]">{t('learn.title')}</h1>
        <p className="text-[#6B6158] text-sm mt-2">{t('learn.desc')}</p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-16">
        {navItems.map(({ label, href }) => (
          <a key={href} href={href}
            className="px-4 py-2 rounded-full border border-[#E5DED5] text-[#6B6158] text-sm hover:border-[#B8965A] hover:text-[#B8965A] transition-colors">
            {label}
          </a>
        ))}
      </div>

      {/* ① Exposure */}
      <section id="exposure" className="mb-24 scroll-mt-20">
        <SectionHeader index={exposure.index} title={exposure.title} sub={exposure.sub} />

        {/* Three params */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {exposure.params.map(({ param, en, icon, color, bg, mnemonic, core, detail, relation }) => (
            <div key={param} className="rounded-2xl border border-[#E5DED5] overflow-hidden flex flex-col" style={{ backgroundColor: bg }}>
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" style={{ color }}>{icon}</span>
                  <span className="font-display font-semibold text-[#1A1714]">{param}</span>
                  <span className="text-[#A89C91] text-xs">{en}</span>
                </div>
                <p className="text-[#A89C91] text-xs mb-2">{mnemonic}</p>
                <p className="text-[#1A1714] text-sm font-medium mb-2">{core}</p>
                <p className="text-[#6B6158] text-xs leading-relaxed">{detail}</p>
              </div>
              <div className="px-5 py-3 bg-black/5 border-t border-black/5 mt-auto">
                <p className="text-xs text-[#6B6158] leading-relaxed">
                  <span className="font-medium text-[#1A1714]">{lang === 'en' ? 'Relation: ' : '与其他参数的关系：'}</span>{relation}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Scenarios */}
        <div className="border border-[#E5DED5] rounded-2xl p-6 bg-white mb-6">
          <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase mb-4">{exposure.scenariosLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exposure.scenarios.map((s, i) => (
              lang === 'en' ? (
                <div key={i} className="bg-[#F8F6F2] rounded-xl p-4">
                  <p className="text-[#B8965A] text-xs font-medium mb-1.5">{s.scene}</p>
                  <div className="space-y-0.5 text-xs text-[#6B6158]">
                    <p>◉ {s.aperture}</p>
                    <p>◷ {s.shutter}</p>
                    <p>◑ {s.iso}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-[#F8F6F2] rounded-xl p-4">
                  <p className="text-[#B8965A] text-xs font-medium mb-1.5">{s.scene}</p>
                  <p className="text-[#6B6158] text-xs leading-relaxed">→ {s.tip}</p>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Metering + Histogram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{exposure.meteringLabel}</p>
            <div className="space-y-4">
              {exposure.meteringModes.map(({ mode, icon, when, desc }) => (
                <div key={mode} className="flex gap-3">
                  <span className="text-[#B8965A] mt-0.5 flex-shrink-0">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-[#1A1714]">{mode}</p>
                      <span className="text-[10px] bg-[#F0EBE3] text-[#B8965A] px-2 py-0.5 rounded-full">{when}</span>
                    </div>
                    <p className="text-[#6B6158] text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{exposure.histogramLabel}</p>
            <div className="bg-[#1A1714] rounded-xl p-4 mb-4 font-mono text-xs">
              <div className="flex items-end gap-0.5 h-12 mb-2">
                {[1,2,3,4,6,8,10,12,14,12,10,8,6,4,3,2,1].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#B8965A] rounded-sm opacity-80" style={{ height: `${h * 8}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-white/30">
                <span>{exposure.histogramAxis.left}</span>
                <span>{exposure.histogramAxis.center}</span>
                <span>{exposure.histogramAxis.right}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {exposure.histogramReadings.map(({ icon, label, desc, color }) => (
                <div key={label} className="flex gap-2">
                  <span className="flex-shrink-0 font-bold" style={{ color }}>{icon}</span>
                  <span><span className="font-medium text-[#1A1714]">{label}：</span><span className="text-[#6B6158]">{desc}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ② Focus */}
      <section id="focus" className="mb-24 scroll-mt-20">
        <SectionHeader index={focus.index} title={focus.title} sub={focus.sub} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {/* AF modes */}
          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{focus.afLabel}</p>
            <div className="space-y-4">
              {focus.afModes.map(({ mode, when, desc }) => (
                <div key={mode}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-[#1A1714]">{mode}</p>
                    <span className="text-[10px] bg-[#F0EBE3] text-[#B8965A] px-2 py-0.5 rounded-full">{when}</span>
                  </div>
                  <p className="text-[#6B6158] text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Depth of field */}
          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{focus.dofLabel}</p>
            <p className="text-[#6B6158] text-sm leading-relaxed mb-4">{focus.dofIntro}</p>
            <div className="space-y-3">
              {focus.dofFactors.map(({ factor, effect }) => (
                <div key={factor} className="flex gap-3 text-xs">
                  <span className="text-[#B8965A] flex-shrink-0 mt-0.5">◉</span>
                  <span><span className="font-medium text-[#1A1714]">{factor}</span><span className="text-[#A89C91]"> — </span><span className="text-[#6B6158]">{effect}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Focus tips */}
        <div className="bg-[#F8F6F2] border border-[#E5DED5] rounded-2xl p-6">
          <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{focus.tipsLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {focus.tips.map(({ tip, desc }) => (
              <div key={tip}>
                <p className="font-medium text-sm text-[#1A1714] mb-2">{tip}</p>
                <p className="text-[#6B6158] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ③ Composition */}
      <section id="composition" className="mb-24 scroll-mt-20">
        <SectionHeader index={composition.index} title={composition.title} sub={composition.sub} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {composition.cards.map(({ name, icon, bg, desc, tip }) => (
            <div key={name} className="rounded-2xl p-5 border border-[#E5DED5]" style={{ backgroundColor: bg }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-[#B8965A] font-semibold flex-shrink-0">{icon}</span>
                <span className="font-display font-semibold text-[#1A1714]">{name}</span>
              </div>
              <p className="text-[#6B6158] text-sm leading-relaxed mb-3">{desc}</p>
              <p className="text-xs text-[#B8965A] leading-relaxed border-t border-black/5 pt-3">
                <span className="font-medium">{lang === 'en' ? 'Tip: ' : '实操：'}</span>{tip}
              </p>
            </div>
          ))}
        </div>

        {/* Focal length */}
        <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
          <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-1">{composition.focalLabel}</p>
          <p className="text-[#6B6158] text-sm mb-5">{composition.focalIntro}</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {composition.focalRows.map(({ range, type, icon, desc }) => (
              <div key={range} className="bg-[#F8F6F2] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#B8965A] text-xs">{icon}</span>
                  <span className="font-display font-semibold text-[#1A1714] text-sm">{range}</span>
                  <span className="text-[#A89C91] text-xs">{type}</span>
                </div>
                <p className="text-[#6B6158] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ Light */}
      <section id="light" className="mb-24 scroll-mt-20">
        <SectionHeader index={light.index} title={light.title} sub={light.sub} />

        <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-5">{light.directionLabel}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {light.directions.map(({ dir, icon, desc, pros, cons, use }) => (
            <div key={dir} className="bg-white border border-[#E5DED5] rounded-2xl p-5 hover:border-[#B8965A] transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[#B8965A] font-bold text-sm">{icon}</span>
                <span className="font-display font-semibold text-[#1A1714]">{dir}</span>
              </div>
              <p className="text-[#6B6158] text-xs leading-relaxed mb-4">{desc}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-1.5"><span className="text-green-500 flex-shrink-0">+</span><span className="text-[#6B6158]">{pros}</span></div>
                <div className="flex gap-1.5"><span className="text-red-400 flex-shrink-0">−</span><span className="text-[#6B6158]">{cons}</span></div>
                <div className="flex gap-1.5 pt-1.5 border-t border-[#E5DED5]"><span className="text-[#B8965A] flex-shrink-0">◎</span><span className="text-[#A89C91]">{use}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{light.qualityLabel}</p>
            <div className="space-y-4">
              {[light.hardLight, light.softLight].map(({ name, src, effect, scene }) => (
                <div key={name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-semibold text-[#1A1714]">{name}</span>
                    <span className="text-[#A89C91] text-xs">· {src}</span>
                  </div>
                  <p className="text-[#6B6158] text-sm leading-relaxed">{effect}</p>
                  <p className="text-[#B8965A] text-xs mt-1">{light.softLabel}{scene}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{light.bestTimeLabel}</p>
            <div className="space-y-4">
              {light.bestTimes.map(({ name, time, color, desc }) => (
                <div key={name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color }}>{name}</span>
                    <span className="text-[#A89C91] text-xs">{time}</span>
                  </div>
                  <p className="text-[#6B6158] text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{light.wbLabel}</p>
            <p className="text-[#6B6158] text-sm leading-relaxed mb-4">{light.wbIntro}</p>
            <div className="space-y-2 text-xs">
              {light.wbModes.map(({ label, desc }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-[#B8965A] flex-shrink-0">◈</span>
                  <span><span className="font-medium text-[#1A1714]">{label}：</span><span className="text-[#6B6158]">{desc}</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5DED5] rounded-2xl p-6">
            <p className="text-[#A89C91] text-xs tracking-[0.15em] uppercase mb-4">{light.flashLabel}</p>
            <div className="space-y-4 text-xs">
              {light.flashTechniques.map(({ name, desc }) => (
                <div key={name}>
                  <p className="font-medium text-[#1A1714] mb-0.5">{name}</p>
                  <p className="text-[#6B6158] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ⑤ Scenes */}
      <section id="scenes" className="scroll-mt-20">
        <SectionHeader index={scenes.index} title={scenes.title} sub={scenes.sub} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {scenes.scenes.map(({ scene, icon, bg, settings, tip }) => (
            <div key={scene} className="rounded-2xl p-6 border border-[#E5DED5]" style={{ backgroundColor: bg }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-display font-semibold text-[#1A1714]">{scene}</h3>
              </div>
              <div className="flex gap-3 mb-4">
                {settings.map(({ k, v }) => (
                  <div key={k} className="flex-1 bg-white/70 rounded-xl p-3">
                    <p className="text-[#A89C91] text-xs mb-1">{k}</p>
                    <p className="font-display font-semibold text-[#1A1714] text-sm">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#6B6158] text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ index, title, sub }) {
  return (
    <div className="flex items-end gap-5 mb-8">
      <span className="font-display text-5xl font-semibold text-[#E5DED5] leading-none">{index}</span>
      <div className="pb-1">
        <h2 className="font-display text-2xl font-semibold text-[#1A1714]">{title}</h2>
        <p className="text-[#A89C91] text-sm">{sub}</p>
      </div>
      <div className="flex-1 h-px bg-[#E5DED5] mb-2" />
    </div>
  )
}
