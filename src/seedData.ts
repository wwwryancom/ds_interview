import type { QuestionInput } from "./mappers.js";

/**
 * Phase-1 MVP seed questions transcribed from docs/ds-interview-question-draft-v2.md.
 * English question content, Chinese UI shell. Upserts keep existing practice data intact.
 */
export const SEED_QUESTIONS: QuestionInput[] = [
  {
    id: "EXP_001",
    category: "experiment_stats",
    subcategory: "interpretation",
    title: "Interpreting a Positive but Non-Significant Result",
    difficulty: "hard",
    primaryWeaknessTag: "interpretation",
    timeboxMinutes: 15,
    companyEmphasis: [
      "google",
      "meta",
      "tiktok",
      "netflix",
      "all"
    ],
    tags: [
      "experiment-readout",
      "guardrails",
      "srm",
      "decision-under-uncertainty"
    ],
    targetSkills: [
      "statistical reasoning",
      "guardrail interpretation",
      "bias awareness",
      "decision making"
    ],
    prompt: "Your team ran an A/B test on a new ranking / recommendation model. The change is intended to improve discovery quality for casual users without hurting overall ecosystem health. Results after two weeks: - Primary metric: 7-day session depth, +1.4%, p-value = 0.12 - Guardrail metric: hide / report / negative-feedback rate, +3.1% - Secondary metric: downstream shares or saves, +2.7%, p-value = 0.03 - Sample size reached 92% of the pre-registered target - The treatment group has a slightly higher share of power users than control Was there a pre-registered decision rule? How do you interpret these results, and would you recommend launching, rerunning, ramping to a smaller population, or stopping?",
    expectedFramework: [
      "Ask what the pre-registered primary metric and decision rule were",
      "Separate directional evidence from statistically reliable evidence",
      "Treat guardrail deterioration as a real risk, not a footnote",
      "Recognize the power-user imbalance as a possible SRM / randomization failure",
      "Recommend a next step and how you'd communicate it"
    ],
    sampleAnswerOutline: [
      "Restate goal and pre-defined decision rule",
      "Primary directionally positive but under-powered (p=0.12, 92% sample)",
      "Guardrail worsening => risky, not just inconclusive",
      "Imbalance is a validity threat; run an SRM check",
      "No full launch; diagnose, then rerun or bounded ramp"
    ],
    sampleStrongAnswer: "I would not treat this as a clean win. The primary is moving the right way, but with p=0.12 and only\n92% of planned sample, it doesn't clear a pre-registered 0.05 bar. More importantly the guardrail is\nworsening 3.1%, so there is real downside, not just noise. The power-user imbalance worries me most:\nif randomization produced uneven populations that's a sample-ratio-mismatch signal and it can drive\nboth the positive primary and the negative guardrail. I'd run an SRM check first. My recommendation\nis no full launch today: diagnose the imbalance, check whether the guardrail movement is\nconcentrated in a segment, and choose between a clean rerun or a capped ramp only if I can explain\nthe imbalance and bound the downside. To the PM: \"promising direction, unproven, currently carrying\na real integrity cost — here's exactly what would make me confident.\"",
    commonMistakes: [
      "\"p > 0.05, so there is no effect\"",
      "Ignoring the guardrail because the primary is directionally positive",
      "Treating secondary-metric significance as enough to launch",
      "A launch verdict that never addresses the imbalance/SRM"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Reads p=0.12 as \"no effect\" or ships on the secondary; ignores guardrail/imbalance."
      },
      {
        band: "2",
        description: "Correctly says under-powered/inconclusive but treats guardrail and imbalance as side notes."
      },
      {
        band: "3",
        description: "Integrates primary + guardrail + sample size into a no-launch-yet call with next steps."
      },
      {
        band: "4",
        description: "Above, plus names SRM explicitly, proposes the diagnostic, and frames a crisp PM message."
      }
    ],
    followUps: [
      "If the PM says \"the direction is clearly positive, let's just ship,\" how do you respond?",
      "How exactly would you test whether the power-user imbalance is an SRM problem?",
      "Under what conditions would you support a capped ramp despite these results?"
    ]
  },
  {
    id: "EXP_002",
    category: "experiment_stats",
    subcategory: "experiment_design",
    title: "Designing an Experiment Under Network Interference",
    difficulty: "hard",
    primaryWeaknessTag: "experiment_design",
    timeboxMinutes: 20,
    companyEmphasis: [
      "meta",
      "tiktok",
      "uber",
      "doordash",
      "linkedin",
      "lyft"
    ],
    tags: [
      "network-interference",
      "sutva",
      "cluster-randomization",
      "geo-experiment",
      "switchback"
    ],
    targetSkills: [
      "experiment design",
      "causal validity",
      "trade-off reasoning",
      "diagnostics"
    ],
    prompt: "Your team wants to test a feature that changes how users interact *with each other* — something that makes content, invites, or orders spread more easily between connected users (social graph, same-city supply and demand, or a referral mechanic). The concern: behavior of treatment users may **spill over** onto control users because they share a network, biasing a standard user-level A/B. 1. Why can standard user-level randomization **over- or under-estimate** the true effect here? 2. What design(s) would you use to reduce interference (cluster / ego-network / geo / switchback)? 3. What does each design cost you in power and bias? 4. What diagnostics would detect whether spillover is actually happening?",
    expectedFramework: [
      "Name the violated assumption (SUTVA / no-interference)",
      "Direction of bias: contamination shrinks lift; marketplace congestion can flip sign",
      "Match the randomization unit to the interference structure",
      "Acknowledge the variance/power cost of clustering and mitigations (more clusters, CUPED)",
      "Propose a concrete spillover diagnostic"
    ],
    sampleAnswerOutline: [
      "State SUTVA violation and why user-level A/B is biased",
      "Pick a design isolating the interference (cluster / ego-network / geo / switchback)",
      "Quantify the power trade-off and how to recover it",
      "Give a measurable spillover check (exposure of control users, dose-response)"
    ],
    sampleStrongAnswer: "The problem is that user-level randomization assumes one user's treatment doesn't affect another's\noutcome — SUTVA — and that's false here: a treated user's activity reaches control users, so control\nis \"partially treated.\" That usually understates the true effect; in a capacity-constrained\nmarketplace it can be worse, because treatment can consume supply control would have gotten, biasing\neither direction. I'd change the randomization unit to match the interference: cluster randomization\non connected communities (or ego-network designs) for a social graph; geo-level or switchback\ndesigns for a two-sided marketplace so supply effects stay within an arm. The cost is power — my\neffective N becomes the number of clusters, and between-cluster variance rises — so I'd budget for\nmany clusters, use CUPED / pre-period covariates, and possibly run longer. To confirm interference\nis real, I'd measure how much control users were exposed to treated-user activity and look for a\ndose-response between cluster treatment saturation and effect size.",
    commonMistakes: [
      "Running a normal user-level A/B and never mentioning SUTVA",
      "Naming \"cluster randomization\" without acknowledging the power cost",
      "Assuming spillover always shrinks the effect (ignoring marketplace cannibalization)",
      "No concrete way to detect whether interference actually occurred"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Proposes a standard user-level A/B; no awareness of interference."
      },
      {
        band: "2",
        description: "Mentions spillover but no concrete design fix or names a design without trade-offs."
      },
      {
        band: "3",
        description: "Picks an appropriate design, explains the bias direction and the power cost."
      },
      {
        band: "4",
        description: "Above, plus matches design to structure (graph vs marketplace), mitigates power, and gives a spillover diagnostic."
      }
    ],
    followUps: [
      "How would you decide between cluster randomization and a geo/switchback design?",
      "Clustering halved your power — how do you recover it without running for months?",
      "How would you estimate the size of the spillover itself, not just the direct effect?"
    ]
  },
  {
    id: "EXP_003",
    category: "experiment_stats",
    subcategory: "bias_validity",
    title: "Measuring Impact When You Cannot Randomize",
    difficulty: "medium",
    primaryWeaknessTag: "statistical_reasoning",
    timeboxMinutes: 15,
    companyEmphasis: [
      "airbnb",
      "uber",
      "doordash",
      "stripe"
    ],
    tags: [
      "quasi-experiment",
      "diff-in-diff",
      "synthetic-control",
      "causal-inference",
      "communication"
    ],
    targetSkills: [
      "causal reasoning",
      "measurement under constraints",
      "bias ID",
      "uncertainty communication"
    ],
    prompt: "Your company is rolling out a new pricing / fee structure (or a regulated policy change) that, for legal and operational reasons, can **only launch in one city/market first**. You cannot randomize at the user level, but leadership wants to know whether the change improved the product. How would you measure impact? Name the specific method(s), the comparison you'd use, the main bias risks, and how you'd communicate confidence.",
    expectedFramework: [
      "State why a clean RCT is unavailable",
      "Choose a named quasi-experimental method (diff-in-diff, synthetic control, interrupted time series)",
      "Define a credible comparison and the identifying assumption (parallel pre-trends)",
      "Enumerate confounders (seasonality, local ops, composition shifts)",
      "Frame the conclusion as directional with assumptions stated"
    ],
    sampleAnswerOutline: [
      "Explain why randomization is blocked",
      "Pick diff-in-diff or synthetic control; say which and why",
      "Define comparison market(s) and validate parallel pre-trends",
      "Call out specific confounders",
      "Communicate as best directional estimate with assumptions"
    ],
    sampleStrongAnswer: "Without randomization this is causal inference with weaker identification. With one treated market my\ndefault is difference-in-differences against comparison markets that behaved like it before launch,\nor a synthetic control that builds a weighted \"synthetic\" version of the treated market from a donor\npool — I prefer synthetic control when no single market is a clean match. The load-bearing assumption\nis parallel pre-trends, so I'd plot the pre-period and quantify how closely the comparison tracks the\ntreated market before the change, and run placebo tests. I'd call out confounders: local seasonality,\noperational differences, and composition changes the policy itself causes. I wouldn't present this as\n\"proven,\" but I wouldn't discard it — it's the best directional estimate, with assumptions stated and\na note on what later staggered rollout would raise confidence.",
    commonMistakes: [
      "Pretending observational gives RCT-level certainty",
      "Naive before/after with no comparison group",
      "Naming diff-in-diff without its identifying assumption",
      "Over-apologizing and giving no recommendation"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Proposes simple before/after, or claims it proves causality."
      },
      {
        band: "2",
        description: "Names a quasi-experimental method but skips the parallel-trends assumption."
      },
      {
        band: "3",
        description: "Picks a justified method, names the comparison and the key assumption, lists confounders."
      },
      {
        band: "4",
        description: "Above, plus validates pre-trends/placebo, and communicates confidence honestly with a path to more."
      }
    ],
    followUps: [
      "Diff-in-diff vs synthetic control here — which and why?",
      "How do you test whether pre-trends are parallel enough to trust the design?",
      "If leadership demands a yes/no answer, how do you frame the recommendation honestly?"
    ]
  },
  {
    id: "EXP_004",
    category: "experiment_stats",
    subcategory: "interpretation",
    title: "Novelty Effects and Long-Term vs Short-Term Value",
    difficulty: "hard",
    primaryWeaknessTag: "interpretation",
    timeboxMinutes: 15,
    companyEmphasis: [
      "meta",
      "tiktok",
      "netflix"
    ],
    tags: [
      "novelty-effect",
      "primacy",
      "surrogate-metrics",
      "long-term-value",
      "ship-decision"
    ],
    targetSkills: [
      "experiment interpretation",
      "surrogate-metric reasoning",
      "judgment",
      "communication"
    ],
    prompt: "A two-week A/B test shows a large, highly significant engagement lift on a new feature (+9%, p < 0.001). The PM wants to ship immediately. You suspect part of the lift is a novelty effect that will decay, and the metric leadership actually cares about — long-term retention — is too slow to read in two weeks. How do you tell whether the lift is durable, and how do you make a launch decision when the metric you care about is longer-horizon than your test window?",
    expectedFramework: [
      "Distinguish novelty/primacy decay from durable behavior change",
      "Inspect the time trend of the treatment effect",
      "Compare new vs tenured users and repeat-usage curves",
      "Use a validated surrogate / leading indicator, or a holdback",
      "Recommend ship + long-term holdback, not ship-and-forget"
    ],
    sampleAnswerOutline: [
      "Plot the daily/weekly treatment effect to detect decay",
      "Separate first-time-curiosity usage from repeat usage",
      "Identify a surrogate correlated with long-term retention",
      "Propose a long-term holdback to read the real metric post-launch",
      "Conditional recommendation, not an unconditional ship"
    ],
    sampleStrongAnswer: "A big two-week lift is exactly where novelty hides, so I'd first plot the treatment effect over time\nrather than trusting the pooled average — a steadily decaying daily lift is a novelty signature. I'd\nseparate one-time curiosity usage from repeat usage and check week-2 return rates. Since retention is\ntoo slow to read directly, I'd lean on a surrogate we've historically validated as predictive of\nretention (e.g., week-1 repeat-core-action); if we don't have one, that's its own finding. My\nrecommendation would be conditional: if repeat usage holds and the surrogate moves, I support\nshipping — but I'd keep a small long-term holdback that never gets the feature, so we can measure 4–8\nweek retention after launch and roll back if the durable effect isn't there. Shipping is fine;\nshipping and giving up the ability to measure the real metric is the mistake.",
    commonMistakes: [
      "Trusting the pooled two-week average without the time trend",
      "Treating short-term engagement as a proxy with no validation",
      "Shipping with no long-term holdback",
      "Refusing to ship at all, ignoring the cost of delay"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Ships on the +9% as-is, or rejects it with no plan to measure durability."
      },
      {
        band: "2",
        description: "Names novelty risk but no concrete method to separate it from durable value."
      },
      {
        band: "3",
        description: "Checks the effect-over-time and repeat usage, proposes a surrogate or holdback."
      },
      {
        band: "4",
        description: "Above, plus a conditional ship + long-term holdback and how to validate the surrogate."
      }
    ],
    followUps: [
      "How would you validate that your surrogate actually predicts retention?",
      "What does the daily-effect curve look like for novelty vs a durable win?",
      "How big and how long should the long-term holdback be?"
    ]
  },
  {
    id: "EXP_005",
    category: "experiment_stats",
    subcategory: "bias_validity",
    title: "Peeking, Sequential Testing, and Multiple Comparisons",
    difficulty: "medium",
    primaryWeaknessTag: "statistical_reasoning",
    timeboxMinutes: 12,
    companyEmphasis: [
      "google",
      "meta",
      "microsoft",
      "booking"
    ],
    tags: [
      "peeking",
      "sequential-testing",
      "multiple-comparisons",
      "false-positive",
      "alpha-spending"
    ],
    targetSkills: [
      "statistical rigor",
      "false-positive control",
      "process design",
      "communication"
    ],
    prompt: "A PM watching the dashboard daily messages you on day 4: \"We just crossed p < 0.05 on the primary — can we call it and ship?\" Separately, the dashboard reports 12 metrics, and 2 are significant. What's wrong with both situations statistically, and how would you set up analysis so the team can move fast without fooling itself?",
    expectedFramework: [
      "Repeated peeking inflates Type I error far above 5%",
      "2/12 significant is near what chance produces at α=0.05",
      "Fix peeking: pre-set N/duration, or sequential / always-valid methods",
      "Fix multiplicity: one pre-declared primary; corrections on the rest",
      "Translate into a workable team process"
    ],
    sampleAnswerOutline: [
      "Peeking = many looks = inflated false positives; first crossing isn't a valid stop",
      "2 of 12 at α=0.05 ≈ chance; needs correction",
      "Fix peeking: fixed-horizon, or group-sequential / always-valid p-values",
      "Fix multiplicity: pre-declared primary + Bonferroni/BH on secondaries",
      "Wrap in process: pre-registration + a dashboard that doesn't tempt early stopping"
    ],
    sampleStrongAnswer: "Both manufacture false positives. Peeking: every look where you'd stop if significant is another\nchance to cross by noise, so the real false-positive rate is well above 5% — \"crossed 0.05 on day 4\"\nisn't a valid stop unless we planned for sequential testing. The clean fix is to pre-register sample\nsize and duration and read at the end; if early stopping is a genuine need I'd use group-sequential\nboundaries (O'Brien-Fleming) or always-valid / mSPRT p-values that spend alpha correctly. On the 12\nmetrics: at α=0.05 you'd expect ~1 in 20 significant by chance, so 2 of 12 is barely above noise.\nDeclare one primary metric up front and apply a correction (Bonferroni for a few, Benjamini-Hochberg\nfor many), treating the rest as exploratory. In practice I'd bake this into the team's process:\npre-registered primary + duration, sequential boundaries if needed, and a dashboard that shows CIs\nover time rather than a tempting daily p-value.",
    commonMistakes: [
      "Allowing \"first time it crosses 0.05\" as a stopping rule",
      "Treating any of 12 significant metrics as a win without correction",
      "Over-correcting so the test can never read",
      "Theory only, no usable team process"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Agrees to ship on day 4, or treats the 2 significant metrics as wins."
      },
      {
        band: "2",
        description: "Spots one of the two issues (peeking OR multiplicity), not both."
      },
      {
        band: "3",
        description: "Explains both correctly and offers standard fixes."
      },
      {
        band: "4",
        description: "Above, plus names sequential/always-valid methods, a multiplicity correction, and a team process."
      }
    ],
    followUps: [
      "When is sequential testing worth the complexity vs a fixed horizon?",
      "Bonferroni vs Benjamini-Hochberg — when would you pick each?",
      "How do you keep an eager PM from peeking without blocking transparency?"
    ]
  },
  {
    id: "EXP_006",
    category: "experiment_stats",
    subcategory: "power_variance",
    title: "Designing for Power: MDE and Sample Size",
    difficulty: "medium",
    primaryWeaknessTag: "experiment_design",
    timeboxMinutes: 15,
    companyEmphasis: [
      "google",
      "microsoft",
      "all"
    ],
    tags: [
      "power",
      "mde",
      "sample-size",
      "sensitivity",
      "variance-reduction"
    ],
    targetSkills: [
      "power analysis",
      "pragmatic trade-offs",
      "expectation setting",
      "statistical reasoning"
    ],
    prompt: "A PM wants to test a change they believe will move a conversion metric, but the eligible population is limited and they want results in two weeks. Walk me through how you'd decide whether the test is even worth running. How do you set the minimum detectable effect, compute the sample size, and what do you do if you're under-powered?",
    expectedFramework: [
      "Define MDE from a business-meaningful effect, not a convenient one",
      "Lay out the four-way relationship: effect size, variance, α/power, N",
      "Compute required N / runtime given traffic and baseline rate",
      "If under-powered: raise MDE, reduce variance (CUPED), pick a more sensitive metric, run longer, or don't run",
      "Set expectations: a null from an under-powered test is uninformative"
    ],
    sampleAnswerOutline: [
      "Anchor MDE on the smallest effect worth acting on",
      "Estimate baseline rate + variance, then required N and runtime",
      "Compare against available traffic/time",
      "Mitigations if short: sensitivity, variance reduction, proxy metric, longer run",
      "Be willing to say \"not worth running yet\""
    ],
    sampleStrongAnswer: "First I'd pin down the MDE from the business side: what's the smallest lift that would actually change\na decision? Powering to detect a 0.2% lift nobody would act on is wasted; powering to a meaningful 2%\nis the point. Then it's the standard relationship between effect size, metric variance, significance,\npower, and N — given the baseline conversion rate and variance I'd compute the required sample per arm\nand translate it into runtime at the available traffic. If that runtime exceeds two weeks and the\npopulation is capped, I'd be honest that the test is under-powered, and offer levers: raise the MDE if\nthe smaller effect isn't decision-relevant, reduce variance with CUPED or a less noisy metric, choose\na more sensitive proxy closer to the change, or run longer. The key senior point is that a\nnon-significant result from an under-powered test tells us almost nothing, so I'd rather reset\nexpectations up front than deliver a misleading \"no effect\" in two weeks.",
    commonMistakes: [
      "Setting MDE to whatever the sample can detect, instead of what matters",
      "Forgetting variance / baseline rate in the sizing",
      "Running anyway and interpreting an under-powered null as \"no effect\"",
      "Not offering variance-reduction or proxy-metric levers"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "No power concept; would just run it and read p-value."
      },
      {
        band: "2",
        description: "Mentions sample size but can't connect MDE, variance, and runtime."
      },
      {
        band: "3",
        description: "Sets a business-anchored MDE and computes required N/runtime correctly."
      },
      {
        band: "4",
        description: "Above, plus under-power mitigations (CUPED, proxy, MDE reset) and resets expectations honestly."
      }
    ],
    followUps: [
      "How would you pick the MDE if the PM has no prior on effect size?",
      "How does CUPED reduce the sample you need?",
      "The test will take 6 weeks — how do you decide whether to run it anyway?"
    ]
  },
  {
    id: "EXP_007",
    category: "experiment_stats",
    subcategory: "power_variance",
    title: "Reducing Variance to Read Faster (CUPED)",
    difficulty: "hard",
    primaryWeaknessTag: "statistical_reasoning",
    timeboxMinutes: 12,
    companyEmphasis: [
      "meta",
      "netflix",
      "microsoft",
      "booking"
    ],
    tags: [
      "cuped",
      "variance-reduction",
      "covariate-adjustment",
      "sensitivity"
    ],
    targetSkills: [
      "statistical reasoning",
      "sensitivity",
      "validity awareness",
      "communication"
    ],
    prompt: "Your experiments take longer than the team would like because the primary metric is noisy. A colleague suggests using pre-experiment data to reduce variance (CUPED). Explain intuitively how that works, what it requires to be valid, and where it can mislead you.",
    expectedFramework: [
      "Intuition: remove pre-existing, treatment-independent variation from the outcome",
      "Requirement: a pre-period covariate correlated with the outcome but unaffected by treatment",
      "Effect: lower variance => smaller N / shorter runtime for the same power, unbiased",
      "Pitfalls: using a covariate affected by treatment biases the estimate; weak correlation gives little gain",
      "Note related ideas: stratification, regression adjustment"
    ],
    sampleAnswerOutline: [
      "Explain CUPED intuitively as subtracting predictable pre-period noise",
      "State the validity condition (covariate predates / is unaffected by treatment)",
      "Quantify the benefit (variance reduction ∝ correlation²)",
      "Name the failure mode (post-treatment covariate => bias)"
    ],
    sampleStrongAnswer: "The intuition is that a lot of the variance in the outcome is just users being different from each\nother before the experiment ever started — heavy users vary a lot, light users vary a lot — and that\nvariation has nothing to do with treatment. CUPED uses a pre-experiment covariate, typically the same\nmetric measured before the test, to subtract off that predictable component, so what's left is closer\nto the treatment effect plus less noise. Lower variance means I need a smaller sample or less time for\nthe same power, and done correctly it's unbiased. The hard requirement is that the covariate must\npredate treatment (or otherwise be unaffected by it); if I adjust for something the treatment itself\nchanged, I bias the estimate. The benefit scales with how strongly the covariate correlates with the\noutcome — roughly with the square of that correlation — so for a metric with a strong pre-period\nanalog the gain is large, and for something with no good pre-period signal it barely helps.",
    commonMistakes: [
      "Describing CUPED as \"magic\" with no validity condition",
      "Adjusting for a post-treatment covariate (introduces bias)",
      "Claiming it works regardless of covariate correlation",
      "Confusing variance reduction with changing the estimand"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Can't explain it, or thinks it changes what's being measured."
      },
      {
        band: "2",
        description: "Gives the intuition but misses the validity condition."
      },
      {
        band: "3",
        description: "Correct intuition + the pre-treatment requirement + the runtime benefit."
      },
      {
        band: "4",
        description: "Above, plus the correlation-squared gain and the post-treatment-covariate bias pitfall."
      }
    ],
    followUps: [
      "What covariate would you pick for a conversion-rate experiment?",
      "How would you check that your covariate is unaffected by treatment?",
      "When would CUPED give you almost no benefit?"
    ]
  },
  {
    id: "EXP_008",
    category: "experiment_stats",
    subcategory: "stats_fundamentals",
    title: "Statistics Fundamentals Warm-up",
    difficulty: "easy",
    primaryWeaknessTag: "statistical_reasoning",
    timeboxMinutes: 8,
    companyEmphasis: [
      "google",
      "stripe",
      "all"
    ],
    tags: [
      "confidence-interval",
      "p-value",
      "interpretation",
      "fundamentals"
    ],
    targetSkills: [
      "statistical literacy",
      "precise communication",
      "avoiding common fallacies"
    ],
    prompt: "Quick fundamentals: (1) In plain language, what does a 95% confidence interval mean — and what does it NOT mean? (2) A stakeholder says \"the p-value is 0.04, so there's a 96% chance the feature works.\" Is that correct? (3) Your CI for a lift is [-0.5%, +4.0%]. What do you tell the team?",
    expectedFramework: [
      "CI: a frequentist coverage statement about the procedure, not a probability about this one interval",
      "p-value: P(data this extreme | null true), not P(hypothesis | data)",
      "A CI spanning zero = not significant; communicate the plausible range, not just \"no effect\""
    ],
    sampleAnswerOutline: [
      "Define CI by long-run coverage; reject the \"95% chance the true value is in this interval\" phrasing",
      "Correct the p-value/posterior confusion",
      "Interpret a zero-spanning CI as inconclusive but bounded"
    ],
    sampleStrongAnswer: "A 95% CI means that if we repeated this procedure many times, about 95% of the intervals would contain\nthe true value; for this one interval the parameter is either in it or not, so I avoid saying \"95%\nchance the truth is in here.\" On the p-value: 0.04 is the probability of data at least this extreme if\nthe null were true — it is not the probability the feature works, so the \"96% chance it works\"\nstatement confuses the p-value with a posterior. For the CI [-0.5%, +4.0%]: it spans zero, so we can't\nrule out no effect or a small negative, but the data are also consistent with a meaningful +4%. I'd\ntell the team it's inconclusive, show the plausible range rather than declaring \"no effect,\" and note\nwe're likely under-powered if a +4% would matter.",
    commonMistakes: [
      "\"95% chance the true value is in this interval\"",
      "Reading p=0.04 as \"96% chance it's real\"",
      "Calling a zero-spanning CI \"proven no effect\""
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Gets the CI or p-value definition wrong and repeats the fallacy."
      },
      {
        band: "2",
        description: "Correct on one of the three, shaky on the others."
      },
      {
        band: "3",
        description: "Correct on all three definitions."
      },
      {
        band: "4",
        description: "Above, plus communicates the zero-spanning CI as a bounded, decision-relevant range."
      }
    ],
    followUps: [
      "How would you explain a CI to a non-technical PM in one sentence?",
      "When is a narrow CI around zero more useful than a wide significant one?",
      "What's the difference between statistical and practical significance here?"
    ]
  },
  {
    id: "PROD_001",
    category: "product_case",
    subcategory: "success_metrics",
    title: "Defining a North-Star Metric From Zero",
    difficulty: "medium",
    primaryWeaknessTag: "metric_definition",
    timeboxMinutes: 30,
    companyEmphasis: [
      "meta",
      "tiktok",
      "all"
    ],
    tags: [
      "north-star",
      "metric-design",
      "new-product",
      "segmentation",
      "decision-framing"
    ],
    targetSkills: [
      "metric definition from zero",
      "product sense",
      "trade-off thinking",
      "recommendation framing"
    ],
    prompt: "Your company launched a brand-new, lightweight \"presence / status\" feature in a product with tens of millions of users — users post a short, ephemeral status that expires after 24 hours. There is **no historical baseline**. Thirty days in, heavy users adopt it fast, but some worry it adds noise for everyone else. *Before you look at any numbers:* (1) What user problem might it solve, and what are 2–3 mutually exclusive product intents? (2) For each intent, what **different** north-star metric? (3) What guardrails separate \"creating value\" from \"creating activity\"? (4) If heavy users love it but the base finds it noisy, what's your launch recommendation?",
    expectedFramework: [
      "Clarify the job before naming any metric",
      "Show the metric depends on intent (connection vs retention vs creation)",
      "Build a hierarchy: north star, inputs, guardrails",
      "Segment by type and intensity, not top-line average",
      "Give a decision rule for uneven adoption"
    ],
    sampleAnswerOutline: [
      "Enumerate candidate intents",
      "Map each to a distinct north star (reciprocal interactions, not posts)",
      "Guardrails (mute/hide rate, clutter, cannibalization)",
      "Segment heavy vs casual, creator vs consumer, new vs tenured",
      "Targeted rollout if value is concentrated, not blanket success"
    ],
    sampleStrongAnswer: "I'd refuse to pick a metric until I know the job, because the same feature has different definitions of\nsuccess. Intent A is lightweight connection — north star is reciprocal interaction (statuses that get\na reply/reaction), not raw post volume. Intent B is a retention hook — north star is whether posting\ncorrelates with more frequent return visits, measured against a holdback. Intent C is a low-effort\non-ramp to richer creation — I'd track conversion from status-posting to fuller content. For each I'd\ndefine a hierarchy: north star, 2–3 input metrics, and guardrails — mute/hide/report rate, perceived\nclutter, cannibalization of messaging/sharing. Because adoption is concentrated in heavy users, I'd\nsegment rather than trust the average: is this broadening healthy engagement or just giving power\nusers another surface? If heavy users love it but the base finds it noisy, I would not call it a\nblanket success — I'd recommend a targeted or opt-in rollout, fix the noise, and re-evaluate.",
    commonMistakes: [
      "Picking a metric before defining the job",
      "Raw adoption / post volume as the north star",
      "Forgetting clutter/cannibalization guardrails",
      "Reading the top-line average, ignoring segment concentration"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Picks \"DAU of the feature\" or post volume as success, no intent discussion."
      },
      {
        band: "2",
        description: "Lists metrics but doesn't tie them to distinct intents or add guardrails."
      },
      {
        band: "3",
        description: "Defines intent-specific north stars with a hierarchy and guardrails."
      },
      {
        band: "4",
        description: "Above, plus segments deliberately and gives a defensible recommendation for uneven adoption."
      }
    ],
    followUps: [
      "Leadership says it's a retention play. How does your north star change?",
      "How would you detect whether this cannibalizes existing messaging?",
      "The feature is gameable by spammers — how do you make the metric robust?"
    ]
  },
  {
    id: "PROD_002",
    category: "product_case",
    subcategory: "root_cause",
    title: "Diagnosing Mixed Metric Movement",
    difficulty: "hard",
    primaryWeaknessTag: "product_judgment",
    timeboxMinutes: 25,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "diagnosis",
      "root-cause",
      "cannibalization",
      "durability",
      "decision-making"
    ],
    targetSkills: [
      "root cause analysis",
      "metric interpretation",
      "product judgment",
      "decision making"
    ],
    prompt: "A recently launched feature increased short-term engagement: session time up, shares up, feature usage up. But 4-week retention is flat, and some users report the experience feels noisier. How would you diagnose what's happening, and decide whether this is a success, a warning sign, or in between?",
    expectedFramework: [
      "Separate short-term engagement from durable value",
      "Decompose: source / durability / quality of gains",
      "Check segment concentration and incremental-vs-cannibalized",
      "Combine quantitative and qualitative evidence",
      "Land a conditional recommendation with next test"
    ],
    sampleAnswerOutline: [
      "Resist labeling it a win immediately",
      "Source / durability / quality decomposition",
      "Test cannibalization across surfaces",
      "Take the \"noisier\" signal seriously",
      "Conditional recommendation + what to test next"
    ],
    sampleStrongAnswer: "I'd treat this as a mixed signal. First: are the gains new value or activity moved from another\nsurface? I'd decompose by segment, usage intensity, and behavior type, and explicitly test\ncannibalization by checking whether the gaining surface's growth is offset by declines elsewhere. Flat\n4-week retention is a real flag — exciting short-term without durable behavior change — so I'd inspect\nrepeat-usage curves and whether engaged users return more. I wouldn't dismiss the \"noisier\" feedback;\nif the feature drives more but lower-quality activity, that flips the decision. My recommendation is\nconditional: continue only if the gains are incremental, concentrated in desirable segments, and not\nbought at the cost of experience quality. Otherwise iterate on the noise before scaling.",
    commonMistakes: [
      "Treating engagement growth as automatically good",
      "Ignoring cannibalization between surfaces",
      "Dismissing qualitative feedback as anecdotal",
      "Ending with analysis and no recommendation"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Calls it a win on the engagement gains alone."
      },
      {
        band: "2",
        description: "Notes flat retention but doesn't decompose source/durability/quality."
      },
      {
        band: "3",
        description: "Decomposes properly and tests cannibalization, integrates the qualitative signal."
      },
      {
        band: "4",
        description: "Above, plus a crisp conditional recommendation and a concrete next test."
      }
    ],
    followUps: [
      "What data would make you confident the feature creates real, incremental value?",
      "The PM says retention is too lagging to care about now — how do you respond?",
      "How would you tell whether the feature is attracting low-quality usage?"
    ]
  },
  {
    id: "PROD_003",
    category: "product_case",
    subcategory: "success_metrics",
    title: "Defining Success for a Two-Sided Marketplace Feature",
    difficulty: "medium",
    primaryWeaknessTag: "tradeoff_thinking",
    timeboxMinutes: 30,
    companyEmphasis: [
      "airbnb",
      "uber",
      "doordash",
      "lyft"
    ],
    tags: [
      "marketplace",
      "two-sided",
      "ecosystem-health",
      "liquidity",
      "trade-off"
    ],
    targetSkills: [
      "marketplace metrics",
      "ecosystem thinking",
      "trade-off resolution",
      "judgment"
    ],
    prompt: "You work on a two-sided marketplace (ride-hail, food delivery, short-term lodging, or e-commerce: one side is supply — drivers / couriers / hosts / sellers — the other is demand — riders / eaters / guests / buyers). Your team ships a feature meant to improve **both** supply-side activity/satisfaction and demand-side conversion/engagement. (1) How do you define success **separately** per side and connect them? (2) What ecosystem-health guardrails (low-quality supply, subsidy arbitrage, demand fatigue)? (3) When the sides move in **opposite** directions, what principle decides which to prioritize? (4) What evidence convinces you it's healthy for the whole ecosystem?",
    expectedFramework: [
      "Define value per side, then connect via liquidity / matching quality",
      "Avoid one vanity top-line metric",
      "Guardrails for arbitrage, low-quality supply, demand fatigue",
      "Explicit conflict principle (protect the constrained side / long-term liquidity)",
      "Ecosystem bar = completed high-quality transactions"
    ],
    sampleAnswerOutline: [
      "Supply-side vs demand-side success, defined separately",
      "Connect via match rate / liquidity / completed transactions",
      "Guardrails: arbitrage, supply quality, demand fatigue",
      "Conflict principle: protect scarce side + long-term liquidity",
      "Ecosystem bar: completed high-quality transactions, not raw activity"
    ],
    sampleStrongAnswer: "I'd define success per side first, then connect, because a marketplace can look healthy on one side\nwhile weakening. Supply: does it make participating easier/more rewarding — more active supply, better\nretention, earnings/satisfaction? Demand: does it improve conversion and the quality of the match, not\njust clicks? The connective tissue is liquidity and matching — completed, high-quality transactions\nand match rate capture both sides at once. Guardrails cover subsidy/incentive arbitrage, low-quality\nsupply influx, and demand-side notification fatigue. When the sides conflict — supply activity up but\ndemand match quality down — my default is to protect the **constrained side** and **long-term\nliquidity**: in most marketplaces demand is easier to stimulate than quality supply, and degrading the\nconsumer experience erodes the flywheel, so I'd weight against a supply-only win that hurts demand\nquality. I'd only call it healthy if completed high-quality transactions and both-sides retention\nimprove, not if one side's vanity metric spikes.",
    commonMistakes: [
      "Collapsing a two-sided system into one vanity metric",
      "Optimizing supply activity without checking demand value",
      "Forgetting arbitrage / quality guardrails",
      "No principle for resolving cross-side conflicts"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "One blended metric; no per-side reasoning."
      },
      {
        band: "2",
        description: "Defines both sides but no connective metric or conflict principle."
      },
      {
        band: "3",
        description: "Per-side success + liquidity/match connection + guardrails."
      },
      {
        band: "4",
        description: "Above, plus a defended conflict principle (constrained side) and an ecosystem-health bar."
      }
    ],
    followUps: [
      "Which side do you protect when metrics conflict, and why that one?",
      "How would you detect subsidy/incentive arbitrage in the data?",
      "What single metric, if any, best captures marketplace health here?"
    ]
  },
  {
    id: "PROD_004",
    category: "product_case",
    subcategory: "recommendation_framing",
    title: "Trading Off False Positives vs False Negatives (Payments / Trust & Safety)",
    difficulty: "hard",
    primaryWeaknessTag: "tradeoff_thinking",
    timeboxMinutes: 25,
    companyEmphasis: [
      "airbnb",
      "uber",
      "stripe"
    ],
    tags: [
      "precision-recall",
      "cost-tradeoff",
      "threshold",
      "fraud",
      "decision-framing"
    ],
    targetSkills: [
      "cost/benefit framing",
      "metric translation to dollars",
      "judgment",
      "exec communication"
    ],
    prompt: "You support a payments / trust-and-safety team running a model that blocks fraudulent (or abusive) transactions. Raising the threshold catches more fraud but blocks more legitimate users (false positives); lowering it does the reverse. How would you frame and quantify this trade-off, set the operating point, and make a recommendation the business and risk team can both accept — and how would you communicate it to leadership?",
    expectedFramework: [
      "Translate the threshold into business cost, not precision/recall",
      "Quantify false negative (fraud loss, harm) vs false positive (lost good user, LTV, support)",
      "Costs are asymmetric and segment-dependent",
      "Operating point via expected-cost minimization + guardrails on worst harms",
      "Communicate as a curve + recommended point, not one accuracy number"
    ],
    sampleAnswerOutline: [
      "Reframe from accuracy to expected business cost of each error",
      "Estimate per-error costs (fraud $ vs blocked-good-user LTV + support + trust)",
      "Plot the cost curve; pick the cost-minimizing point",
      "Hard guardrails for catastrophic harm and high-value users",
      "Present trade-off curve + recommendation to leadership"
    ],
    sampleStrongAnswer: "I'd refuse to optimize \"accuracy,\" because the two errors cost very differently. A false negative is\nrealized fraud loss plus chargeback and harm; a false positive is a legitimate user blocked — lost\ntransaction, damaged trust, possibly churned LTV, plus support load. I'd put dollar estimates on each\nand treat the threshold as expected-cost minimization across the precision/recall curve. Crucially the\nfalse-positive cost is segment-dependent — blocking a brand-new low-value account is cheap; blocking a\ntenured high-value customer is very expensive — so I'd argue for segment-specific thresholds or a\nstep-up/verify flow instead of a hard block, converting a hard false positive into a soft one. I'd add\nguardrails for catastrophic harm that override pure cost math. To leadership I'd present a curve —\nfraud caught vs good users blocked at each setting, the dollar cost of each, and the point I recommend\n— so they choose a risk posture with eyes open, not approve an opaque number.",
    commonMistakes: [
      "Optimizing accuracy / one threshold without costing the two errors",
      "Ignoring that false-positive cost varies by segment/tenure",
      "Treating it as purely technical, not a business risk decision",
      "Presenting one number instead of the trade-off curve"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Optimizes accuracy or picks a threshold with no cost reasoning."
      },
      {
        band: "2",
        description: "Distinguishes the two errors but doesn't quantify or segment them."
      },
      {
        band: "3",
        description: "Frames expected-cost minimization with dollarized error costs."
      },
      {
        band: "4",
        description: "Above, plus segment-specific thresholds / step-up flow and an exec-ready trade-off curve."
      }
    ],
    followUps: [
      "How would you estimate the LTV cost of blocking a legitimate user?",
      "When would you prefer a step-up/verify flow over a hard block?",
      "The fraud rate doubles next quarter — how does your operating point move?"
    ]
  },
  {
    id: "PROD_005",
    category: "product_case",
    subcategory: "tradeoffs_guardrails",
    title: "Designing a Metric That Resists Gaming",
    difficulty: "medium",
    primaryWeaknessTag: "metric_definition",
    timeboxMinutes: 20,
    companyEmphasis: [
      "meta",
      "tiktok",
      "all"
    ],
    tags: [
      "goodhart",
      "gaming-resistance",
      "guardrails",
      "metric-design",
      "incentives"
    ],
    targetSkills: [
      "metric design",
      "adversarial thinking",
      "incentive awareness",
      "judgment"
    ],
    prompt: "Leadership wants a single headline metric for the health of a content or community product, and wants teams' goals tied to it. You worry that whatever you pick will be optimized in ways that hit the number while hurting the product (Goodhart's law). How would you choose a metric that's hard to game? Walk through a candidate, how it could be gamed, and how you'd harden it.",
    expectedFramework: [
      "Acknowledge Goodhart: a single target invites optimization to the target",
      "Prefer outcome/value metrics over inflatable activity counts",
      "Red-team the candidate: how to hit it cheaply and badly?",
      "Harden with quality denominators, guardrails, a small balanced set",
      "Pair the headline with counter-metrics"
    ],
    sampleAnswerOutline: [
      "State the gaming risk; activity counts are fragile",
      "Propose a value-anchored metric (retained core-action, quality-weighted)",
      "Red-team it with a concrete gaming strategy",
      "Harden: ratios/quality gates, guardrails, balanced scorecard",
      "Headline + counter-metrics, reviewed for drift"
    ],
    sampleStrongAnswer: "I'd assume any single number tied to incentives will be gamed, so the job is to pick one expensive to\ngame badly and pair it with counter-metrics. I'd avoid raw activity counts — trivial to inflate via\nnotification spam or low-quality content floods — and anchor on a value/outcome metric like retained\nusers who take a core action, or quality-weighted engagement where low-quality interactions don't\ncount. Then I'd red-team it: if I were a team paid on \"weekly active core-action users,\" I'd spam\nre-engagement notifications to juice it while annoying users — so I'd pair guardrails on notification\nvolume and unsubscribe/mute rate, and use a quality gate in the numerator. My real recommendation is\nto resist the single-headline framing: keep one north star for direction but govern it with 2–3\ncounter-metrics (quality, complaints, retention), and review for drift. A metric is only as good as\nthe behavior it survives once people are paid to move it.",
    commonMistakes: [
      "Picking an inflatable activity count as the headline",
      "Not red-teaming from an adversarial optimizer's view",
      "A metric with no paired guardrails / counter-metrics",
      "Ignoring that incentives change behavior, not just measurement"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Picks an activity count; no gaming awareness."
      },
      {
        band: "2",
        description: "Mentions Goodhart but doesn't red-team a concrete metric."
      },
      {
        band: "3",
        description: "Proposes a value-anchored metric and red-teams it with guardrails."
      },
      {
        band: "4",
        description: "Above, plus a balanced headline + counter-metric system and a drift-review plan."
      }
    ],
    followUps: [
      "Give a concrete way your proposed metric could still be gamed.",
      "How do you keep a balanced scorecard from becoming metric soup?",
      "How would you detect that a metric is being gamed in the data?"
    ]
  },
  {
    id: "PROD_006",
    category: "product_case",
    subcategory: "root_cause",
    title: "Sudden Metric Drop: Root-Cause Investigation",
    difficulty: "medium",
    primaryWeaknessTag: "product_judgment",
    timeboxMinutes: 25,
    companyEmphasis: [
      "google",
      "meta",
      "uber",
      "doordash"
    ],
    tags: [
      "root-cause",
      "anomaly",
      "debugging",
      "segmentation",
      "communication"
    ],
    targetSkills: [
      "structured diagnosis",
      "prioritization of hypotheses",
      "data-quality instinct",
      "comms under pressure"
    ],
    prompt: "You wake up to an alert: a core metric (say, daily active users or completed orders) dropped 8% day-over-day. Leadership wants to know what happened and what to do. Walk me through exactly how you'd investigate, in order. How do you avoid jumping to conclusions, and how do you communicate while the investigation is still open?",
    expectedFramework: [
      "First rule out instrumentation / data-pipeline / logging artifacts",
      "Localize: which segment, platform, geo, version, time window?",
      "Distinguish real demand drop from measurement drop and from external causes",
      "Form a ranked hypothesis tree (release, outage, seasonality, external event, data)",
      "Communicate status, confidence, and ETA without premature blame"
    ],
    sampleAnswerOutline: [
      "Confirm it's real (pipeline / logging / definition change first)",
      "Slice by platform, app version, geo, segment, time-of-day to localize",
      "Map to candidate causes: launch/release, outage, external, seasonality",
      "Rank hypotheses by prior + how fast to check",
      "Communicate: \"here's what we know, what we're checking, ETA\""
    ],
    sampleStrongAnswer: "Before chasing product causes I'd confirm the drop is real, because the single most common cause of a\nsudden metric cliff is a logging or pipeline issue — a schema change, a dropped event, a definition\nchange. So step one is data integrity: did event volume or a join change, did anything ship to the\npipeline? Step two is localization: I'd slice by platform, app version, geo, new vs existing users,\nand time-of-day to see if the drop is everywhere or concentrated — a single platform or app version\npoints to a release; one geo points to an outage or external event; a uniform drop points to pipeline\nor something global. That localization maps directly to a ranked hypothesis tree (recent release,\ninfra outage, external event/holiday, seasonality, data artifact), which I'd order by prior\nprobability and by how fast each is to confirm or kill. While it's open I'd communicate clearly:\nwhat we know, the top hypotheses, what we're checking, and an ETA — without naming a culprit before\nthe data supports it. The failure mode is confidently blaming a launch that turns out to be a logging\nbug.",
    commonMistakes: [
      "Jumping to a product/launch explanation before ruling out data issues",
      "Looking only at the aggregate, never slicing to localize",
      "Presenting a single guess as the answer with no confidence level",
      "Going silent until \"certain\" instead of communicating status"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Immediately guesses a cause; no data-integrity or slicing step."
      },
      {
        band: "2",
        description: "Slices the data but skips the instrumentation check or doesn't rank hypotheses."
      },
      {
        band: "3",
        description: "Checks data integrity, localizes by segment, builds a ranked hypothesis tree."
      },
      {
        band: "4",
        description: "Above, plus disciplined comms (status/confidence/ETA) and avoids premature blame."
      }
    ],
    followUps: [
      "The drop is only on one app version — what now?",
      "Event volume looks normal but the metric still dropped — what does that tell you?",
      "How do you decide when to escalate vs keep investigating?"
    ]
  },
  {
    id: "PROD_007",
    category: "product_case",
    subcategory: "estimation_sizing",
    title: "Estimation / Sizing",
    difficulty: "medium",
    primaryWeaknessTag: "product_judgment",
    timeboxMinutes: 15,
    companyEmphasis: [
      "google",
      "airbnb",
      "uber"
    ],
    tags: [
      "estimation",
      "sizing",
      "assumptions",
      "fermi",
      "business-judgment"
    ],
    targetSkills: [
      "structured estimation",
      "explicit assumptions",
      "sanity-checking",
      "communication"
    ],
    prompt: "Leadership is considering investing in a new feature and asks you to size the opportunity before any data exists: roughly how much incremental value (e.g., additional engaged users, orders, or revenue) could it plausibly create in a year? Walk me through your estimate, your assumptions, and how you'd sanity-check it.",
    expectedFramework: [
      "Decompose into a clear formula (population × adoption × frequency × value × incrementality)",
      "State each assumption and where you'd anchor it (comparable features, market data)",
      "Apply an incrementality / cannibalization haircut",
      "Give a range, not a point; sanity-check against a top-down number",
      "Identify which assumption the estimate is most sensitive to"
    ],
    sampleAnswerOutline: [
      "Write the estimate as an explicit product of factors",
      "Anchor each factor with a stated assumption",
      "Discount for incrementality / cannibalization",
      "Produce a range + top-down sanity check",
      "Flag the most sensitive assumption"
    ],
    sampleStrongAnswer: "I'd build it bottom-up as an explicit formula so the assumptions are inspectable: eligible population\n× expected adoption rate × usage frequency × value per use × an incrementality factor. For each I'd\nstate an anchor — eligible population from our user base, adoption from comparable past feature\nlaunches, value per use from current monetization or engagement value — and I'd be explicit that these\nare assumptions, not facts. Then I'd apply an incrementality haircut, because some of the activity\nwould have happened anyway or cannibalizes another surface; a sized opportunity that ignores\ncannibalization is usually 2–3x too optimistic. I'd present a range (conservative / base / optimistic)\nrather than a single number, and sanity-check it top-down against total market or total category value\n— if my bottom-up says we'll add more orders than the category plausibly grows, I've made an error.\nFinally I'd name the assumption the estimate is most sensitive to (usually adoption or incrementality),\nbecause that tells leadership where to reduce uncertainty before committing.",
    commonMistakes: [
      "A single point estimate with no stated assumptions",
      "Forgetting incrementality / cannibalization (overcounting)",
      "No sanity check against a top-down bound",
      "Not flagging which assumption dominates the answer"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Guesses a number with no structure or assumptions."
      },
      {
        band: "2",
        description: "Builds a formula but omits incrementality or any sanity check."
      },
      {
        band: "3",
        description: "Explicit formula + stated assumptions + incrementality haircut + a range."
      },
      {
        band: "4",
        description: "Above, plus a top-down sanity check and identifies the most sensitive assumption."
      }
    ],
    followUps: [
      "Which single assumption would you most want real data on, and why?",
      "How would your estimate change if adoption is half what you assumed?",
      "How do you present this range to a leader who wants one number?"
    ]
  },
  {
    id: "PROD_008",
    category: "product_case",
    subcategory: "recommendation_framing",
    title: "A Strategy-Level North Star",
    difficulty: "hard",
    primaryWeaknessTag: "metric_definition",
    timeboxMinutes: 30,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "north-star",
      "strategy",
      "alignment",
      "leading-vs-lagging",
      "tradeoff"
    ],
    targetSkills: [
      "strategic metric design",
      "alignment thinking",
      "leading/lagging reasoning",
      "judgment"
    ],
    prompt: "A leader asks you to propose a single north-star metric for an entire product line (not one feature) — something teams can align on for the next year. How would you choose it, what makes a good north star vs a bad one, and how would you balance it against revenue and long-term health?",
    expectedFramework: [
      "A good north star captures delivered user value, is a leading indicator of long-term success,",
      "Separate the north star from revenue (lagging) and from vanity activity",
      "Pair it with a small set of guardrails (revenue, retention, trust)",
      "Connect team-level inputs to the north star (a metric tree)",
      "Acknowledge it will evolve; build in review"
    ],
    sampleAnswerOutline: [
      "State the criteria for a good north star",
      "Propose a value-capturing candidate for the product line",
      "Explain why not revenue and not raw activity",
      "Build a metric tree from team inputs to the north star",
      "Pair with guardrails; plan to revisit"
    ],
    sampleStrongAnswer: "A good north star captures the value users actually get, leads long-term success rather than lagging\nit, can be moved by the teams who own it, and resists gaming; a bad one is either a vanity activity\ncount or a pure lagging financial. So I'd anchor on delivered value for this product line — for a\ncontent product, something like weekly users who complete a satisfying core action; for a marketplace,\ncompleted high-quality transactions. I'd deliberately not make revenue the north star, because revenue\nlags and optimizing it directly invites short-term extraction that damages the product — instead\nrevenue is a guardrail alongside retention and trust. The key to alignment is a metric tree: each\nteam's inputs (acquisition, activation, quality, frequency) should ladder up to the north star, so\nlocal goals are coherent with the global one. I'd pair the north star with 2–3 guardrails and commit\nto revisiting it, since a north star that's right this year can become a ceiling next year. The test\nis whether moving it reliably predicts the business getting healthier 6–12 months out.",
    commonMistakes: [
      "Choosing revenue or a vanity activity count as the north star",
      "A metric teams can't actually influence",
      "No guardrails, so the north star gets optimized at the product's expense",
      "No connection from team-level inputs to the top-line metric"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Picks revenue or DAU with no criteria or guardrails."
      },
      {
        band: "2",
        description: "Proposes a reasonable metric but can't justify it against revenue/vanity or add guardrails."
      },
      {
        band: "3",
        description: "States north-star criteria, proposes a value-capturing metric, pairs guardrails."
      },
      {
        band: "4",
        description: "Above, plus a metric tree linking team inputs and a plan to evolve/validate it."
      }
    ],
    followUps: [
      "Why not just use revenue as the north star?",
      "How do you keep a north star from becoming a ceiling that limits the product?",
      "How would you get five teams with different goals to align on it?"
    ]
  },
  {
    id: "MGR_001",
    category: "manager",
    subcategory: "influence",
    title: "Influencing a Decision Without Authority",
    difficulty: "medium",
    primaryWeaknessTag: "influence_without_authority",
    timeboxMinutes: 8,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "influence",
      "stakeholder-alignment",
      "ownership",
      "communication"
    ],
    targetSkills: [
      "influence without authority",
      "stakeholder management",
      "ownership",
      "communication"
    ],
    prompt: "Tell me about a time you drove a high-stakes product, business, or organizational decision where you had no direct authority over the people involved — and where your data-driven conclusion ran against the initial preference of at least one senior stakeholder. Cover: context and stakes, differing views, what you specifically did, the outcome, and what you learned.",
    expectedFramework: [
      "A concrete example with real stakes and resistance",
      "Make the disagreement specific (who wanted what, and why)",
      "Show how you built alignment, not just \"presented data\"",
      "Demonstrate personal ownership and scope",
      "End with measurable impact and genuine reflection"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "We were deciding whether to keep investing in a feature the VP of Product had championed. Engagement\nlooked flat, but my analysis showed it was cannibalizing a higher-retention surface — net-negative,\nwhich contradicted the VP's prior. I had no authority over Product or Eng. Rather than open with \"your\nfeature is hurting us,\" I met the PM and eng lead one-on-one to understand what each optimized for, and\nwe agreed up front on the decision criteria: incremental retention, not raw engagement. Then I built\nthe cannibalization analysis against that shared criterion and pre-socialized it so no one was\nambushed. In the review I framed it as \"here's the bar we agreed on, here's where the feature lands,\nhere are two options.\" We sunset the feature and redirected the team; retention on the core surface\nrecovered ~3% the next quarter. What I learned: aligning on the decision criteria before showing the\nanswer is what turns an analysis into a decision.",
    whatGoodLooksLike: "The candidate describes a decision where teams had different incentives and they did more than produce\nan analysis: identified what each stakeholder cared about, reframed the question into something the\ngroup could decide, and created momentum without relying on title or escalation. A senior answer\nsounds like \"I clarified the decision, aligned people on success criteria, surfaced trade-offs early,\nand helped the group reach a decision that stuck,\" with both business impact and evidence of influence\nat scope.",
    commonMistakes: [
      "A low-stakes example",
      "\"I showed a chart and everyone agreed\" — no real friction",
      "Teamwork without actual influence or tension",
      "Vague, unmeasured impact"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Low stakes, or influence amounted to presenting a chart; no tension."
      },
      {
        band: "2",
        description: "Real situation but vague on personal actions or impact."
      },
      {
        band: "3",
        description: "Clear stakes, specific influence tactics, measurable outcome."
      },
      {
        band: "4",
        description: "Above, plus aligning on criteria first, handling a senior's opposing prior, and a sharp lesson."
      }
    ],
    followUps: [
      "What would have happened if you hadn't stepped in?",
      "How did you know when to push vs compromise?",
      "If you did it again, what would you change?"
    ]
  },
  {
    id: "MGR_002",
    category: "manager",
    subcategory: "conflict",
    title: "Handling a Substantive Disagreement With a Senior Partner",
    difficulty: "hard",
    primaryWeaknessTag: "stakeholder_management",
    timeboxMinutes: 8,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "conflict",
      "judgment",
      "communication-under-tension",
      "executive-maturity"
    ],
    targetSkills: [
      "conflict management",
      "judgment",
      "communication under tension",
      "maturity"
    ],
    prompt: "Tell me about a time you disagreed with a PM, eng lead, or another senior stakeholder about what should happen next on a project. How did you handle the disagreement, what trade-offs were involved, and how did you move it forward — including the effect on the relationship?",
    expectedFramework: [
      "A disagreement with substance (real trade-offs), not personality friction",
      "Represent both perspectives fairly",
      "Reduce the disagreement to testable questions / decision criteria",
      "Show maturity navigating tension",
      "End with outcome AND relationship implications"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "A PM wanted to ship a recommendation change broadly before the holiday peak; I thought we were\nunder-powered and risked a guardrail regression we couldn't detect in time. We optimized for different\nthings — their timeline risk vs my measurement risk — and reviews were getting tense. I de-escalated by\nstating their goal back accurately (\"you need this live before peak, and a delay has real revenue\ncost\") so they knew I wasn't just blocking. Then I reframed the fight into a testable question:\n\"what's the smallest launch that lets us detect a guardrail regression before peak?\" That turned a\nyes/no standoff into a design problem. We agreed on a capped ramp with a pre-set rollback trigger —\nthey got speed, I got a safety net. It shipped on time, the guardrail held, and because I'd represented\ntheir constraint fairly, the PM brought me in earlier on the next launch. What made it work was\nattacking the problem, not the person.",
    whatGoodLooksLike: "The candidate disagrees without becoming defensive or territorial, explains what each side optimized\nfor, how it affected the project, and how they turned conflict into a structured decision — aligning on\ncriteria, identifying what evidence would change minds, or sequencing the riskiest assumption first.\nShows judgment plus preserved/repaired trust, not just diplomacy.",
    commonMistakes: [
      "Making the other stakeholder sound unreasonable",
      "A story with no meaningful trade-off",
      "Confusing conflict resolution with escalating to a manager",
      "Ignoring the relationship aftermath"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Personality clash, or \"I escalated and my manager decided.\""
      },
      {
        band: "2",
        description: "Real disagreement but one side painted as wrong, or no resolution mechanism."
      },
      {
        band: "3",
        description: "Fair framing of both sides, turned into a structured decision, clear outcome."
      },
      {
        band: "4",
        description: "Above, plus explicit trade-off, preserved trust, and a durable working-relationship change."
      }
    ],
    followUps: [
      "Did the other person ever fully agree with you?",
      "How did you keep it from becoming personal?",
      "Have you ever realized later they were right?"
    ]
  },
  {
    id: "MGR_003",
    category: "manager",
    subcategory: "prioritization",
    title: "Prioritization Under Ambiguity (Including Saying No)",
    difficulty: "medium",
    primaryWeaknessTag: "prioritization",
    timeboxMinutes: 8,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "prioritization",
      "decision-making",
      "ambiguity",
      "expectation-setting",
      "managing-up"
    ],
    targetSkills: [
      "prioritization",
      "decision making",
      "ambiguity management",
      "expectation setting"
    ],
    prompt: "Tell me about a time you had to prioritize across competing DS demands — roadmap analysis, experiment support, and an urgent executive request — with limited bandwidth and no obviously correct answer, including a case where you had to **say no or push back** on something a senior leader wanted. How did you decide what came first, what signals you used, and how you communicated it.",
    expectedFramework: [
      "A real, non-obvious trade-off",
      "Explicit decision criteria (impact, urgency, reversibility, dependency, strategic value)",
      "Show what got deprioritized and why",
      "Manage expectations so deprioritized work doesn't vanish silently",
      "Reflect on whether the call held up"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "One quarter I had a committed roadmap analysis, live experiment support three teams depended on, and a\nVP who wanted a one-off deep-dive for a board deck — same week, and I couldn't do all three well. I\nmade the criteria explicit: the experiment support was time-critical and blocking other teams (high\ndependency, irreversible if we missed the read window), the roadmap analysis was high-value but could\nslip a few days, and the VP deck was a point-in-time ask. I protected the experiment support, did a\nscoped-down version of the VP request that answered the core question with existing data, and told the\nVP directly: \"I can give you the key number by Thursday using existing cuts; a full bespoke deep-dive\nwould push the experiment read and put three launches at risk — I'd recommend the lighter version.\"\nThey agreed once the trade-off was explicit. The experiment shipped on time and the deck had what it\nneeded. The lesson: saying no well is really offering a smaller yes plus the honest cost of the\nalternative.",
    whatGoodLooksLike: "The candidate didn't just work longer or \"do everything.\" They evaluated impact, urgency,\nreversibility, dependency, and strategic value, and communicated trade-offs so deprioritized work was\nan explicit choice, not a silent drop. Strong answers include a specific instance of saying no,\nresequencing, or rescoping — including pushing back on a leader.",
    commonMistakes: [
      "A time-management story instead of a prioritization story",
      "\"I did all of it\" — dodging the trade-off",
      "No explicit decision criteria",
      "Omitting how stakeholders were informed"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "\"I worked late and did everything\"; no trade-off."
      },
      {
        band: "2",
        description: "Made a choice but no explicit criteria or stakeholder comms."
      },
      {
        band: "3",
        description: "Clear criteria, explicit deprioritization, communicated trade-offs."
      },
      {
        band: "4",
        description: "Above, plus a real push-back on a leader framed as a smaller yes + honest cost."
      }
    ],
    followUps: [
      "What did you deprioritize, and what was the consequence?",
      "What if your manager had preferred a different direction?",
      "How do you prioritize differently now vs earlier in your career?"
    ]
  },
  {
    id: "MGR_004",
    category: "manager",
    subcategory: "failure",
    title: "Owning a Failure and the Post-Mortem",
    difficulty: "hard",
    primaryWeaknessTag: "leadership_storytelling",
    timeboxMinutes: 8,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "ownership",
      "failure",
      "post-mortem",
      "integrity",
      "learning"
    ],
    targetSkills: [
      "accountability",
      "integrity under pressure",
      "systems thinking",
      "growth"
    ],
    prompt: "Tell me about an analysis, model, experiment readout, or recommendation **you owned that turned out to be wrong** — and that others acted on. What was the impact, how did you handle it once you realized, and what did you change afterward so it wouldn't happen again?",
    expectedFramework: [
      "A real failure the candidate owned (not a humblebrag or someone else's fault)",
      "Honest about impact and their role",
      "Show how they surfaced it (especially if no one would have caught it)",
      "Move from individual fix to systemic prevention",
      "Genuine, specific learning"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "I once reported that a new onboarding flow lifted activation ~5%, and the team scaled it. Weeks later I\nnoticed activation wasn't holding, and on review found a definition bug: my query counted a logging\nevent the new flow fired twice, inflating the metric. The real lift was near flat. It was my analysis\nand my mistake, and a team had already invested in scaling it. I raised it immediately — told the PM\nand my manager that day with corrected numbers, before anyone asked, because the cost of them building\nfurther on a wrong number was worse than the embarrassment. We paused the rollout and reallocated.\nThen I focused on prevention, not just the one fix: I added event-definition validation and a sanity\ncheck comparing new-flow event counts against a baseline to our standard analysis template, and\ninstituted peer review for any readout leadership would act on. What I learned specifically is that the\nhighest-leverage thing I own isn't the analysis, it's the definitions underneath it — and that\nsurfacing a mistake fast is a credibility builder, not a cost.",
    whatGoodLooksLike: "The candidate takes real ownership without deflecting, is honest about consequences, and proactively\nraised the error rather than hoping it went unnoticed. The strongest answers turn the failure into a\nsystemic change (process, checks, definitions) and reflect specifically rather than with a cliché.",
    commonMistakes: [
      "A fake failure (\"I worked too hard\") or blaming others",
      "Owning the error but showing no proactive disclosure",
      "Fixing the one instance with no systemic prevention",
      "A generic, non-specific lesson"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Fake/deflected failure, or blames others."
      },
      {
        band: "2",
        description: "Owns a real mistake but vague on disclosure or fix."
      },
      {
        band: "3",
        description: "Owns it, disclosed proactively, fixed the issue, honest about impact."
      },
      {
        band: "4",
        description: "Above, plus a systemic prevention and a specific, non-cliché lesson."
      }
    ],
    followUps: [
      "How did you decide whom to tell, and how fast?",
      "What did the systemic fix actually catch later, if anything?",
      "How do you balance speed of analysis against this kind of rigor?"
    ]
  },
  {
    id: "MGR_005",
    category: "manager",
    subcategory: "managing_up",
    title: "Managing Up: Pushing Back on Leadership",
    difficulty: "hard",
    primaryWeaknessTag: "managing_up",
    timeboxMinutes: 8,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "managing-up",
      "courage",
      "data-driven",
      "communication",
      "judgment"
    ],
    targetSkills: [
      "managing up",
      "candor with respect",
      "judgment on when to escalate vs commit"
    ],
    prompt: "Tell me about a time you disagreed with your own manager or a senior leader's direction — where they had decided something and you believed the data or the right call was different. How did you raise it, and what happened?",
    expectedFramework: [
      "Real disagreement with a person above you, with stakes",
      "Raised it directly but respectfully, with evidence and framing",
      "Showed judgment about timing, forum (private first), and how hard to push",
      "Demonstrated \"disagree and commit\" if overruled",
      "Honest outcome, including times you were wrong"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "My director wanted to commit the team to a metric goal I thought was the wrong target — it optimized\nshort-term clicks over the retention the org actually needed. Rather than challenge it in the team\nmeeting, I asked for 15 minutes privately first, came with a short analysis showing how the click goal\nhad historically diverged from retention, and proposed an alternative target plus a guardrail. I framed\nit as \"I want us to hit something that still looks good in two quarters,\" not \"your goal is wrong.\" She\npushed back on part of it, and we landed on a blended target closer to mine with her guardrail added.\nThere have also been times I raised a concern, was overruled, and then disagreed-and-committed — and\ntwice the leader turned out to be right because they had context I didn't. What I've learned is to\nbring the disagreement early and privately, anchored on the shared outcome, and to commit fully once\nthe decision is made.",
    whatGoodLooksLike: "The candidate shows they can challenge authority with data and respect, chose the right forum and\ntiming, and made the leader's decision easier rather than just objecting. Crucially they show maturity\nabout when to keep pushing vs disagree-and-commit, and don't portray the leader as a fool.",
    commonMistakes: [
      "No real example (always deferred to leadership)",
      "Challenging a leader publicly/aggressively with no framing",
      "Never able to disagree-and-commit; relitigating after the decision",
      "Painting the leader as incompetent"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Never pushed back, or did it disrespectfully/publicly with no evidence."
      },
      {
        band: "2",
        description: "Raised a disagreement but no judgment about forum/timing or no commit-after."
      },
      {
        band: "3",
        description: "Respectful, evidence-based push-back in the right forum, honest outcome."
      },
      {
        band: "4",
        description: "Above, plus disagree-and-commit maturity and acknowledging times the leader was right."
      }
    ],
    followUps: [
      "How did you decide this was worth pushing on vs letting go?",
      "What did you do once the decision was made against you?",
      "How do you push back without damaging the relationship?"
    ]
  },
  {
    id: "MGR_006",
    category: "manager",
    subcategory: "mentorship",
    title: "Mentorship and Growing Others",
    difficulty: "medium",
    primaryWeaknessTag: "mentorship",
    timeboxMinutes: 7,
    isBehavioral: true,
    companyEmphasis: [
      "all"
    ],
    tags: [
      "mentorship",
      "coaching",
      "team-impact",
      "scaling-yourself",
      "leadership"
    ],
    targetSkills: [
      "mentorship",
      "scaling impact beyond yourself",
      "feedback",
      "judgment"
    ],
    prompt: "Tell me about a time you helped another data scientist or analyst grow — through mentoring, raising the bar on their work, or unblocking them. What did you actually do, and what changed for them and for the team?",
    expectedFramework: [
      "A specific person and a specific growth gap",
      "What the candidate did beyond doing the work for them",
      "Evidence the person actually improved (not just felt good)",
      "Team-level or scaled impact, not a one-off favor",
      "Reflection on their mentoring approach"
    ],
    sampleAnswerOutline: [],
    sampleStrongAnswer: "A newer analyst on an adjacent team kept producing analyses that were technically correct but didn't\ndrive decisions — lots of charts, no recommendation. Instead of rewriting their work, I paired with\nthem on two analyses and taught a simple structure: lead with the decision and recommendation, then\nsupport it, then caveats. I gave direct feedback that the gap wasn't their SQL, it was framing for an\naudience. Over a couple of months their docs changed noticeably — PMs started citing their analyses in\ndecisions, and they began reviewing others' work the same way. I turned the structure into a one-page\n\"analysis review\" checklist the team adopted, so the impact outlived the one-on-one coaching. What I\nlearned is that the highest-leverage mentoring fixes a repeatable pattern, not a single deliverable.",
    whatGoodLooksLike: "The candidate scaled their impact through someone else rather than just doing the work, gave concrete\nand sometimes hard feedback, and can point to a real change in the other person's capability. Senior\nanswers show this lifted the team's bar (a reusable standard, a practice others adopted), not just one\nperson on one task.",
    commonMistakes: [
      "\"I just did the hard parts for them\" (doing, not growing)",
      "No evidence the person actually improved",
      "A one-off favor with no lasting or team-level impact",
      "Vague (\"I'm always happy to help juniors\")"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Vague, or just did the work for them."
      },
      {
        band: "2",
        description: "Real help but no evidence of lasting improvement."
      },
      {
        band: "3",
        description: "Concrete coaching with a clear change in the person's capability."
      },
      {
        band: "4",
        description: "Above, plus scaled it to a team standard/practice and a thoughtful reflection."
      }
    ],
    followUps: [
      "How did you give the hard feedback without discouraging them?",
      "How did you know your mentoring actually worked?",
      "How do you decide when to coach vs just fix it yourself?"
    ]
  },
  {
    id: "SQL_001",
    category: "sql",
    subcategory: "retention_cohort",
    title: "7-Day Retention by Signup Cohort",
    difficulty: "medium",
    primaryWeaknessTag: "sql_rigor",
    timeboxMinutes: 20,
    schemaText: "users(user_id BIGINT, signup_date DATE)\nevents(user_id BIGINT, event_ts TIMESTAMP, event_type STRING)   -- multiple rows/user/day, may contain dupes",
    companyEmphasis: [
      "all"
    ],
    tags: [
      "retention",
      "cohort",
      "window",
      "date-math",
      "data-quality"
    ],
    targetSkills: [
      "precise metric definition",
      "date arithmetic",
      "dedupe",
      "cohorting"
    ],
    prompt: "Using these tables, write SQL to compute **7-day retention by signup week**: of users who signed up in a given week, the share who performed any event exactly on day 7 after signup (or within the first 7 days — state which you're computing and why). Define \"retained\" precisely. Then handle: duplicate events, users with no events, and the boundary (is day 0 counted?).",
    expectedFramework: [
      "State the exact retention definition and the day-0 convention up front",
      "Cohort users by signup week",
      "Join events with a date-diff filter to the retention window",
      "Dedupe to one row per user per relevant day before counting",
      "Use a LEFT JOIN so zero-activity users count in the denominator"
    ],
    sampleAnswerOutline: [
      "Define retained = ≥1 qualifying event in the window; day 0 = signup day, day 7 = signup + 7",
      "Cohort = DATE_TRUNC('week', signup_date)",
      "DISTINCT user_id in numerator to avoid duplicate-event inflation",
      "Denominator = all users in the cohort (LEFT JOIN)",
      "retention = numerator / denominator per cohort week"
    ],
    sampleStrongAnswer: "```sql\nWITH cohort AS (\n  SELECT user_id,\n         DATE_TRUNC('week', signup_date) AS cohort_week,\n         signup_date\n  FROM users\n),\nretained AS (\n  SELECT DISTINCT c.user_id, c.cohort_week\n  FROM cohort c\n  JOIN events e\n    ON e.user_id = c.user_id\n   -- \"within first 7 days\" definition; day 0 = signup day\n   AND e.event_ts >= c.signup_date\n   AND e.event_ts <  c.signup_date + INTERVAL '8 days'\n)\nSELECT c.cohort_week,\n       COUNT(DISTINCT c.user_id)                          AS cohort_size,\n       COUNT(DISTINCT r.user_id)                          AS retained_users,\n       COUNT(DISTINCT r.user_id)::FLOAT\n         / NULLIF(COUNT(DISTINCT c.user_id), 0)           AS d7_retention\nFROM cohort c\nLEFT JOIN retained r\n  ON r.user_id = c.user_id AND r.cohort_week = c.cohort_week\nGROUP BY c.cohort_week\nORDER BY c.cohort_week;\n```\n\nI'd state explicitly that I'm computing \"any activity within the first 7 days, day 0 = signup\", that\n`DISTINCT user_id` defends against duplicate events, and that the `LEFT JOIN` keeps zero-event users in\nthe denominator. If the intended definition were day-7-exact I'd change the date filter to a single-day\nwindow.",
    commonMistakes: [
      "Not defining the day-0 convention (off-by-one in the window)",
      "COUNT(*) instead of COUNT(DISTINCT user_id) — duplicate events inflate retention",
      "INNER JOIN dropping zero-activity users from the denominator",
      "Cohorting by signup_date instead of signup week when asked for weekly"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Wrong definition or counts duplicates; retention > 100% possible."
      },
      {
        band: "2",
        description: "Roughly correct but off-by-one on the window or drops zero-event users."
      },
      {
        band: "3",
        description: "Correct, deduped, LEFT JOIN denominator, definition stated."
      },
      {
        band: "4",
        description: "Above, plus handles the variation drills and defends the definition choice."
      }
    ],
    followUps: [
      "How would you change this for rolling retention?",
      "Late-arriving events land a day after they occurred — how does that affect this?",
      "How would you compute retention curves for days 1 through 30 efficiently?"
    ]
  },
  {
    id: "SQL_002",
    category: "sql",
    subcategory: "funnel_conversion",
    title: "Clean Funnel With Dedupe and Correct Ordering",
    difficulty: "medium",
    primaryWeaknessTag: "data_cleaning",
    timeboxMinutes: 20,
    schemaText: "events(user_id BIGINT, event_ts TIMESTAMP, step STRING)  -- step in ('view','add_to_cart','checkout','purchase')\n-- events can be duplicated and can arrive out of order; users may repeat steps",
    companyEmphasis: [
      "airbnb",
      "uber",
      "stripe",
      "all"
    ],
    tags: [
      "funnel",
      "dedupe",
      "ordering",
      "window-functions",
      "data-quality"
    ],
    targetSkills: [
      "ordered funnels",
      "dedupe",
      "window functions",
      "edge-case rigor"
    ],
    prompt: "Compute a conversion funnel view -> add_to_cart -> checkout -> purchase: for each step, the number of users who reached it, and the step-to-step conversion rate. Requirements: (1) count each user once per step, (2) only count a step if the user completed the **prior** step **before** it (correct ordering), (3) be robust to duplicate and out-of-order events.",
    expectedFramework: [
      "Reduce to first timestamp per user per step (handles dupes/out-of-order)",
      "Enforce ordering: each step's timestamp must exceed the prior step's",
      "Count distinct users at each ordered step",
      "Compute step-to-step ratios with NULLIF guard"
    ],
    sampleAnswerOutline: [
      "MIN(event_ts) per user per step to dedupe",
      "Pivot to one row per user with first-step timestamps",
      "Ordered conditions: t_view < t_cart < t_checkout < t_purchase",
      "Count users meeting each cumulative condition; divide for rates"
    ],
    sampleStrongAnswer: "```sql\nWITH first_step AS (\n  SELECT user_id, step, MIN(event_ts) AS ts\n  FROM events\n  WHERE step IN ('view','add_to_cart','checkout','purchase')\n  GROUP BY user_id, step\n),\npivoted AS (\n  SELECT user_id,\n         MIN(CASE WHEN step='view'        THEN ts END) AS t_view,\n         MIN(CASE WHEN step='add_to_cart' THEN ts END) AS t_cart,\n         MIN(CASE WHEN step='checkout'    THEN ts END) AS t_checkout,\n         MIN(CASE WHEN step='purchase'    THEN ts END) AS t_purchase\n  FROM first_step\n  GROUP BY user_id\n)\nSELECT\n  COUNT(*) FILTER (WHERE t_view IS NOT NULL)                                          AS s1_view,\n  COUNT(*) FILTER (WHERE t_cart     > t_view)                                         AS s2_cart,\n  COUNT(*) FILTER (WHERE t_checkout > t_cart     AND t_cart > t_view)                 AS s3_checkout,\n  COUNT(*) FILTER (WHERE t_purchase > t_checkout AND t_checkout > t_cart\n                                                 AND t_cart > t_view)                 AS s4_purchase\nFROM pivoted;\n```\n\nTaking `MIN(event_ts)` per user per step collapses duplicates and out-of-order noise to the first\nlegitimate occurrence, and the strict `>` ordering conditions enforce that each step happened after the\nprior one, so a user who \"purchased\" before ever viewing (bad data) isn't counted. Conversion rates are\neach step divided by the previous with a `NULLIF` guard. For the time-bounded variation I'd add\n`t_cart < t_view + INTERVAL '24 hours'` etc.",
    commonMistakes: [
      "Counting raw events, so duplicates inflate funnel steps",
      "Ignoring ordering (counting checkout without a prior cart)",
      "Not handling out-of-order timestamps",
      "Division without NULLIF, risking divide-by-zero"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Counts raw events; no dedupe or ordering."
      },
      {
        band: "2",
        description: "Dedupes but doesn't enforce step ordering."
      },
      {
        band: "3",
        description: "Dedupes, enforces ordering, distinct users per step, safe ratios."
      },
      {
        band: "4",
        description: "Above, plus handles a variation (time-bounded or segmented) cleanly."
      }
    ],
    followUps: [
      "How would you enforce that each step happens within 24h of the prior?",
      "How would you break the funnel down by acquisition channel?",
      "What if a user can go through the funnel multiple times — how do you count that?"
    ]
  },
  {
    id: "PY_001",
    category: "python_coding",
    subcategory: "pandas_manipulation",
    title: "Retention in pandas From an Event DataFrame",
    difficulty: "medium",
    primaryWeaknessTag: "python_coding",
    timeboxMinutes: 20,
    schemaText: "users:  DataFrame[user_id, signup_date]            # signup_date as datetime\nevents: DataFrame[user_id, event_ts, event_type]   # event_ts as datetime; may contain duplicates",
    companyEmphasis: [
      "google",
      "airbnb",
      "stripe"
    ],
    tags: [
      "pandas",
      "retention",
      "merge",
      "groupby",
      "data-quality"
    ],
    targetSkills: [
      "pandas fluency",
      "dedupe",
      "merge semantics",
      "clear explanation"
    ],
    prompt: "Write a pandas function `d7_retention_by_week(users, events)` that returns 7-day retention (any activity within the first 7 days, day 0 = signup) by signup week. Handle duplicate events and zero-activity users. Explain your steps as you go.",
    expectedFramework: [
      "Merge events to users; compute day offset = (event_ts.date - signup_date).days",
      "Filter to 0 <= offset < 8",
      "Deduplicate to one retained flag per user",
      "Left-merge back so zero-activity users count in the denominator",
      "Group by signup week; retained / cohort size"
    ],
    sampleAnswerOutline: [
      "merge events with users on user_id",
      "Vectorized day-diff and a boolean window mask",
      "groupby(user_id) -> retained flag (any qualifying event)",
      "Reindex against all users (fillna False) for the denominator",
      "dt.to_period('W') cohort, then mean of the flag"
    ],
    sampleStrongAnswer: "```python\nimport pandas as pd\n\ndef d7_retention_by_week(users: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:\n    u = users.copy()\n    u[\"signup_date\"] = pd.to_datetime(u[\"signup_date\"]).dt.normalize()\n    e = events.merge(u[[\"user_id\", \"signup_date\"]], on=\"user_id\", how=\"inner\")\n    e[\"event_ts\"] = pd.to_datetime(e[\"event_ts\"])\n    # day 0 = signup day; window = first 7 days\n    offset_days = (e[\"event_ts\"].dt.normalize() - e[\"signup_date\"]).dt.days\n    e[\"in_window\"] = (offset_days >= 0) & (offset_days < 8)\n    # one retained flag per user (dedupe-safe: .any() ignores duplicate rows)\n    retained = e.groupby(\"user_id\")[\"in_window\"].any()\n    u[\"retained\"] = u[\"user_id\"].map(retained).fillna(False)   # zero-activity -> False\n    u[\"cohort_week\"] = u[\"signup_date\"].dt.to_period(\"W\")\n    out = (u.groupby(\"cohort_week\")\n             .agg(cohort_size=(\"user_id\", \"size\"),\n                  retained_users=(\"retained\", \"sum\"))\n             .reset_index())\n    out[\"d7_retention\"] = out[\"retained_users\"] / out[\"cohort_size\"]\n    return out\n```\n\nThe dedupe is handled implicitly: `.any()` per user is unaffected by duplicate event rows. Mapping the\nretained flag back onto the full `users` frame and `fillna(False)` keeps zero-activity users in the\ndenominator, which is the most common bug. I'd mention this mirrors the SQL version one-to-one, which\nmakes it easy to cross-check.",
    commonMistakes: [
      "Counting rows so duplicates inflate the numerator",
      "Dropping zero-activity users (inner-merge denominator bug)",
      "Off-by-one on the day-0 / day-7 boundary",
      "Slow per-user Python loops instead of vectorized ops"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Incorrect result, loops, or duplicates inflate retention."
      },
      {
        band: "2",
        description: "Roughly right but mishandles dedupe or zero-activity users."
      },
      {
        band: "3",
        description: "Correct, vectorized, dedupe-safe, zero-activity users retained."
      },
      {
        band: "4",
        description: "Above, plus clean structure, boundary stated, and cross-checks against SQL logic."
      }
    ],
    followUps: [
      "How would you generalize this to day-N retention with N a parameter?",
      "The events frame is 500M rows — what changes?",
      "How would you unit-test this function?"
    ]
  },
  {
    id: "PY_002",
    category: "python_coding",
    subcategory: "stat_simulation",
    title: "Simulate an A/B Test to Estimate Power",
    difficulty: "hard",
    primaryWeaknessTag: "statistical_simulation",
    timeboxMinutes: 20,
    companyEmphasis: [
      "google",
      "stripe",
      "netflix"
    ],
    tags: [
      "simulation",
      "power",
      "hypothesis-test",
      "bootstrap-style",
      "numpy"
    ],
    targetSkills: [
      "statistical simulation",
      "power concept",
      "clean code",
      "explanation"
    ],
    prompt: "Without using a closed-form power formula, write a simulation that estimates the **statistical power** of a two-proportion A/B test given: baseline conversion rate `p`, relative lift `mde`, sample size per arm `n`, and significance level `alpha`. Explain what power means and how the simulation estimates it.",
    expectedFramework: [
      "Power = P(reject null | the alternative is true)",
      "Simulate many experiments under the true lift, run the test each time, fraction significant = power",
      "Use a correct two-proportion test (z-test or chi-square)",
      "Vectorize over simulations for speed; enough reps for a stable estimate"
    ],
    sampleAnswerOutline: [
      "Treatment true rate = p*(1+mde)",
      "For each of N_sim trials: draw Binomial successes for control and treatment",
      "Compute two-proportion z-test p-value; flag p < alpha",
      "Power = mean(flags); optionally return a CI on the estimate"
    ],
    sampleStrongAnswer: "```python\nimport numpy as np\nfrom scipy import stats\n\ndef simulate_power(p, mde, n, alpha=0.05, n_sim=20000, seed=0):\n    \"\"\"Estimate power of a two-proportion test via simulation.\n    Power = P(reject H0 | true relative lift = mde).\"\"\"\n    rng = np.random.default_rng(seed)\n    p_t = p * (1 + mde)\n    # vectorized: one Binomial draw per simulated experiment per arm\n    x_c = rng.binomial(n, p,   size=n_sim)\n    x_t = rng.binomial(n, p_t, size=n_sim)\n    pc, pt = x_c / n, x_t / n\n    p_pool = (x_c + x_t) / (2 * n)\n    se = np.sqrt(p_pool * (1 - p_pool) * (2.0 / n))\n    z = (pt - pc) / se\n    pvals = 2 * (1 - stats.norm.cdf(np.abs(z)))   # two-sided\n    power = np.mean(pvals < alpha)\n    # Monte Carlo standard error on the power estimate\n    mc_se = np.sqrt(power * (1 - power) / n_sim)\n    return {\power\: power, \mc_se\: mc_se}\n```\n\nPower is the probability the test correctly detects a real effect of the assumed size. The simulation\nencodes the alternative (treatment rate `p*(1+mde)`), runs the experiment `n_sim` times, applies the\nsame two-proportion z-test we'd use in production, and the fraction of runs that reach significance is\nthe power. I vectorize the draws so it's fast, and I report a Monte Carlo standard error so we know the\nestimate itself is stable. I'd sanity-check it against the closed-form formula for one case, and note\nthat if I expected to peek or run multiple metrics I'd build that into the simulation rather than this\nsingle-look version.",
    commonMistakes: [
      "Confusing power with significance / Type I error",
      "Simulating under the null (gives alpha, not power)",
      "A wrong or hand-rolled incorrect two-proportion test",
      "Too few simulations / no sense of the estimate's own noise"
    ],
    scoringRubric: [
      {
        band: "0–1",
        description: "Wrong concept (simulates the null) or a broken test."
      },
      {
        band: "2",
        description: "Right idea but a coding/statistical error or far too few reps."
      },
      {
        band: "3",
        description: "Correct simulation under the alternative with a valid test and enough reps."
      },
      {
        band: "4",
        description: "Above, plus vectorized, reports Monte Carlo SE, and sanity-checks vs closed form."
      }
    ],
    followUps: [
      "How many simulations do you need for a power estimate accurate to ±1%?",
      "How would you extend this to estimate the sample size needed for 80% power?",
      "How would you adapt it to a continuous metric instead of a proportion?"
    ]
  }
];
