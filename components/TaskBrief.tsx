import type { FileAsset, LearningMaterial, Task } from "@/lib/types";
import { PART_STYLE, SKILL_LABEL, SUBMISSION_LABEL, TAG_LABEL, difficultyLabel, fmtDate } from "@/lib/labels";
import { Markdown } from "./Markdown";
import { FileView, MaterialCard } from "./Media";
import { SkillBadge } from "./art/SkillIcons";

/**
 * The readable task "storybook page": primary skill, tags, submission type,
 * then the task split into its parts (situation, questions, useful language,
 * challenge…). The original wording is always available underneath.
 */
export function TaskBrief({ task, attachments, materials, sessionLabel }: {
  task: Task; attachments: FileAsset[]; materials: LearningMaterial[]; sessionLabel: string;
}) {
  const types = task.submissionTypes?.length ? task.submissionTypes : [task.skill === "SPEAKING" ? "AUDIO" : "TEXT"];
  const parts = task.parts ?? [];
  return (
    <div className="paper brief">
      <div className="row" style={{ gap: ".8rem", alignItems: "flex-start", flexWrap: "nowrap" }}>
        <SkillBadge skill={task.skill} size={58} />
        <div style={{ minWidth: 0 }}>
          <span className="hand" style={{ color: "var(--lav-deep)", fontSize: "1.25rem" }}>{sessionLabel} · {SKILL_LABEL[task.skill]}</span>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", margin: 0 }}>{task.title}</h1>
        </div>
      </div>
      <div className="task-meta">
        <span className="chip primary-skill">Primary skill · {SKILL_LABEL[task.skill]}</span>
        {(task.tags ?? []).map((g) => <span key={g} className="chip tag">{TAG_LABEL[g]}</span>)}
        {difficultyLabel(task.difficulty) && <span className="chip">{difficultyLabel(task.difficulty)}</span>}
        {task.durationMin > 0 && <span className="chip">~{task.durationMin} min</span>}
        {task.dueDate && <span className="chip">Due {fmtDate(task.dueDate)}</span>}
      </div>
      <div className="handin"><strong>Hand it in as:</strong> {types.map((x) => <span key={x} className="chip">{SUBMISSION_LABEL[x]}</span>)}</div>

      {parts.length ? (
        <div className="parts">
          {parts.map((p) => (
            <section key={p.id} className={`part part-${p.kind.toLowerCase()}`}>
              {(p.title || PART_STYLE[p.kind]?.label) && (
                <h3 className="part-title"><span aria-hidden>{PART_STYLE[p.kind]?.icon}</span> {p.title || PART_STYLE[p.kind].label}</h3>
              )}
              {p.body && <Markdown source={p.body} />}
            </section>
          ))}
        </div>
      ) : <Markdown source={task.instructions} />}

      {(task.requiredExpressions ?? []).length > 0 && (
        <section className="part part-language">
          <h3 className="part-title"><span aria-hidden>💬</span> Expressions to use</h3>
          <div className="expr-cloud">{task.requiredExpressions.map((e) => <span key={e} className="expr">{e}</span>)}</div>
        </section>
      )}

      {attachments.length > 0 && <div className="file-list" style={{ marginTop: "1rem" }}>{attachments.map((f) => <FileView key={f.id} f={f} />)}</div>}
      {materials.length > 0 && <div className="grid-2" style={{ marginTop: "1rem" }}>{materials.map((m) => <MaterialCard key={m.id} m={m} />)}</div>}

      {parts.length > 0 && (
        <details className="original">
          <summary>Original wording</summary>
          <div className="original-text">{task.instructions}</div>
        </details>
      )}
    </div>
  );
}
