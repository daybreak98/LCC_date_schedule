-- ============================================================================
-- 日程管理系统 - Supabase Auth + RLS 权限迁移
-- 在 Supabase SQL Editor 中按顺序逐段执行
-- ============================================================================

-- 1. 补齐前端已使用但旧部署 SQL 可能缺失的字段
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';

-- 2. 添加用户归属字段
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. 添加更新时间字段
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. 为新数据设置默认归属为当前登录用户（INSERT 时自动填入）
ALTER TABLE public.events
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================================================
-- 5. 旧数据回填（必须！）
--    先去 Supabase → Authentication → Users 复制你的 User ID
--    把下面 <YOUR_USER_ID> 替换成实际 UUID，然后执行
-- ============================================================================
-- UPDATE public.events
-- SET user_id = '<YOUR_USER_ID>'
-- WHERE user_id IS NULL;

-- ============================================================================
-- 6. 确认旧数据已回填后，执行下面这行（可选，推荐）
-- ============================================================================
-- ALTER TABLE public.events
-- ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- 7. 开启 RLS
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. 清理旧策略（避免重复执行报错）
-- ============================================================================
DROP POLICY IF EXISTS "events_select_own" ON public.events;
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
DROP POLICY IF EXISTS "events_update_own" ON public.events;
DROP POLICY IF EXISTS "events_delete_own" ON public.events;

-- ============================================================================
-- 9-12. RLS 策略：用户只能读写自己的日程
-- ============================================================================

-- 只允许登录用户查看自己的日程
CREATE POLICY "events_select_own"
ON public.events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 只允许登录用户创建属于自己的日程
CREATE POLICY "events_insert_own"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 只允许登录用户更新自己的日程
CREATE POLICY "events_update_own"
ON public.events
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 只允许登录用户删除自己的日程
CREATE POLICY "events_delete_own"
ON public.events
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 13. 组合索引，加速用户+日期查询
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_events_user_date
ON public.events(user_id, event_date);

-- ============================================================================
-- 执行完毕后验证：
--   1. Table Editor → events 表 → 右上角显示 RLS enabled
--   2. 所有策略在 Authentication → Policies 中可见
-- ============================================================================
