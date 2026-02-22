// lib/edge/patterns.ts

export type Load = "low" | "med" | "high";
export type Tone = "soft" | "sharp" | "sober" | "playful";

export type Moment =
  | "typing"
  | "rewriting"
  | "about_to_send"
  | "about_to_reply"
  | "delaying_reply"
  | "overexplaining"
  | "politeness_loop"
  | "softening_opinion"
  | "validation_seek"
  | "offering_help_drained"
  | "filling_silence"
  | "avoiding_hard_talk"
  | "impulse_react"
  | "open_loop_decision";

export type EdgeTags = {
  decision_load: Load;
  emotional_load: Load;
  social_load: Load;
  conflict_risk: Load;
  urgency: Load;
  tone: Tone;
};

export type Pattern = {
  id: string;
  label: string;
  moments: Moment[];
  signAffinity: Partial<Record<string, number>>;
  tagsHint: Partial<EdgeTags>;
  starters: string[];
  blueprints: string[];
  avoid: string[];
};

const COMMON_AVOID = [
  "universe",
  "energy",
  "manifest",
  "destiny",
  "alignment",
  "vibes",
  "journey",
  "healing",
  "blessed",
  "grateful",
];

export const PATTERNS_30: Pattern[] = [

/* =========================
REWRITING
========================= */

{
id: "rewrite_01",
label: "Send without editing again",
moments: ["rewriting","about_to_send"],
signAffinity: { gemini:3, virgo:3, libra:2 },
tagsHint: { social_load:"med", urgency:"med" },
starters:["Send","Stop","Keep"],
blueprints:[
"Send the current version. Do not edit again.",
"Hit send on the version already on screen.",
"Stop editing. Send the message as it is.",
"Send the sentence exactly as it stands now.",
"Do not touch it again. Send immediately.",
],
avoid: COMMON_AVOID,
},

{
id:"rewrite_02",
label:"Don't soften first line",
moments:["typing","rewriting"],
signAffinity:{ libra:2, cancer:2, virgo:2 },
tagsHint:{ conflict_risk:"med" },
starters:["Keep","Don't","Send"],
blueprints:[
"Keep the first sentence exactly as written.",
"Do not soften the opening line.",
"Send the direct version without cushioning.",
"Leave the first line unchanged. Send it.",
"Do not dilute the opening statement.",
],
avoid:COMMON_AVOID,
},

{
id:"rewrite_03",
label:"Stop adding more explanation",
moments:["rewriting","typing"],
signAffinity:{ gemini:3, virgo:2 },
tagsHint:{ decision_load:"med" },
starters:["Stop","Cut"],
blueprints:[
"Stop adding another sentence to explain yourself.",
"Cut the extra line before sending.",
"End the message where it already ends.",
"Do not extend the explanation further.",
"Send without adding new context.",
],
avoid:COMMON_AVOID,
},

/* =========================
OVEREXPLAINING
========================= */

{
id:"explain_01",
label:"Answer once only",
moments:["about_to_reply","overexplaining"],
signAffinity:{ libra:3, gemini:2 },
tagsHint:{ decision_load:"med" },
starters:["Answer","Say"],
blueprints:[
"Answer once in your next reply.",
"State it once. Do not explain further.",
"End your reply after the first statement.",
"Do not justify yourself in the next message.",
"Say it once. Leave it there.",
],
avoid:COMMON_AVOID,
},

{
id:"explain_02",
label:"Don't preempt objections",
moments:["typing","about_to_reply"],
signAffinity:{ libra:3 },
tagsHint:{ conflict_risk:"high" },
starters:["Wait","Stop"],
blueprints:[
"Wait for questions before explaining anything else.",
"Do not answer concerns nobody raised.",
"Stop defending before they respond.",
"Let your statement stand without defense.",
"Do not anticipate their reaction.",
],
avoid:COMMON_AVOID,
},

{
id:"explain_03",
label:"Stop narrating thinking",
moments:["typing","about_to_reply"],
signAffinity:{ virgo:3 },
tagsHint:{ decision_load:"med" },
starters:["State","Give"],
blueprints:[
"Give the conclusion without the reasoning.",
"State the outcome only in your reply.",
"Do not describe how you reached it.",
"Send the answer without background.",
"Deliver the result without explanation.",
],
avoid:COMMON_AVOID,
},

/* =========================
DELAYING REPLIES
========================= */

{
id:"delay_01",
label:"Reply immediately",
moments:["delaying_reply"],
signAffinity:{ cancer:2, pisces:2 },
tagsHint:{ urgency:"high" },
starters:["Reply","Send"],
blueprints:[
"Reply now. Do not delay further.",
"Send the reply waiting in your mind.",
"Close the open conversation today.",
"Answer immediately without refining.",
"Send the reply before hesitation grows.",
],
avoid:COMMON_AVOID,
},

{
id:"delay_02",
label:"Don't wait for readiness",
moments:["delaying_reply"],
signAffinity:{ cancer:2 },
tagsHint:{ emotional_load:"med" },
starters:["Send","Reply"],
blueprints:[
"Reply before you feel completely ready.",
"Send the message without emotional certainty.",
"Do not wait for the perfect moment.",
"Reply before doubt expands further.",
"Send it even without confidence.",
],
avoid:COMMON_AVOID,
},

{
id:"delay_03",
label:"Close open loop decision",
moments:["open_loop_decision"],
signAffinity:{ capricorn:2 },
tagsHint:{ decision_load:"high" },
starters:["Choose","Confirm"],
blueprints:[
"Choose one option and close the loop.",
"Confirm the decision and stop revisiting it.",
"Lock the choice without reopening it.",
"Select and finalize the direction today.",
"End the indecision with one clear choice.",
],
avoid:COMMON_AVOID,
},

/* =========================
HARD TALK
========================= */

{
id:"hardtalk_01",
label:"Ask directly",
moments:["avoiding_hard_talk"],
signAffinity:{ scorpio:3 },
tagsHint:{ conflict_risk:"high" },
starters:["Ask","Say"],
blueprints:[
"Ask the direct question you are avoiding.",
"Say the uncomfortable truth clearly.",
"Address the issue without hinting.",
"Speak the concern plainly.",
"Ask without softening the words.",
],
avoid:COMMON_AVOID,
},

{
id:"hardtalk_02",
label:"Hold boundary cleanly",
moments:["about_to_reply"],
signAffinity:{ capricorn:2 },
tagsHint:{ conflict_risk:"med" },
starters:["State","Keep"],
blueprints:[
"State your boundary without explanation.",
"Keep your limit firm in your reply.",
"Say no without elaborating.",
"Do not negotiate your boundary today.",
"Maintain the line without adjusting it.",
],
avoid:COMMON_AVOID,
},

{
id:"hardtalk_03",
label:"No apology preface",
moments:["typing"],
signAffinity:{ libra:2 },
tagsHint:{ conflict_risk:"med" },
starters:["Remove"],
blueprints:[
"Remove the apology before your statement.",
"Start without saying sorry.",
"Do not apologize before speaking.",
"Lead without cushioning the message.",
"Begin without apology.",
],
avoid:COMMON_AVOID,
},

/* =========================
POLITENESS LOOP
========================= */

{
id:"polite_01",
label:"End earlier",
moments:["politeness_loop"],
signAffinity:{ libra:3 },
tagsHint:{ social_load:"med" },
starters:["End"],
blueprints:[
"End the conversation earlier than usual.",
"Leave after your next response.",
"Do not extend the exchange further.",
"Finish the conversation without prolonging it.",
"Exit after delivering your point.",
],
avoid:COMMON_AVOID,
},

{
id:"polite_02",
label:"Let silence exist",
moments:["filling_silence"],
signAffinity:{ gemini:2 },
tagsHint:{ social_load:"med" },
starters:["Pause"],
blueprints:[
"Pause before filling the silence.",
"Do not rush to respond immediately.",
"Allow the silence to remain unfilled.",
"Wait before replying again.",
"Let the silence stay present.",
],
avoid:COMMON_AVOID,
},

{
id:"polite_03",
label:"Don't add extra closing",
moments:["typing"],
signAffinity:{ libra:3 },
tagsHint:{ social_load:"med" },
starters:["Stop"],
blueprints:[
"Stop before adding another closing line.",
"Send without extending the ending.",
"Do not add one more sentence.",
"Leave the message as it is.",
"End without extra courtesy.",
],
avoid:COMMON_AVOID,
},

/* =========================
VALIDATION SEEK
========================= */

{
id:"validate_01",
label:"Act without asking permission",
moments:["validation_seek"],
signAffinity:{ libra:3 },
tagsHint:{ decision_load:"med" },
starters:["Act"],
blueprints:[
"Act without asking for approval first.",
"Decide without polling others.",
"Move forward without external validation.",
"Execute before asking for opinions.",
"Take action without permission.",
],
avoid:COMMON_AVOID,
},

/* =========================
OVERGIVING
========================= */

{
id:"overgive_01",
label:"Don't volunteer energy",
moments:["offering_help_drained"],
signAffinity:{ cancer:3 },
tagsHint:{ emotional_load:"high" },
starters:["Do","Stop"],
blueprints:[
"Do not offer help automatically today.",
"Stop volunteering your energy.",
"Do not commit to additional responsibility.",
"Hold your energy back today.",
"Pause before offering assistance.",
],
avoid:COMMON_AVOID,
},

{
id:"overgive_02",
label:"Ask for support",
moments:["offering_help_drained"],
signAffinity:{ cancer:3 },
tagsHint:{ emotional_load:"high" },
starters:["Ask"],
blueprints:[
"Ask for support instead of giving more.",
"Request help before offering yours.",
"Express your need directly.",
"Seek support openly.",
"Let others support you.",
],
avoid:COMMON_AVOID,
},

/* =========================
IMPULSE
========================= */

{
id:"impulse_01",
label:"Delay impulse reaction",
moments:["impulse_react"],
signAffinity:{ aries:3 },
tagsHint:{ urgency:"high" },
starters:["Pause"],
blueprints:[
"Pause before sending your next reply.",
"Delay the impulse response.",
"Wait before reacting immediately.",
"Do not reply instantly.",
"Hold your response briefly.",
],
avoid:COMMON_AVOID,
},

];