-- 在 Supabase SQL Editor 中执行此脚本，创建 accounts 表
-- 路径：Supabase 控制台 -> SQL Editor -> New query -> 粘贴并 Run

CREATE TABLE IF NOT EXISTS public.accounts (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  amount NUMERIC(10, 2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  item_description TEXT NOT NULL,
  account_date VARCHAR(10) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 允许匿名（anon）角色读写（小程序通过 anon key 访问）
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read and write accounts" ON public.accounts;
CREATE POLICY "Allow anon read and write accounts" ON public.accounts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
