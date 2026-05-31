import type { QuestionInput } from "./mappers.js";

export const TECHNICAL_EXPANSION_QUESTIONS: QuestionInput[] = [
  {
    id: "SQL_003",
    category: "sql",
    subcategory: "experiment_readout",
    title: "Experiment Readout From Assignment and Event Tables",
    difficulty: "hard",
    primaryWeaknessTag: "sql_rigor",
    timeboxMinutes: 25,
    schemaText:
      "experiment_assignments(user_id BIGINT, experiment_id STRING, variant STRING, assigned_at TIMESTAMP)\n" +
      "events(user_id BIGINT, event_ts TIMESTAMP, event_type STRING, revenue NUMERIC)\n" +
      "-- users can have duplicate assignment rows; events may occur before assignment; revenue is nullable",
    companyEmphasis: ["google", "airbnb", "stripe", "all"],
    tags: ["experiment-readout", "assignment", "guardrails", "joins", "data-quality"],
    targetSkills: ["experiment SQL", "metric definition", "dedupe", "time-window rigor"],
    prompt:
      "Write SQL to read out an experiment with control vs treatment. For each variant, compute assigned users, activated users within 7 days of assignment, activation rate, purchasers within 7 days, and revenue per assigned user. Handle duplicate assignment rows, events before assignment, nullable revenue, and users with no events.",
    expectedFramework: [
      "Dedupe assignments to one row per user per experiment",
      "Only count events after assignment and inside the analysis window",
      "Keep assigned users with no events in the denominator",
      "Use distinct user counts for user-level metrics",
      "Use COALESCE/NULLIF to make revenue and rates safe",
    ],
    sampleAnswerOutline: [
      "Create an assignment CTE with one assignment per user",
      "Left join events with post-assignment 7-day bounds",
      "Aggregate to user-level flags and revenue",
      "Group by variant and compute rates over assigned users",
    ],
    sampleStrongAnswer:
      "```sql\nWITH assignment AS (\n  SELECT user_id, experiment_id, variant, MIN(assigned_at) AS assigned_at\n  FROM experiment_assignments\n  WHERE experiment_id = 'exp_123'\n  GROUP BY user_id, experiment_id, variant\n),\nuser_metrics AS (\n  SELECT a.variant,\n         a.user_id,\n         MAX(CASE WHEN e.event_type = 'activate' THEN 1 ELSE 0 END) AS activated,\n         MAX(CASE WHEN e.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased,\n         SUM(CASE WHEN e.event_type = 'purchase' THEN COALESCE(e.revenue, 0) ELSE 0 END) AS revenue\n  FROM assignment a\n  LEFT JOIN events e\n    ON e.user_id = a.user_id\n   AND e.event_ts >= a.assigned_at\n   AND e.event_ts <  a.assigned_at + INTERVAL '7 days'\n  GROUP BY a.variant, a.user_id\n)\nSELECT variant,\n       COUNT(*) AS assigned_users,\n       SUM(activated) AS activated_users,\n       SUM(activated)::FLOAT / NULLIF(COUNT(*), 0) AS activation_rate,\n       SUM(purchased) AS purchaser_users,\n       SUM(revenue) / NULLIF(COUNT(*), 0) AS revenue_per_assigned_user\nFROM user_metrics\nGROUP BY variant\nORDER BY variant;\n```\n\nThe key is to aggregate at the assigned-user grain before computing rates. Duplicate assignments are collapsed, pre-assignment events are excluded, and the left join preserves users who never fired an event, so denominators are not inflated or silently filtered.",
    commonMistakes: [
      "Joining raw assignments to raw events and inflating both numerator and revenue",
      "Counting events before the user was assigned",
      "Using purchasers as the revenue denominator instead of assigned users",
      "Dropping users with no events through an inner join",
    ],
    scoringRubric: [
      { band: "0–1", description: "Raw joins or wrong denominator; result is not trustworthy." },
      { band: "2", description: "Rough metric query but misses assignment dedupe or time-window validity." },
      { band: "3", description: "Correct user-level aggregation, left join denominator, and post-assignment window." },
      { band: "4", description: "Above, plus clear handling of nullable revenue, duplicate assignment, and metric-grain explanation." },
    ],
    followUps: [
      "How would you add a guardrail metric like negative feedback rate?",
      "How would you detect sample ratio mismatch from these tables?",
      "How would you segment the readout by new vs existing users without breaking randomization?",
    ],
  },
  {
    id: "SQL_004",
    category: "sql",
    subcategory: "segmentation_breakdown",
    title: "DAU, WAU, and Stickiness by Platform",
    difficulty: "medium",
    primaryWeaknessTag: "metric_definition",
    timeboxMinutes: 20,
    schemaText:
      "events(user_id BIGINT, event_ts TIMESTAMP, platform STRING, event_type STRING)\n" +
      "-- multiple events per user/day; timestamps are UTC; platform can be null",
    companyEmphasis: ["meta", "tiktok", "linkedin", "all"],
    tags: ["active-users", "dau", "wau", "stickiness", "segmentation"],
    targetSkills: ["metric definition", "date grain", "dedupe", "segmentation"],
    prompt:
      "Compute daily DAU, trailing-7-day WAU, and DAU/WAU stickiness by platform for the last 30 days. Define active user as a user with at least one qualifying event that day. Handle duplicate events and null platform values.",
    expectedFramework: [
      "Define qualifying active events and normalize timestamps to dates",
      "Dedupe to user-day-platform before counting DAU",
      "Compute WAU as distinct users in the trailing 7-day window",
      "Bucket null platform explicitly",
      "Avoid averaging daily DAUs as a WAU proxy",
    ],
    sampleAnswerOutline: [
      "Build distinct activity rows at day/user/platform grain",
      "Aggregate DAU by day and platform",
      "Self-join activity into a 7-day trailing window for WAU",
      "Join DAU and WAU and compute DAU / WAU",
    ],
    sampleStrongAnswer:
      "```sql\nWITH activity AS (\n  SELECT DISTINCT\n         DATE(event_ts) AS active_date,\n         user_id,\n         COALESCE(platform, 'unknown') AS platform\n  FROM events\n  WHERE event_type IN ('open_app', 'view_content', 'search', 'message')\n    AND event_ts >= CURRENT_DATE - INTERVAL '36 days'\n),\ndau AS (\n  SELECT active_date, platform, COUNT(DISTINCT user_id) AS dau\n  FROM activity\n  WHERE active_date >= CURRENT_DATE - INTERVAL '30 days'\n  GROUP BY active_date, platform\n),\nwau AS (\n  SELECT d.active_date,\n         d.platform,\n         COUNT(DISTINCT a.user_id) AS wau\n  FROM (SELECT DISTINCT active_date, platform FROM dau) d\n  LEFT JOIN activity a\n    ON a.platform = d.platform\n   AND a.active_date BETWEEN d.active_date - INTERVAL '6 days' AND d.active_date\n  GROUP BY d.active_date, d.platform\n)\nSELECT d.active_date,\n       d.platform,\n       d.dau,\n       w.wau,\n       d.dau::FLOAT / NULLIF(w.wau, 0) AS stickiness\nFROM dau d\nJOIN wau w USING (active_date, platform)\nORDER BY d.active_date, d.platform;\n```",
    commonMistakes: [
      "Counting events instead of distinct active users",
      "Computing WAU as sum or average of DAU",
      "Forgetting to include six lookback days before the reporting window",
      "Dropping null platform rows without stating it",
    ],
    scoringRubric: [
      { band: "0–1", description: "Counts events or misdefines WAU." },
      { band: "2", description: "DAU is right but WAU window or platform edge cases are wrong." },
      { band: "3", description: "Correct distinct user-day logic and trailing-7-day WAU." },
      { band: "4", description: "Above, plus thoughtful event qualification, null handling, and lookback-window explanation." },
    ],
    followUps: [
      "What changes if product wants local timezone DAU?",
      "How would you compute MAU and DAU/MAU efficiently at scale?",
      "How would you investigate a sudden iOS stickiness drop?",
    ],
  },
  {
    id: "SQL_005",
    category: "sql",
    subcategory: "window_ranking",
    title: "Top Contributors by Weekly Revenue Share",
    difficulty: "medium",
    primaryWeaknessTag: "sql_rigor",
    timeboxMinutes: 20,
    schemaText:
      "orders(order_id BIGINT, seller_id BIGINT, buyer_id BIGINT, order_ts TIMESTAMP, revenue NUMERIC, status STRING)\n" +
      "-- orders can be refunded/cancelled; revenue can be null; ties are possible",
    companyEmphasis: ["airbnb", "uber", "doordash", "stripe", "all"],
    tags: ["window-functions", "ranking", "revenue", "marketplace", "ties"],
    targetSkills: ["window functions", "ranking semantics", "metric rigor", "edge cases"],
    prompt:
      "For each week, find the top 5 sellers by completed revenue and compute each seller's share of that week's completed revenue. Include rank, revenue, total weekly revenue, and share. Explain how you handle ties, null revenue, cancelled/refunded orders, and weeks with no completed revenue.",
    expectedFramework: [
      "Filter to completed revenue only",
      "Aggregate seller revenue at week/seller grain",
      "Use a window sum for weekly total revenue",
      "Use an explicit ranking function and explain ties",
      "Guard division by zero",
    ],
    sampleAnswerOutline: [
      "CTE: weekly seller revenue from completed orders",
      "CTE: add weekly total and rank with DENSE_RANK or ROW_NUMBER",
      "Filter rank <= 5 and compute share",
      "Explain tie behavior based on business need",
    ],
    sampleStrongAnswer:
      "```sql\nWITH seller_week AS (\n  SELECT DATE_TRUNC('week', order_ts) AS week,\n         seller_id,\n         SUM(COALESCE(revenue, 0)) AS seller_revenue\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY 1, 2\n),\nranked AS (\n  SELECT week,\n         seller_id,\n         seller_revenue,\n         SUM(seller_revenue) OVER (PARTITION BY week) AS weekly_revenue,\n         DENSE_RANK() OVER (PARTITION BY week ORDER BY seller_revenue DESC) AS revenue_rank\n  FROM seller_week\n)\nSELECT week,\n       seller_id,\n       revenue_rank,\n       seller_revenue,\n       weekly_revenue,\n       seller_revenue / NULLIF(weekly_revenue, 0) AS revenue_share\nFROM ranked\nWHERE revenue_rank <= 5\nORDER BY week, revenue_rank, seller_id;\n```\n\nI used `DENSE_RANK`, so ties at rank 5 can return more than five sellers. If the product literally needs exactly five rows, I would use `ROW_NUMBER` with a deterministic tie-breaker. Cancelled and refunded orders are excluded by status, and null revenue is treated as zero for completed orders.",
    commonMistakes: [
      "Ranking raw orders instead of seller-week aggregates",
      "Not saying whether rank ties can return more than five rows",
      "Including cancelled/refunded orders",
      "Computing share against top-5 revenue instead of total weekly revenue",
    ],
    scoringRubric: [
      { band: "0–1", description: "Wrong grain or no window function; share is incorrect." },
      { band: "2", description: "Mostly right ranking but misses ties or weekly denominator." },
      { band: "3", description: "Correct seller-week aggregate, weekly total, rank, and share." },
      { band: "4", description: "Above, plus explicit tie semantics and revenue-status edge cases." },
    ],
    followUps: [
      "How would you compute concentration: top-5 share of weekly revenue?",
      "What if refunds arrive in a later week?",
      "How would you rank by revenue growth instead of absolute revenue?",
    ],
  },
  {
    id: "SQL_006",
    category: "sql",
    subcategory: "root_cause_anomaly",
    title: "Diagnose an Activation Drop Across Segments",
    difficulty: "hard",
    primaryWeaknessTag: "data_cleaning",
    timeboxMinutes: 25,
    schemaText:
      "users(user_id BIGINT, signup_ts TIMESTAMP, country STRING, platform STRING, acquisition_channel STRING)\n" +
      "events(user_id BIGINT, event_ts TIMESTAMP, event_type STRING)\n" +
      "-- activation = first 'complete_onboarding' event within 24h of signup; duplicate events exist",
    companyEmphasis: ["google", "meta", "tiktok", "airbnb", "all"],
    tags: ["root-cause", "activation", "segmentation", "cohort", "data-quality"],
    targetSkills: ["diagnostic SQL", "segmentation", "metric decomposition", "activation definition"],
    prompt:
      "Activation rate dropped last week. Write SQL to compute activation rate by signup week, country, platform, and acquisition_channel, where activation means completing onboarding within 24 hours of signup. Then explain how you would identify which segment contributed most to the overall drop.",
    expectedFramework: [
      "Build user-level activation flags with a 24-hour post-signup window",
      "Aggregate by cohort week and segment",
      "Compare current week to prior week",
      "Compute contribution to total drop using segment denominator and rate change",
      "Separate mix shift from within-segment rate decline",
    ],
    sampleAnswerOutline: [
      "User CTE with signup week and normalized segment fields",
      "Left join/dedup activation events inside 24h",
      "Segment rates by week",
      "Join current and previous week and compute contribution",
    ],
    sampleStrongAnswer:
      "```sql\nWITH user_flags AS (\n  SELECT u.user_id,\n         DATE_TRUNC('week', u.signup_ts) AS signup_week,\n         COALESCE(u.country, 'unknown') AS country,\n         COALESCE(u.platform, 'unknown') AS platform,\n         COALESCE(u.acquisition_channel, 'unknown') AS acquisition_channel,\n         MAX(CASE WHEN e.event_type = 'complete_onboarding' THEN 1 ELSE 0 END) AS activated\n  FROM users u\n  LEFT JOIN events e\n    ON e.user_id = u.user_id\n   AND e.event_ts >= u.signup_ts\n   AND e.event_ts <  u.signup_ts + INTERVAL '24 hours'\n  GROUP BY 1,2,3,4,5\n),\nsegment_rates AS (\n  SELECT signup_week, country, platform, acquisition_channel,\n         COUNT(*) AS signups,\n         SUM(activated) AS activated_users,\n         SUM(activated)::FLOAT / NULLIF(COUNT(*), 0) AS activation_rate\n  FROM user_flags\n  GROUP BY 1,2,3,4\n),\ncomparison AS (\n  SELECT cur.country, cur.platform, cur.acquisition_channel,\n         cur.signups AS cur_signups,\n         prev.signups AS prev_signups,\n         cur.activation_rate AS cur_rate,\n         prev.activation_rate AS prev_rate,\n         (cur.activation_rate - prev.activation_rate) * cur.signups AS contribution_to_activated_delta\n  FROM segment_rates cur\n  JOIN segment_rates prev\n    ON cur.country = prev.country\n   AND cur.platform = prev.platform\n   AND cur.acquisition_channel = prev.acquisition_channel\n   AND cur.signup_week = prev.signup_week + INTERVAL '1 week'\n  WHERE cur.signup_week = DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'\n)\nSELECT *\nFROM comparison\nORDER BY contribution_to_activated_delta ASC;\n```\n\nThe first output tells me where the rate moved; the contribution calculation helps prioritize by impact, not just the largest percentage decline. I would also compare segment mix because the overall drop could come from more users entering a low-activation segment even if segment-level rates are stable.",
    commonMistakes: [
      "Looking only at percentage drops and ignoring segment size",
      "Using event week instead of signup cohort week",
      "Counting onboarding events after the 24-hour window",
      "Dropping non-activated users with an inner join",
    ],
    scoringRubric: [
      { band: "0–1", description: "No user-level activation flag or wrong denominator." },
      { band: "2", description: "Computes rates but not a useful contribution diagnosis." },
      { band: "3", description: "Correct segmented activation rates and week-over-week comparison." },
      { band: "4", description: "Above, plus contribution sizing and mix-shift vs rate-change reasoning." },
    ],
    followUps: [
      "How would you tell whether this is an instrumentation issue?",
      "How would you decompose mix shift vs within-segment rate changes more formally?",
      "What dashboard would you build to catch this earlier next time?",
    ],
  },
  {
    id: "PY_003",
    category: "python_coding",
    subcategory: "pandas_manipulation",
    title: "Clean Funnel Metrics in pandas",
    difficulty: "medium",
    primaryWeaknessTag: "python_coding",
    timeboxMinutes: 20,
    schemaText:
      "events: DataFrame[user_id, event_ts, step]\n" +
      "step in {'view', 'add_to_cart', 'checkout', 'purchase'}; rows can be duplicated and out of order",
    companyEmphasis: ["airbnb", "stripe", "google", "all"],
    tags: ["pandas", "funnel", "dedupe", "ordering", "data-quality"],
    targetSkills: ["pandas fluency", "ordered funnel logic", "dedupe", "function design"],
    prompt:
      "Write a pandas function `ordered_funnel(events)` that returns user counts at each ordered funnel step: view -> add_to_cart -> checkout -> purchase. Count each user once per step, and only count a step if the prior step happened before it.",
    expectedFramework: [
      "Convert timestamps and reduce to first timestamp per user/step",
      "Pivot to one row per user",
      "Apply cumulative ordered conditions",
      "Return counts and step-to-step conversion rates",
    ],
    sampleAnswerOutline: [
      "groupby(['user_id','step']).event_ts.min()",
      "pivot to columns for each funnel step",
      "build boolean masks for ordered completion",
      "divide each count by the previous count with zero guards",
    ],
    sampleStrongAnswer:
      "```python\nimport pandas as pd\n\ndef ordered_funnel(events: pd.DataFrame) -> pd.DataFrame:\n    steps = ['view', 'add_to_cart', 'checkout', 'purchase']\n    e = events[events['step'].isin(steps)].copy()\n    e['event_ts'] = pd.to_datetime(e['event_ts'])\n    first = e.groupby(['user_id', 'step'], as_index=False)['event_ts'].min()\n    wide = first.pivot(index='user_id', columns='step', values='event_ts')\n\n    reached = {\n        'view': wide['view'].notna(),\n        'add_to_cart': wide['add_to_cart'].gt(wide['view']),\n        'checkout': wide['checkout'].gt(wide['add_to_cart']) & wide['add_to_cart'].gt(wide['view']),\n        'purchase': wide['purchase'].gt(wide['checkout']) & wide['checkout'].gt(wide['add_to_cart']) & wide['add_to_cart'].gt(wide['view']),\n    }\n    counts = pd.Series({step: int(mask.sum()) for step, mask in reached.items()}, name='users')\n    out = counts.reset_index().rename(columns={'index': 'step'})\n    out['prev_users'] = out['users'].shift(1)\n    out['step_conversion'] = out['users'] / out['prev_users']\n    out.loc[out['step'].eq('view'), 'step_conversion'] = 1.0\n    return out\n```",
    commonMistakes: [
      "Counting event rows instead of users",
      "Ignoring order and counting purchase without checkout",
      "Using loops over users instead of vectorized groupby/pivot logic",
      "Forgetting duplicate events",
    ],
    scoringRubric: [
      { band: "0–1", description: "Incorrect counts or raw event counting." },
      { band: "2", description: "Dedupe is attempted but ordering or conversion rates are wrong." },
      { band: "3", description: "Correct first-step timestamps, ordered masks, and counts." },
      { band: "4", description: "Above, plus clean reusable function and clear edge-case explanation." },
    ],
    followUps: [
      "How would you support multiple sessions per user?",
      "How would you require each step within 24 hours of the previous one?",
      "How would you unit-test out-of-order and duplicate events?",
    ],
  },
  {
    id: "PY_004",
    category: "python_coding",
    subcategory: "stat_simulation",
    title: "Bootstrap a Confidence Interval for Metric Lift",
    difficulty: "hard",
    primaryWeaknessTag: "statistical_simulation",
    timeboxMinutes: 20,
    schemaText:
      "df: DataFrame[user_id, variant, metric]\n" +
      "variant in {'control','treatment'}; one row per user; metric is continuous and can be skewed",
    companyEmphasis: ["google", "netflix", "stripe", "all"],
    tags: ["bootstrap", "confidence-interval", "numpy", "experiment", "skewed-metric"],
    targetSkills: ["bootstrap reasoning", "numpy/pandas fluency", "uncertainty communication"],
    prompt:
      "Write a function `bootstrap_lift_ci(df, metric_col, n_boot=10000)` that estimates treatment-control mean lift and a 95% bootstrap confidence interval. Explain when bootstrap is useful and what assumptions it still relies on.",
    expectedFramework: [
      "Separate control and treatment samples at the user grain",
      "Resample users with replacement within each arm",
      "Compute treatment mean minus control mean for each bootstrap draw",
      "Use percentiles for the confidence interval",
      "Explain independence and user-level grain assumptions",
    ],
    sampleAnswerOutline: [
      "Use numpy random generator and arrays for speed",
      "Draw bootstrap indices for each arm",
      "Vectorize mean differences over bootstraps",
      "Return observed lift and percentile CI",
    ],
    sampleStrongAnswer:
      "```python\nimport numpy as np\n\ndef bootstrap_lift_ci(df, metric_col, n_boot=10000, alpha=0.05, seed=0):\n    rng = np.random.default_rng(seed)\n    control = df.loc[df['variant'].eq('control'), metric_col].dropna().to_numpy()\n    treatment = df.loc[df['variant'].eq('treatment'), metric_col].dropna().to_numpy()\n    obs_lift = treatment.mean() - control.mean()\n\n    c_idx = rng.integers(0, len(control), size=(n_boot, len(control)))\n    t_idx = rng.integers(0, len(treatment), size=(n_boot, len(treatment)))\n    boot_lifts = treatment[t_idx].mean(axis=1) - control[c_idx].mean(axis=1)\n    lo, hi = np.quantile(boot_lifts, [alpha / 2, 1 - alpha / 2])\n    return {'lift': obs_lift, 'ci_low': lo, 'ci_high': hi}\n```\n\nBootstrap is useful when the metric is skewed or the analytic standard error is awkward, but it is not magic: the rows need to be the right independent unit, usually users. If there is clustering or repeated observations per user, I would resample at the cluster/user level rather than individual rows.",
    commonMistakes: [
      "Resampling rows when rows are not independent users",
      "Bootstrapping treatment and control together instead of within arm",
      "Reporting only the observed lift with no uncertainty",
      "Ignoring missing values or tiny arm sizes",
    ],
    scoringRubric: [
      { band: "0–1", description: "Wrong resampling unit or no valid CI." },
      { band: "2", description: "Basic bootstrap works but assumptions or arm separation are unclear." },
      { band: "3", description: "Correct within-arm bootstrap and percentile CI." },
      { band: "4", description: "Above, plus clean vectorization and a strong explanation of independence/grain assumptions." },
    ],
    followUps: [
      "How would you bootstrap a ratio metric?",
      "How would you handle repeated observations per user?",
      "How would you decide whether the CI is stable enough?",
    ],
  },
  {
    id: "PY_005",
    category: "python_coding",
    subcategory: "log_processing",
    title: "Sessionize Raw Event Logs",
    difficulty: "medium",
    primaryWeaknessTag: "data_cleaning",
    timeboxMinutes: 20,
    schemaText:
      "events: DataFrame[user_id, event_ts, event_type]\n" +
      "Rows may be duplicated and out of order. A new session starts after 30 minutes of inactivity.",
    companyEmphasis: ["meta", "tiktok", "airbnb", "all"],
    tags: ["sessionization", "pandas", "event-logs", "dedupe", "time-series"],
    targetSkills: ["log processing", "pandas sorting", "groupby transform", "edge cases"],
    prompt:
      "Write a pandas function `sessionize(events)` that assigns a `session_id` to each event. A new session starts for a user's first event or when the gap since their previous event is more than 30 minutes. Handle duplicates and out-of-order rows.",
    expectedFramework: [
      "Parse timestamps and dedupe exact duplicate event rows",
      "Sort by user and timestamp before computing gaps",
      "Use groupby diff to compute inactivity gaps",
      "Cumulative sum new-session flags within each user",
      "Return a stable session_id",
    ],
    sampleAnswerOutline: [
      "drop_duplicates on user_id/event_ts/event_type",
      "sort_values by user_id and event_ts",
      "gap = groupby(user_id).event_ts.diff()",
      "new_session = first event or gap > 30 minutes",
      "session_num = groupby(user_id).new_session.cumsum()",
    ],
    sampleStrongAnswer:
      "```python\nimport pandas as pd\n\ndef sessionize(events: pd.DataFrame, timeout='30min') -> pd.DataFrame:\n    e = events.copy()\n    e['event_ts'] = pd.to_datetime(e['event_ts'])\n    e = e.drop_duplicates(subset=['user_id', 'event_ts', 'event_type'])\n    e = e.sort_values(['user_id', 'event_ts', 'event_type']).reset_index(drop=True)\n\n    gap = e.groupby('user_id')['event_ts'].diff()\n    new_session = gap.isna() | gap.gt(pd.Timedelta(timeout))\n    e['session_num'] = new_session.groupby(e['user_id']).cumsum().astype(int)\n    e['session_id'] = e['user_id'].astype(str) + '_' + e['session_num'].astype(str)\n    return e\n```",
    commonMistakes: [
      "Computing time gaps before sorting events",
      "Using a global diff across users",
      "Treating duplicate events as new activity",
      "Using >= 30 minutes without clarifying the boundary",
    ],
    scoringRubric: [
      { band: "0–1", description: "Sessions are wrong because sorting or grouping is missing." },
      { band: "2", description: "Basic sessionization but misses duplicates or user boundaries." },
      { band: "3", description: "Correct sort, groupby diff, timeout, and cumulative session numbering." },
      { band: "4", description: "Above, plus stable IDs, boundary clarification, and testable edge cases." },
    ],
    followUps: [
      "How would you compute session duration after this?",
      "How would you handle events with identical timestamps but different event types?",
      "What changes if session timeout differs by product surface?",
    ],
  },
];
