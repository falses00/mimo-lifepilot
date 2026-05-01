import { FastifyInstance } from 'fastify';

interface ParseEntryRequest {
  text: string;
}

interface LifeItem {
  title: string;
  category: string;
  status: 'done' | 'todo' | 'reminder' | 'habit' | 'bill' | 'project';
  confidence: number;
  dueText?: string;
  priority?: 'high' | 'medium' | 'low';
  habit?: string;
  value?: string;
  amount?: number;
}

interface ParseEntryResult {
  done: LifeItem[];
  todos: LifeItem[];
  reminders: LifeItem[];
  habits: LifeItem[];
  bills: LifeItem[];
  projects: LifeItem[];
  suggestions: string[];
  meta: {
    mode: string;
    durationMs: number;
  };
}

// 关键词配置
const DONE_KEYWORDS = ['完成了', '写完了', '做完了', '跑了', '学了', '看完了', '交了', '处理了', '已经', '搞定', '完成', '结束'];
const TODO_KEYWORDS = ['要', '需要', '计划', '准备', '记得', '明天', '后天', '周五前', '下周', '之前', '必须', '应该'];
const HABIT_KEYWORDS = ['跑步', '健身', '阅读', '学习', '冥想', '睡觉', '喝水', '运动', '散步', '游泳'];
const BILL_KEYWORDS = ['交了', '支付', '花了', '买了', '续费', '房租', '服务器', '订阅', '消费', '支出'];
const PROJECT_KEYWORDS = ['项目', '部署', 'README', '测试', '前端', '后端', '面试', 'GitHub', '代码', '开发'];

// 日期词解析
function parseDueText(text: string): string | undefined {
  if (text.includes('明天')) return '明天';
  if (text.includes('后天')) return '后天';
  if (text.includes('周五')) return '周五';
  if (text.includes('下周')) return '下周';
  if (text.includes('今天')) return '今天';
  if (text.includes('今晚')) return '今晚';
  return undefined;
}

// 优先级推断
function inferPriority(text: string): 'high' | 'medium' | 'low' {
  if (text.includes('面试') || text.includes('紧急') || text.includes('重要')) return 'high';
  if (text.includes('项目') || text.includes('部署')) return 'high';
  if (text.includes('学习') || text.includes('阅读')) return 'medium';
  return 'low';
}

// 分类推断
function inferCategory(text: string): string {
  if (text.includes('博客') || text.includes('写') || text.includes('文章')) return '创作';
  if (text.includes('跑步') || text.includes('健身') || text.includes('运动')) return '健康';
  if (text.includes('简历') || text.includes('面试') || text.includes('求职')) return '求职';
  if (text.includes('项目') || text.includes('代码') || text.includes('开发')) return '项目';
  if (text.includes('阅读') || text.includes('学习') || text.includes('课程')) return '学习';
  if (text.includes('房租') || text.includes('服务器') || text.includes('订阅')) return '账单';
  return '其他';
}

// 解析一句话
function parseEntry(text: string): ParseEntryResult {
  const startTime = Date.now();
  const done: LifeItem[] = [];
  const todos: LifeItem[] = [];
  const reminders: LifeItem[] = [];
  const habits: LifeItem[] = [];
  const bills: LifeItem[] = [];
  const projects: LifeItem[] = [];
  const suggestions: string[] = [];

  // 按逗号、句号、分号分割
  const segments = text.split(/[,，。；;、\n]+/).filter(s => s.trim());

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // 检查是否是账单（优先检查，因为账单可能同时包含其他关键词）
    const isBill = BILL_KEYWORDS.some(kw => trimmed.includes(kw)) || /\d+\s*(元|块|¥)/.test(trimmed);
    if (isBill) {
      const item: LifeItem = {
        title: trimmed,
        category: '账单',
        status: 'bill',
        confidence: 0.85,
      };
      const amountMatch = trimmed.match(/(\d+)\s*(元|块|¥)/);
      if (amountMatch) {
        item.amount = parseInt(amountMatch[1]);
      }
      bills.push(item);
      
      // 如果也包含完成关键词，也加入完成列表
      const isDone = DONE_KEYWORDS.some(kw => trimmed.includes(kw));
      if (isDone) {
        done.push({ ...item, status: 'done' });
      }
      continue;
    }

    // 检查是否是习惯（优先检查，因为习惯可能同时包含完成关键词）
    const isHabit = HABIT_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isHabit && DONE_KEYWORDS.some(kw => trimmed.includes(kw))) {
      const item: LifeItem = {
        title: trimmed,
        category: '健康',
        status: 'habit',
        confidence: 0.9,
        habit: HABIT_KEYWORDS.find(kw => trimmed.includes(kw)),
      };
      const valueMatch = trimmed.match(/(\d+)\s*(公里|分钟|小时|页|次|个)/);
      if (valueMatch) {
        item.value = `${valueMatch[1]}${valueMatch[2]}`;
      }
      habits.push(item);
      done.push({ ...item, status: 'done' });
      continue;
    }

    // 检查已完成
    const isDone = DONE_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isDone) {
      const item: LifeItem = {
        title: trimmed,
        category: inferCategory(trimmed),
        status: 'done',
        confidence: 0.9,
      };
      done.push(item);
      continue;
    }

    // 检查待办
    const isTodo = TODO_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isTodo) {
      const item: LifeItem = {
        title: trimmed,
        category: inferCategory(trimmed),
        status: 'todo',
        confidence: 0.85,
        dueText: parseDueText(trimmed),
        priority: inferPriority(trimmed),
      };

      // 检查是否是项目相关
      const isProject = PROJECT_KEYWORDS.some(kw => trimmed.includes(kw));
      if (isProject) {
        item.status = 'project';
        projects.push(item);
      }

      todos.push(item);
      continue;
    }

    // 检查习惯（不包含完成关键词的习惯）
    if (isHabit) {
      const item: LifeItem = {
        title: trimmed,
        category: '健康',
        status: 'habit',
        confidence: 0.8,
        habit: HABIT_KEYWORDS.find(kw => trimmed.includes(kw)),
      };
      const valueMatch = trimmed.match(/(\d+)\s*(公里|分钟|小时|页|次|个)/);
      if (valueMatch) {
        item.value = `${valueMatch[1]}${valueMatch[2]}`;
      }
      habits.push(item);
      continue;
    }

    // 默认归类为待办
    todos.push({
      title: trimmed,
      category: inferCategory(trimmed),
      status: 'todo',
      confidence: 0.6,
      priority: 'medium',
    });
  }

  // 生成建议
  if (todos.length > 0) {
    suggestions.push(`建议今天先完成 ${todos[0].title}`);
  }
  if (habits.length > 0) {
    suggestions.push('坚持记录习惯，有助于养成好习惯');
  }
  if (bills.length > 0) {
    const total = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
    if (total > 0) {
      suggestions.push(`今日支出 ${total} 元，注意控制预算`);
    }
  }

  return {
    done,
    todos,
    reminders,
    habits,
    bills,
    projects,
    suggestions,
    meta: {
      mode: 'local-rules',
      durationMs: Date.now() - startTime,
    },
  };
}

// 内存存储（demo）
const memoryStore: Map<string, any> = new Map();

export async function lifepilotRoutes(fastify: FastifyInstance) {
  // 解析一句话
  fastify.post<{ Body: ParseEntryRequest }>('/parse-entry', async (request, reply) => {
    const { text } = request.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return reply.status(400).send({ error: '请输入内容' });
    }

    if (text.length > 1000) {
      return reply.status(400).send({ error: '输入内容过长，最多 1000 字' });
    }

    const result = parseEntry(text.trim());
    return result;
  });

  // 保存计划
  fastify.post('/save-plan', async (request, reply) => {
    const { entryText, items } = request.body as any;

    if (!entryText || !items) {
      return reply.status(400).send({ error: '缺少必要参数' });
    }

    const id = `entry_${Date.now()}`;
    memoryStore.set(id, {
      id,
      entryText,
      items,
      createdAt: new Date().toISOString(),
    });

    return {
      saved: true,
      id,
      items,
      meta: {
        mode: 'memory-demo',
        durationMs: 0,
      },
    };
  });

  // 获取今日记录
  fastify.get('/today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = Array.from(memoryStore.values()).filter(
      (entry: any) => entry.createdAt?.startsWith(today)
    );

    const allItems = todayEntries.flatMap((entry: any) => entry.items || []);
    const done = allItems.filter((item: any) => item.status === 'done');
    const todos = allItems.filter((item: any) => item.status === 'todo');

    return {
      done,
      todos,
      timeline: todayEntries.map((entry: any) => ({
        time: entry.createdAt,
        text: entry.entryText,
      })),
      summary: {
        totalDone: done.length,
        totalTodos: todos.length,
      },
      meta: {
        mode: 'memory-demo',
        durationMs: 0,
      },
    };
  });
}
