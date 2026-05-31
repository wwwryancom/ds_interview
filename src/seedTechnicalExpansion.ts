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
  {
    id: "SQL_007",
    category: "sql",
    subcategory: "data_quality",
    title: "Detect Sample Ratio Mismatch in an Experiment",
    difficulty: "medium",
    primaryWeaknessTag: "data_cleaning",
    timeboxMinutes: 20,
    schemaText:
      "experiment_assignments(user_id BIGINT, experiment_id STRING, variant STRING, assigned_at TIMESTAMP)\n" +
      "expected_allocations(experiment_id STRING, variant STRING, expected_share FLOAT)\n" +
      "-- assignment logs may contain duplicate rows per user; expected shares sum to 1 per experiment",
    companyEmphasis: ["google", "meta", "stripe", "all"],
    tags: ["srm", "experiment-diagnostics", "data-quality", "chi-square"],
    targetSkills: ["experiment diagnostics", "dedupe", "observed-vs-expected", "statistical rigor"],
    prompt:
      "Write SQL to compute observed assignment counts by variant for an experiment, compare them to expected allocation shares, and flag possible sample ratio mismatch. Explain what you can and cannot conclude from SQL alone.",
    expectedFramework: [
      "Dedupe assignments to one row per user and variant decision",
      "Compute total assigned users and observed counts by variant",
      "Join expected allocation shares and compute expected counts",
      "Return observed vs expected deltas and chi-square contributions",
      "Explain that SQL surfaces the diagnostic; significance threshold may be applied outside SQL",
    ],
    sampleAnswerOutline: [
      "Clean assignment table at user grain",
      "Aggregate observed users by variant",
      "Expected count = total users * expected_share",
      "chi-square contribution = (observed - expected)^2 / expected",
      "Flag large deviation and investigate randomization/instrumentation",
    ],
    sampleStrongAnswer:
      "```sql\nWITH clean_assignment AS (\n  SELECT experiment_id, user_id, MIN(variant) AS variant\n  FROM experiment_assignments\n  WHERE experiment_id = 'exp_123'\n  GROUP BY experiment_id, user_id\n),\nobserved AS (\n  SELECT experiment_id, variant, COUNT(*) AS observed_users\n  FROM clean_assignment\n  GROUP BY experiment_id, variant\n),\ntotals AS (\n  SELECT experiment_id, SUM(observed_users) AS total_users\n  FROM observed\n  GROUP BY experiment_id\n)\nSELECT o.experiment_id,\n       o.variant,\n       o.observed_users,\n       e.expected_share,\n       t.total_users * e.expected_share AS expected_users,\n       o.observed_users - t.total_users * e.expected_share AS user_delta,\n       POWER(o.observed_users - t.total_users * e.expected_share, 2)\n         / NULLIF(t.total_users * e.expected_share, 0) AS chi_square_contribution\nFROM observed o\nJOIN totals t USING (experiment_id)\nJOIN expected_allocations e\n  ON e.experiment_id = o.experiment_id\n AND e.variant = o.variant\nORDER BY o.variant;\n```\n\nThis query gives the observed-vs-expected table and the chi-square components. I would sum the components and compare against the appropriate chi-square threshold outside SQL or in a stats layer. If SRM is present, I would not trust the readout until I understand whether the issue is randomization, logging, filtering, or exposure eligibility.",
    commonMistakes: [
      "Counting duplicate assignment rows instead of users",
      "Comparing to a hard-coded 50/50 split when allocation is not 50/50",
      "Treating no SRM as proof the experiment is valid",
      "Ignoring users assigned to multiple variants",
    ],
    scoringRubric: [
      { band: "0-1", description: "Raw assignment counts or wrong expected allocation." },
      { band: "2", description: "Observed counts are right but expected counts or interpretation is weak." },
      { band: "3", description: "Correct dedupe, expected counts, deltas, and SRM diagnostic framing." },
      { band: "4", description: "Above, plus chi-square contribution and a strong investigation plan." },
    ],
    followUps: [
      "What would you do if one user appears in both variants?",
      "How can filtering after assignment create fake SRM?",
      "Would you ever ship an experiment with SRM?",
    ],
  },
  {
    id: "SQL_008",
    category: "sql",
    subcategory: "segmentation_breakdown",
    title: "First-Touch Attribution for New Signups",
    difficulty: "medium",
    primaryWeaknessTag: "sql_rigor",
    timeboxMinutes: 20,
    schemaText:
      "users(user_id BIGINT, signup_ts TIMESTAMP)\n" +
      "touches(user_id BIGINT, touch_ts TIMESTAMP, channel STRING, campaign STRING)\n" +
      "-- users can have many touches; attribution window is 30 days before signup; channel can be null",
    companyEmphasis: ["airbnb", "stripe", "booking", "all"],
    tags: ["attribution", "window-functions", "marketing", "dedupe"],
    targetSkills: ["window functions", "join conditions", "attribution definition", "edge cases"],
    prompt:
      "Compute first-touch attributed signups by channel for users who signed up in the last 30 days. First touch means the earliest touch within 30 days before signup. Users with no qualifying touch should be counted as 'organic_unknown'.",
    expectedFramework: [
      "Filter signup cohort first",
      "Join touches inside the 30-day pre-signup window",
      "Rank touches per user by touch timestamp",
      "Keep rank 1 and preserve users with no touch",
      "Group attributed users by channel",
    ],
    sampleAnswerOutline: [
      "recent_users CTE",
      "candidate_touches CTE with left join and window bounds",
      "ROW_NUMBER per user ordered by touch_ts",
      "coalesce missing channel to organic_unknown",
      "count users by attributed channel",
    ],
    sampleStrongAnswer:
      "```sql\nWITH recent_users AS (\n  SELECT user_id, signup_ts\n  FROM users\n  WHERE signup_ts >= CURRENT_DATE - INTERVAL '30 days'\n),\ncandidates AS (\n  SELECT u.user_id,\n         u.signup_ts,\n         t.channel,\n         t.campaign,\n         t.touch_ts,\n         ROW_NUMBER() OVER (PARTITION BY u.user_id ORDER BY t.touch_ts ASC, t.campaign) AS rn\n  FROM recent_users u\n  LEFT JOIN touches t\n    ON t.user_id = u.user_id\n   AND t.touch_ts >= u.signup_ts - INTERVAL '30 days'\n   AND t.touch_ts <  u.signup_ts\n)\nSELECT COALESCE(channel, 'organic_unknown') AS attributed_channel,\n       COUNT(DISTINCT user_id) AS signups\nFROM candidates\nWHERE rn = 1 OR touch_ts IS NULL\nGROUP BY 1\nORDER BY signups DESC;\n```\n\nThe important definition is that attribution is user-level and pre-signup only. The left join keeps unattributed users, and the row number chooses the earliest qualifying touch. In production I would also define deterministic tie-breaking and whether internal/referral touches are eligible.",
    commonMistakes: [
      "Using any touch after signup",
      "Using last touch when asked for first touch",
      "Dropping users with no touches",
      "Counting touches rather than attributed users",
    ],
    scoringRubric: [
      { band: "0-1", description: "Wrong attribution window or wrong grain." },
      { band: "2", description: "Roughly right but drops unattributed users or mishandles ordering." },
      { band: "3", description: "Correct window, first-touch ranking, and user-level counts." },
      { band: "4", description: "Above, plus clear tie-breaking and eligibility caveats." },
    ],
    followUps: [
      "How would last-touch attribution differ?",
      "How would you handle multiple devices or anonymous pre-signup touches?",
      "How would you compare first-touch and last-touch channel mix?",
    ],
  },
  {
    id: "SQL_009",
    category: "sql",
    subcategory: "retention_cohort",
    title: "Retention Curve From Day 1 to Day 30",
    difficulty: "hard",
    primaryWeaknessTag: "sql_rigor",
    timeboxMinutes: 25,
    schemaText:
      "users(user_id BIGINT, signup_date DATE)\n" +
      "events(user_id BIGINT, event_ts TIMESTAMP, event_type STRING)\n" +
      "calendar_days(day_number INT) -- contains integers 1 through 30",
    companyEmphasis: ["google", "meta", "netflix", "all"],
    tags: ["retention", "cohort", "date-spine", "curve", "dedupe"],
    targetSkills: ["retention logic", "date spine", "cohorting", "efficient aggregation"],
    prompt:
      "Write SQL to compute a day-1 through day-30 retention curve by signup week. For each signup week and day_number, return cohort size, retained users, and retention rate. Define retention as any qualifying event exactly on that day after signup.",
    expectedFramework: [
      "Create a signup cohort table with one row per user",
      "Cross join to a 1-30 day spine so missing days appear",
      "Dedupe activity to user/date",
      "Join activity to signup_date + day_number",
      "Aggregate by cohort week and day_number",
    ],
    sampleAnswerOutline: [
      "cohort users by signup week",
      "activity CTE: distinct user_id and event_date",
      "cohort_day grid = cohort x calendar_days",
      "left join activity on exact day offset",
      "count distinct retained users and divide by cohort size",
    ],
    sampleStrongAnswer:
      "```sql\nWITH cohort AS (\n  SELECT user_id,\n         signup_date,\n         DATE_TRUNC('week', signup_date) AS signup_week\n  FROM users\n),\nactivity AS (\n  SELECT DISTINCT user_id, DATE(event_ts) AS event_date\n  FROM events\n  WHERE event_type IN ('open_app', 'view_content', 'search', 'message')\n),\ncohort_day AS (\n  SELECT c.user_id, c.signup_date, c.signup_week, d.day_number\n  FROM cohort c\n  CROSS JOIN calendar_days d\n  WHERE d.day_number BETWEEN 1 AND 30\n)\nSELECT cd.signup_week,\n       cd.day_number,\n       COUNT(DISTINCT cd.user_id) AS cohort_size,\n       COUNT(DISTINCT CASE WHEN a.user_id IS NOT NULL THEN cd.user_id END) AS retained_users,\n       COUNT(DISTINCT CASE WHEN a.user_id IS NOT NULL THEN cd.user_id END)::FLOAT\n         / NULLIF(COUNT(DISTINCT cd.user_id), 0) AS retention_rate\nFROM cohort_day cd\nLEFT JOIN activity a\n  ON a.user_id = cd.user_id\n AND a.event_date = cd.signup_date + cd.day_number * INTERVAL '1 day'\nGROUP BY cd.signup_week, cd.day_number\nORDER BY cd.signup_week, cd.day_number;\n```",
    commonMistakes: [
      "Only returning days where at least one user was active",
      "Using cumulative retention when the prompt asks exact-day retention",
      "Counting duplicate events",
      "Forgetting that day 0 is signup day and day 1 is signup + 1",
    ],
    scoringRubric: [
      { band: "0-1", description: "Wrong retention definition or missing most days." },
      { band: "2", description: "Basic retention query but no day spine or duplicate handling." },
      { band: "3", description: "Correct cohort-day grid, deduped activity, and exact-day retention." },
      { band: "4", description: "Above, plus clear definition tradeoffs and efficient scaling notes." },
    ],
    followUps: [
      "How would rolling retention differ from exact-day retention?",
      "How would you avoid exploding the join for hundreds of millions of users?",
      "How would you segment this curve by acquisition channel?",
    ],
  },
  {
    id: "SQL_010",
    category: "sql",
    subcategory: "funnel_conversion",
    title: "Session-Level Conversion Funnel",
    difficulty: "hard",
    primaryWeaknessTag: "data_cleaning",
    timeboxMinutes: 25,
    schemaText:
      "events(user_id BIGINT, session_id STRING, event_ts TIMESTAMP, event_type STRING)\n" +
      "-- event_type in ('search','view_item','start_checkout','purchase'); users can have many sessions",
    companyEmphasis: ["airbnb", "uber", "doordash", "all"],
    tags: ["session-funnel", "conversion", "ordering", "grain"],
    targetSkills: ["session grain", "ordered funnel", "dedupe", "metric definition"],
    prompt:
      "Compute a session-level funnel search -> view_item -> start_checkout -> purchase. Return sessions reaching each step and step-to-step conversion rates. Count a session once, enforce ordering, and explain why session-level and user-level funnels can tell different stories.",
    expectedFramework: [
      "Aggregate first timestamp per session per step",
      "Enforce ordering within each session",
      "Count sessions meeting each cumulative condition",
      "Compute step-to-step conversion rates safely",
      "Explain grain tradeoff: session vs user",
    ],
    sampleAnswerOutline: [
      "first_step by session_id and event_type",
      "pivot to one row per session",
      "ordered boolean conditions",
      "aggregate counts and conversion rates",
    ],
    sampleStrongAnswer:
      "```sql\nWITH first_step AS (\n  SELECT user_id, session_id, event_type, MIN(event_ts) AS ts\n  FROM events\n  WHERE event_type IN ('search','view_item','start_checkout','purchase')\n  GROUP BY user_id, session_id, event_type\n),\nwide AS (\n  SELECT user_id,\n         session_id,\n         MIN(CASE WHEN event_type = 'search' THEN ts END) AS t_search,\n         MIN(CASE WHEN event_type = 'view_item' THEN ts END) AS t_view,\n         MIN(CASE WHEN event_type = 'start_checkout' THEN ts END) AS t_checkout,\n         MIN(CASE WHEN event_type = 'purchase' THEN ts END) AS t_purchase\n  FROM first_step\n  GROUP BY user_id, session_id\n),\ncounts AS (\n  SELECT COUNT(*) FILTER (WHERE t_search IS NOT NULL) AS search_sessions,\n         COUNT(*) FILTER (WHERE t_view > t_search) AS view_sessions,\n         COUNT(*) FILTER (WHERE t_checkout > t_view AND t_view > t_search) AS checkout_sessions,\n         COUNT(*) FILTER (WHERE t_purchase > t_checkout AND t_checkout > t_view AND t_view > t_search) AS purchase_sessions\n  FROM wide\n)\nSELECT *,\n       view_sessions::FLOAT / NULLIF(search_sessions, 0) AS search_to_view,\n       checkout_sessions::FLOAT / NULLIF(view_sessions, 0) AS view_to_checkout,\n       purchase_sessions::FLOAT / NULLIF(checkout_sessions, 0) AS checkout_to_purchase\nFROM counts;\n```",
    commonMistakes: [
      "Mixing events across sessions for the same user",
      "Counting users instead of sessions",
      "Ignoring event ordering",
      "Not explaining why repeated sessions change interpretation",
    ],
    scoringRubric: [
      { band: "0-1", description: "Wrong grain or raw event counts." },
      { band: "2", description: "Session grain is present but ordering or rates are flawed." },
      { band: "3", description: "Correct ordered session funnel and conversion rates." },
      { band: "4", description: "Above, plus a strong session-vs-user interpretation." },
    ],
    followUps: [
      "How would you compute user-level conversion from the same data?",
      "What if purchase happens in a later session?",
      "How would you diagnose which step drove a weekly drop?",
    ],
  },
  {
    id: "SQL_011",
    category: "sql",
    subcategory: "root_cause_anomaly",
    title: "Revenue Drop Decomposition by Price and Volume",
    difficulty: "hard",
    primaryWeaknessTag: "product_judgment",
    timeboxMinutes: 25,
    schemaText:
      "orders(order_id BIGINT, order_ts TIMESTAMP, country STRING, product_line STRING, units INT, revenue NUMERIC, status STRING)\n" +
      "-- completed orders only should contribute; refunds/cancellations exist",
    companyEmphasis: ["stripe", "airbnb", "doordash", "all"],
    tags: ["root-cause", "decomposition", "revenue", "price-volume-mix"],
    targetSkills: ["diagnostic SQL", "metric decomposition", "business interpretation"],
    prompt:
      "Revenue dropped week over week. Write SQL to decompose the drop by country and product_line into volume effect and average-revenue-per-unit effect. Explain how you would use the output to decide where to investigate first.",
    expectedFramework: [
      "Aggregate completed revenue and units by week/segment",
      "Compute ARPU or average revenue per unit safely",
      "Join current week to previous week at the same segment grain",
      "Separate volume contribution from price/monetization contribution",
      "Rank segments by absolute contribution to the total drop",
    ],
    sampleAnswerOutline: [
      "weekly segment CTE",
      "comparison CTE current vs previous",
      "volume_effect = (cur_units - prev_units) * prev_rev_per_unit",
      "rate_effect = cur_units * (cur_rev_per_unit - prev_rev_per_unit)",
      "sort by total revenue delta",
    ],
    sampleStrongAnswer:
      "```sql\nWITH weekly AS (\n  SELECT DATE_TRUNC('week', order_ts) AS week,\n         COALESCE(country, 'unknown') AS country,\n         COALESCE(product_line, 'unknown') AS product_line,\n         SUM(units) AS units,\n         SUM(revenue) AS revenue,\n         SUM(revenue) / NULLIF(SUM(units), 0) AS rev_per_unit\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY 1,2,3\n),\ncompare AS (\n  SELECT cur.country,\n         cur.product_line,\n         prev.units AS prev_units,\n         cur.units AS cur_units,\n         prev.rev_per_unit AS prev_rpu,\n         cur.rev_per_unit AS cur_rpu,\n         cur.revenue - prev.revenue AS revenue_delta,\n         (cur.units - prev.units) * prev.rev_per_unit AS volume_effect,\n         cur.units * (cur.rev_per_unit - prev.rev_per_unit) AS rate_effect\n  FROM weekly cur\n  JOIN weekly prev\n    ON cur.country = prev.country\n   AND cur.product_line = prev.product_line\n   AND cur.week = prev.week + INTERVAL '1 week'\n  WHERE cur.week = DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'\n)\nSELECT *\nFROM compare\nORDER BY revenue_delta ASC;\n```",
    commonMistakes: [
      "Only looking at percentage drops and ignoring revenue size",
      "Mixing cancelled/refunded orders with completed revenue",
      "Not separating volume from monetization changes",
      "Using total revenue rank without segment context",
    ],
    scoringRubric: [
      { band: "0-1", description: "Basic revenue query without decomposition." },
      { band: "2", description: "Compares weeks but cannot explain drivers." },
      { band: "3", description: "Correct segment comparison with volume and rate effects." },
      { band: "4", description: "Above, plus prioritization logic and caveats about mix/residual effects." },
    ],
    followUps: [
      "How would you add customer mix as a third component?",
      "What if new product lines appear only in the current week?",
      "How would you validate whether this is a data pipeline issue?",
    ],
  },
  {
    id: "SQL_012",
    category: "sql",
    subcategory: "data_quality",
    title: "Reconcile Events Against Source-of-Truth Orders",
    difficulty: "medium",
    primaryWeaknessTag: "data_integrity",
    timeboxMinutes: 20,
    schemaText:
      "orders(order_id BIGINT, user_id BIGINT, created_at TIMESTAMP, status STRING, revenue NUMERIC)\n" +
      "purchase_events(event_id BIGINT, order_id BIGINT, user_id BIGINT, event_ts TIMESTAMP, revenue NUMERIC)\n" +
      "-- purchase_events are analytics logs; orders is source of truth",
    companyEmphasis: ["stripe", "airbnb", "uber", "all"],
    tags: ["reconciliation", "data-quality", "orders", "analytics-logs"],
    targetSkills: ["data integrity", "anti-joins", "duplicate detection", "debugging"],
    prompt:
      "Write SQL checks to reconcile purchase_events against the source-of-truth orders table for yesterday. Identify missing events, duplicate events, orphan events, and revenue mismatches.",
    expectedFramework: [
      "Filter both sources to the same business date and eligible order status",
      "Find completed orders with no purchase event",
      "Find multiple events per order",
      "Find events without a matching completed order",
      "Find revenue mismatches with a tolerance",
    ],
    sampleAnswerOutline: [
      "orders_yesterday and events_yesterday CTEs",
      "left anti-join for missing events",
      "group by order_id having count > 1 for duplicates",
      "left anti-join from events to orders for orphans",
      "join and compare revenue difference",
    ],
    sampleStrongAnswer:
      "```sql\nWITH o AS (\n  SELECT order_id, user_id, revenue\n  FROM orders\n  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'\n    AND status = 'completed'\n),\ne AS (\n  SELECT event_id, order_id, user_id, revenue\n  FROM purchase_events\n  WHERE DATE(event_ts) = CURRENT_DATE - INTERVAL '1 day'\n),\nmissing_events AS (\n  SELECT o.order_id, 'missing_event' AS issue\n  FROM o\n  LEFT JOIN e USING (order_id)\n  WHERE e.order_id IS NULL\n),\nduplicate_events AS (\n  SELECT order_id, 'duplicate_event' AS issue\n  FROM e\n  GROUP BY order_id\n  HAVING COUNT(*) > 1\n),\norphan_events AS (\n  SELECT e.order_id, 'orphan_event' AS issue\n  FROM e\n  LEFT JOIN o USING (order_id)\n  WHERE o.order_id IS NULL\n),\nrevenue_mismatch AS (\n  SELECT o.order_id, 'revenue_mismatch' AS issue\n  FROM o\n  JOIN e USING (order_id)\n  GROUP BY o.order_id, o.revenue\n  HAVING ABS(o.revenue - SUM(e.revenue)) > 0.01\n)\nSELECT * FROM missing_events\nUNION ALL SELECT * FROM duplicate_events\nUNION ALL SELECT * FROM orphan_events\nUNION ALL SELECT * FROM revenue_mismatch;\n```",
    commonMistakes: [
      "Treating analytics events as the source of truth",
      "Using only inner joins and missing missing/orphan cases",
      "Not checking duplicate events separately",
      "Comparing different date definitions without stating it",
    ],
    scoringRubric: [
      { band: "0-1", description: "Only a simple count comparison." },
      { band: "2", description: "Finds one issue type but misses the reconciliation framework." },
      { band: "3", description: "Checks missing, duplicate, orphan, and revenue mismatch cases." },
      { band: "4", description: "Above, plus clear source-of-truth framing and date/tolerance caveats." },
    ],
    followUps: [
      "How would you turn this into a daily data quality monitor?",
      "What if event timestamps and order timestamps fall on different days?",
      "How would you quantify business impact of the issue?",
    ],
  },
  {
    id: "PY_006",
    category: "python_coding",
    subcategory: "reusable_function",
    title: "Reusable Cohort Metric Function",
    difficulty: "hard",
    primaryWeaknessTag: "python_coding",
    timeboxMinutes: 25,
    schemaText:
      "users: DataFrame[user_id, signup_date, country, platform]\n" +
      "events: DataFrame[user_id, event_ts, event_type]\n" +
      "Function should support day_n and optional segment columns.",
    companyEmphasis: ["google", "airbnb", "stripe", "all"],
    tags: ["pandas", "reusable-function", "cohort", "retention", "api-design"],
    targetSkills: ["function design", "pandas fluency", "parameterization", "testing mindset"],
    prompt:
      "Design and implement `cohort_retention(users, events, day_n=7, segments=None)` that returns retention by signup week and optional segment columns. Explain function inputs, edge cases, and how you would test it.",
    expectedFramework: [
      "Clean datetime columns and validate required inputs",
      "Parameterize day_n and optional segment columns",
      "Build user-level retained flag",
      "Group by signup week plus segments",
      "Return cohort_size, retained_users, retention_rate",
    ],
    sampleAnswerOutline: [
      "Default segments to []",
      "Compute exact day_n activity from normalized dates",
      "Map retained flag back onto all users",
      "Group with dynamic keys",
      "Mention tests for no events, duplicates, segments, and boundary days",
    ],
    sampleStrongAnswer:
      "```python\nimport pandas as pd\n\ndef cohort_retention(users, events, day_n=7, segments=None):\n    segments = segments or []\n    required = {'user_id', 'signup_date'} | set(segments)\n    missing = required - set(users.columns)\n    if missing:\n        raise ValueError(f'missing users columns: {missing}')\n\n    u = users.copy()\n    u['signup_date'] = pd.to_datetime(u['signup_date']).dt.normalize()\n    u['cohort_week'] = u['signup_date'].dt.to_period('W').astype(str)\n\n    e = events[['user_id', 'event_ts']].copy()\n    e['event_date'] = pd.to_datetime(e['event_ts']).dt.normalize()\n    joined = e.merge(u[['user_id', 'signup_date']], on='user_id', how='inner')\n    offset = (joined['event_date'] - joined['signup_date']).dt.days\n    retained_users = set(joined.loc[offset.eq(day_n), 'user_id'].unique())\n    u['retained'] = u['user_id'].isin(retained_users)\n\n    keys = ['cohort_week'] + segments\n    out = (u.groupby(keys, dropna=False)\n             .agg(cohort_size=('user_id', 'nunique'), retained_users=('retained', 'sum'))\n             .reset_index())\n    out['retention_rate'] = out['retained_users'] / out['cohort_size']\n    return out\n```",
    commonMistakes: [
      "Hard-coding day 7 and no segment support",
      "Dropping users with no events",
      "Using row counts when users can duplicate",
      "No validation or test discussion",
    ],
    scoringRubric: [
      { band: "0-1", description: "One-off script or incorrect retention." },
      { band: "2", description: "Correct for a narrow case but not reusable or well-tested." },
      { band: "3", description: "Reusable function with day_n, segments, and correct denominator." },
      { band: "4", description: "Above, plus validation, edge-case tests, and clear API choices." },
    ],
    followUps: [
      "How would you support rolling retention?",
      "How would you make this work for very large event tables?",
      "What unit tests would you write first?",
    ],
  },
  {
    id: "PY_007",
    category: "python_coding",
    subcategory: "stat_simulation",
    title: "Implement CUPED Adjustment for an Experiment",
    difficulty: "hard",
    primaryWeaknessTag: "statistical_simulation",
    timeboxMinutes: 25,
    schemaText:
      "df: DataFrame[user_id, variant, pre_metric, post_metric]\n" +
      "variant in {'control','treatment'}; one row per user; some pre_metric values may be missing",
    companyEmphasis: ["google", "netflix", "meta", "all"],
    tags: ["cuped", "variance-reduction", "experiment", "numpy", "statistics"],
    targetSkills: ["statistical implementation", "variance reduction", "clean code", "interpretation"],
    prompt:
      "Write Python code to compute a CUPED-adjusted treatment effect using pre_metric as the covariate. Explain why CUPED can reduce variance and when it can be invalid.",
    expectedFramework: [
      "Compute theta = Cov(post, pre) / Var(pre) using eligible rows",
      "Create adjusted outcome post - theta * (pre - mean_pre)",
      "Compare treatment vs control means on adjusted outcome",
      "Handle missing pre_metric deliberately",
      "Explain pre-treatment covariate requirement",
    ],
    sampleAnswerOutline: [
      "Drop or impute missing pre_metric with clear choice",
      "Estimate theta on pooled data",
      "Create adjusted metric",
      "Return raw effect and CUPED effect",
      "Discuss validity assumptions",
    ],
    sampleStrongAnswer:
      "```python\nimport numpy as np\n\ndef cuped_effect(df):\n    d = df[['variant', 'pre_metric', 'post_metric']].dropna().copy()\n    x = d['pre_metric'].to_numpy()\n    y = d['post_metric'].to_numpy()\n    theta = np.cov(y, x, ddof=1)[0, 1] / np.var(x, ddof=1)\n    x_mean = x.mean()\n    d['post_cuped'] = d['post_metric'] - theta * (d['pre_metric'] - x_mean)\n\n    raw = d.loc[d['variant'].eq('treatment'), 'post_metric'].mean() - d.loc[d['variant'].eq('control'), 'post_metric'].mean()\n    adjusted = d.loc[d['variant'].eq('treatment'), 'post_cuped'].mean() - d.loc[d['variant'].eq('control'), 'post_cuped'].mean()\n    return {'theta': theta, 'raw_effect': raw, 'cuped_effect': adjusted}\n```",
    commonMistakes: [
      "Using a post-treatment covariate",
      "Computing theta separately by variant without explaining why",
      "Forgetting to center the covariate",
      "Claiming CUPED removes bias rather than mostly reducing variance",
    ],
    scoringRubric: [
      { band: "0-1", description: "Incorrect formula or uses post-treatment information." },
      { band: "2", description: "Rough CUPED idea but formula or missing-value handling is weak." },
      { band: "3", description: "Correct theta, adjusted outcome, and treatment-control comparison." },
      { band: "4", description: "Above, plus clear variance-reduction intuition and validity caveats." },
    ],
    followUps: [
      "How would you estimate the standard error of the CUPED effect?",
      "What if pre_metric is missing for many new users?",
      "How would you validate CUPED helped?",
    ],
  },
  {
    id: "PY_008",
    category: "python_coding",
    subcategory: "pandas_manipulation",
    title: "Decompose a Metric Drop in pandas",
    difficulty: "medium",
    primaryWeaknessTag: "product_judgment",
    timeboxMinutes: 20,
    schemaText:
      "df: DataFrame[week, segment, users, conversions]\n" +
      "Contains exactly two weeks: previous and current. conversion_rate = conversions / users.",
    companyEmphasis: ["meta", "tiktok", "airbnb", "all"],
    tags: ["pandas", "decomposition", "root-cause", "conversion-rate"],
    targetSkills: ["pandas joins", "diagnostic reasoning", "impact sizing", "communication"],
    prompt:
      "Write a pandas function that compares current vs previous week conversion by segment and ranks segments by contribution to the overall conversion drop. Explain how you distinguish a large percentage drop from a large business impact.",
    expectedFramework: [
      "Aggregate by week and segment if needed",
      "Pivot or self-join previous and current metrics",
      "Compute conversion rates safely",
      "Compute impact as users_current * (rate_current - rate_previous)",
      "Sort by most negative contribution",
    ],
    sampleAnswerOutline: [
      "groupby week/segment users and conversions",
      "pivot previous/current into columns",
      "rate = conversions / users",
      "contribution = current users times rate delta",
      "rank ascending by contribution",
    ],
    sampleStrongAnswer:
      "```python\nimport pandas as pd\n\ndef conversion_drop_contributors(df):\n    g = (df.groupby(['week', 'segment'], as_index=False)\n           .agg(users=('users', 'sum'), conversions=('conversions', 'sum')))\n    g['rate'] = g['conversions'] / g['users']\n    weeks = sorted(g['week'].unique())\n    prev, cur = weeks[-2], weeks[-1]\n    wide = (g[g['week'].isin([prev, cur])]\n              .pivot(index='segment', columns='week', values=['users', 'rate']))\n    wide.columns = [f'{metric}_{week}' for metric, week in wide.columns]\n    wide = wide.reset_index().fillna(0)\n    wide['rate_delta'] = wide[f'rate_{cur}'] - wide[f'rate_{prev}']\n    wide['contribution'] = wide[f'users_{cur}'] * wide['rate_delta']\n    return wide.sort_values('contribution')\n```",
    commonMistakes: [
      "Ranking by percentage drop only",
      "Ignoring segment size",
      "Averaging conversion rates instead of aggregating users/conversions",
      "Not handling missing segments across weeks",
    ],
    scoringRubric: [
      { band: "0-1", description: "Only calculates rates; no useful contribution ranking." },
      { band: "2", description: "Compares segments but uses percent drop or averages incorrectly." },
      { band: "3", description: "Correct aggregation, rate delta, and impact-based ranking." },
      { band: "4", description: "Above, plus thoughtful mix-shift caveats and communication framing." },
    ],
    followUps: [
      "How would you include mix shift explicitly?",
      "How would you visualize the output for a PM?",
      "What if a segment is new this week?",
    ],
  },
  {
    id: "PY_009",
    category: "python_coding",
    subcategory: "log_processing",
    title: "Process a Large CSV in Chunks",
    difficulty: "medium",
    primaryWeaknessTag: "python_coding",
    timeboxMinutes: 20,
    schemaText:
      "events.csv columns: user_id, event_ts, event_type, country\n" +
      "The file is too large to fit comfortably in memory. Need daily active users by country.",
    companyEmphasis: ["google", "stripe", "airbnb", "all"],
    tags: ["large-data", "pandas", "chunking", "memory", "active-users"],
    targetSkills: ["scalable pandas", "memory tradeoffs", "dedupe", "metric definition"],
    prompt:
      "Write Python code to compute daily active users by country from a very large events CSV using pandas chunks. Active user = at least one qualifying event that day. Explain memory/performance tradeoffs.",
    expectedFramework: [
      "Read CSV in chunks with selected columns and parsed timestamps",
      "Filter qualifying active events",
      "Deduplicate user/day/country within each chunk",
      "Accumulate unique keys or partial sets carefully",
      "Explain when to use SQL/Spark instead",
    ],
    sampleAnswerOutline: [
      "usecols and chunksize",
      "convert event_ts to date",
      "drop_duplicates on date/country/user_id",
      "accumulate keys then groupby",
      "mention memory limits of keeping all unique keys",
    ],
    sampleStrongAnswer:
      "```python\nimport pandas as pd\n\ndef dau_by_country_csv(path, chunksize=1_000_000):\n    keep = []\n    active_events = {'open_app', 'view_content', 'search', 'message'}\n    for chunk in pd.read_csv(path, usecols=['user_id', 'event_ts', 'event_type', 'country'], chunksize=chunksize):\n        chunk = chunk[chunk['event_type'].isin(active_events)].copy()\n        chunk['date'] = pd.to_datetime(chunk['event_ts']).dt.date\n        chunk['country'] = chunk['country'].fillna('unknown')\n        keep.append(chunk[['date', 'country', 'user_id']].drop_duplicates())\n    keys = pd.concat(keep, ignore_index=True).drop_duplicates()\n    return (keys.groupby(['date', 'country'])['user_id']\n                .nunique()\n                .reset_index(name='dau'))\n```",
    commonMistakes: [
      "Loading the full CSV without acknowledging memory",
      "Counting rows instead of unique active users",
      "Deduping only within chunk and forgetting cross-chunk duplicates",
      "Keeping unnecessary columns",
    ],
    scoringRubric: [
      { band: "0-1", description: "Not scalable or wrong metric." },
      { band: "2", description: "Uses chunks but misses cross-chunk dedupe or memory tradeoffs." },
      { band: "3", description: "Correct chunked read, dedupe, and DAU aggregation." },
      { band: "4", description: "Above, plus clear performance tradeoffs and when to move to warehouse/Spark." },
    ],
    followUps: [
      "What if unique user-day keys still do not fit in memory?",
      "How would you make this incremental by date partition?",
      "Why might the warehouse be a better place for this computation?",
    ],
  },
];
