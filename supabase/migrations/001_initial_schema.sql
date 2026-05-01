-- mimo-lifepilot Database Schema
-- Run this in Supabase SQL Editor

-- 示例表结构，根据项目需求调整
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 基础策略
CREATE POLICY "Allow all for demo" ON records FOR ALL USING (true);
