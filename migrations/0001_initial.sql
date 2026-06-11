PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh',
  units TEXT NOT NULL DEFAULT 'metric',
  age INTEGER,
  height_cm REAL,
  weight_kg REAL,
  goal_weight_kg REAL,
  body_fat REAL,
  goal TEXT NOT NULL DEFAULT 'fat',
  training_days INTEGER NOT NULL DEFAULT 4,
  workout_duration INTEGER NOT NULL DEFAULT 45,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS user_equipment (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  equipment_key TEXT,
  load_type TEXT NOT NULL DEFAULT 'selectorized',
  unit TEXT NOT NULL DEFAULT 'kg',
  increment_value REAL NOT NULL DEFAULT 5,
  is_custom INTEGER NOT NULL DEFAULT 0,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON user_equipment(user_id);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT,
  equipment_key TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  movement_type TEXT NOT NULL,
  poster_url TEXT,
  video_url TEXT,
  animation_type TEXT NOT NULL DEFAULT 'press',
  instructions_zh TEXT NOT NULL,
  instructions_en TEXT NOT NULL,
  mistakes_zh TEXT NOT NULL,
  mistakes_en TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment_key);

CREATE TABLE IF NOT EXISTS training_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);

CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES training_plans(id) ON DELETE SET NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  exercises_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, started_at);

CREATE TABLE IF NOT EXISTS food_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  eaten_at TEXT NOT NULL,
  meal_name_zh TEXT,
  meal_name_en TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  ingredients_json TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, eaten_at);

INSERT OR IGNORE INTO exercises VALUES
('db-row','单臂哑铃划船','One-arm Dumbbell Row','back','biceps,rear-delts','dumbbell','beginner','pull','assets/ex-row.jpg',NULL,'row','支撑身体并保持脊柱中立|肘部贴近躯干向髋部拉|顶部停顿后控制下放','Brace with a neutral spine|Drive the elbow toward the hip|Pause, then lower under control','躯干旋转|耸肩|借力甩动','Rotating the torso|Shrugging|Using momentum',1),
('lat-pulldown','高位下拉','Lat Pulldown','back','biceps','cable','beginner','pull','assets/ex-pulldown.jpg',NULL,'pulldown','锁定大腿垫并微微后倾|先下沉肩胛再拉向上胸|缓慢回到手臂伸展','Lock the thigh pad and lean slightly|Depress the shoulder blades first|Return slowly to full reach','拉到颈后|身体后仰过多|配重片撞击','Pulling behind the neck|Excessive lean|Slamming the stack',1),
('seated-row','坐姿划船','Seated Cable Row','back','biceps','cable','beginner','pull','assets/ex-seated-row.jpg',NULL,'row','胸口抬起并保持核心稳定|把手拉向腹部|肩胛后收后控制前伸','Keep the chest tall|Pull the handle to the abdomen|Control the forward reach','含胸|后仰借力|肘部过度外展','Rounding the back|Leaning back|Flaring the elbows',1),
('rear-delt-fly','俯身飞鸟','Bent-over Rear Delt Fly','shoulders','upper-back','dumbbell','intermediate','isolation','assets/ex-rear-delt.jpg',NULL,'fly','髋部折叠并保持背部平直|手肘微屈向两侧展开|肩胛稳定，不耸肩','Hinge with a flat back|Raise with soft elbows|Keep shoulders down','重量过大|身体摆动|手臂抬得过高','Too much weight|Body swing|Raising too high',1),
('plank','平板支撑','Plank','core','shoulders','bodyweight','beginner','stability','assets/ex-plank.jpg',NULL,'plank','肘部位于肩下|收紧臀部和腹部|头到脚保持直线','Place elbows under shoulders|Brace glutes and abs|Keep a straight line','塌腰|抬臀过高|憋气','Sagging hips|Hips too high|Holding breath',1),
('barbell-bench','杠铃卧推','Barbell Bench Press','chest','triceps,shoulders','barbell','intermediate','push','assets/plan-push.jpg',NULL,'press','肩胛后收并固定|杠铃下降到下胸位置|双脚踩稳后向上推起','Retract and set the shoulder blades|Lower to the lower chest|Drive up with feet planted','手腕后折|肘部完全外展|臀部离开凳面','Bent wrists|Elbows fully flared|Hips leaving the bench',1),
('incline-db-press','上斜哑铃卧推','Incline Dumbbell Press','chest','shoulders,triceps','dumbbell','beginner','push','assets/plan-push.jpg',NULL,'press','凳面调整到约30度|哑铃位于上胸两侧|沿略向内的轨迹推起','Set the bench near 30 degrees|Start beside the upper chest|Press slightly inward','角度过高|肩部前顶|哑铃碰撞','Bench too steep|Shoulders rolling forward|Clashing dumbbells',1),
('goblet-squat','高脚杯深蹲','Goblet Squat','legs','glutes,core','dumbbell','beginner','squat','assets/plan-legs.jpg',NULL,'squat','重物贴近胸口|膝盖沿脚尖方向移动|保持全脚掌受力','Hold the load close to the chest|Track knees over toes|Keep the whole foot planted','膝盖内扣|脚跟抬起|腰部弯曲','Knees collapsing|Heels lifting|Rounding the back',1),
('smith-squat','史密斯深蹲','Smith Machine Squat','legs','glutes','smith-machine','beginner','squat','assets/plan-legs.jpg',NULL,'squat','设置安全限位|双脚略放在杠铃前方|旋转解锁后控制下蹲','Set the safety stops|Place feet slightly forward|Unlock and descend under control','未设限位|膝盖内扣|杠铃未挂回','No safety stops|Knees collapsing|Bar not re-racked',1),
('cable-face-pull','绳索面拉','Cable Face Pull','shoulders','rear-delts,upper-back','cable','beginner','pull','assets/ex-seated-row.jpg',NULL,'facepull','滑轮调至面部高度|绳索拉向眉毛两侧|肘部保持抬起并外旋','Set the cable at face height|Pull toward the eyebrows|Keep elbows high and rotate out','腰部后仰|耸肩|重量过大','Leaning back|Shrugging|Too much weight',1),
('treadmill-walk','跑步机坡度快走','Incline Treadmill Walk','cardio','legs','treadmill','beginner','cardio','assets/plan-cardio.jpg',NULL,'treadmill','从低速低坡度开始|保持直立并自然摆臂|逐步提高坡度而非扶住把手','Start slow and low|Stay tall with natural arm swing|Raise incline without holding rails','长时间扶把|步幅过大|突然停止','Holding rails|Overstriding|Stopping suddenly',1),
('kettlebell-swing','壶铃摆动','Kettlebell Swing','glutes','hamstrings,core','kettlebell','intermediate','hinge','assets/plan-core.jpg',NULL,'swing','髋部向后折叠|用臀部爆发伸髋|手臂只负责连接壶铃','Hinge at the hips|Snap the hips forward|Let the arms guide the bell','蹲得过深|用肩抬壶铃|腰椎过伸','Squatting too deep|Lifting with shoulders|Overextending the back',1);
