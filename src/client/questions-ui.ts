/**
 * History question card and Archive reader. Presentation only: answers go through
 * src/core/age.ts (answerQuestion). Answers are shown in a stable shuffled order per question,
 * so the right answer is not always first and does not jump around between looks.
 */
import type { ArchivePage, LoadedContent, QuestionDef, TownState } from '../core';
import { answerQuestion, nextQuestion, questionsLeftToday, unlockedArchive, type ActionError } from '../core';
import { ICON, tr } from './describe';
import { fmt, lang, t } from './i18n';

export interface QuestionsHost {
  town(): TownState;
  content: LoadedContent;
  now(): number;
  toast(msg: string): void;
  errorText(e: ActionError): string;
  openCard(html: string, bind: (el: HTMLElement) => void): void;
  closeCard(): void;
  changed(): void;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Option indices in a stable shuffled order for this question. */
function order(q: QuestionDef, n: number): number[] {
  return [...Array(n).keys()].sort((a, b) => hash(`${q.id}:${a}`) - hash(`${q.id}:${b}`));
}

function textOf(q: QuestionDef) {
  // Arabic questions are written separately by a native writer [GDD]; until then, English.
  return (lang() === 'ar' && q.ar) || q.en;
}

function page(c: LoadedContent, id: string): ArchivePage | undefined {
  return c.archive.pages.find((p) => p.id === id);
}

export function openQuestion(h: QuestionsHost): void {
  const s = h.town();
  const c = h.content;
  const q = nextQuestion(s, c);
  if (!q) return h.openCard(`<h3>📖 ${t('ui.question_title')}</h3><p>${t('ui.all_answered')}</p><button type="button" class="btn block" id="btn-q-close">${t('ui.close')}</button>`, bindClose(h));
  const left = questionsLeftToday(s, c, h.now());
  if (left <= 0) return h.openCard(`<h3>📖 ${t('ui.question_title')}</h3><p>${t('ui.no_more_today')}</p><button type="button" class="btn block" id="btn-q-close">${t('ui.close')}</button>`, bindClose(h));
  const tx = textOf(q);
  const opts = order(q, tx.options.length)
    .map((i) => `<button type="button" class="opt" data-answer="${i}"><b>${tx.options[i]}</b></button>`)
    .join('');
  h.openCard(
    `<h3>📖 ${t('ui.question_title')}</h3>
     <p class="muted" style="margin:0">${tr('ui.left_today', { n: left })}${lang() === 'ar' && !q.ar ? ` · ${t('ui.ar_fallback')}` : ''}</p>
     <p class="quote" style="font-style:normal;font-weight:600;font-size:16px">${tx.prompt}</p>
     <div class="opts">${opts}</div>
     <p class="muted" style="font-size:11px;margin:10px 0 0">${t('ui.draft_note')}</p>`,
    (el) => {
      for (const b of el.querySelectorAll<HTMLButtonElement>('[data-answer]')) {
        b.addEventListener('click', () => showResult(h, q, Number(b.dataset.answer)));
      }
    },
  );
}

function showResult(h: QuestionsHost, q: QuestionDef, choice: number): void {
  const c = h.content;
  const r = answerQuestion(h.town(), c, q.id, choice, h.now());
  if (!r.ok) {
    h.closeCard();
    return h.toast(h.errorText(r.error));
  }
  h.changed();
  const tx = textOf(q);
  const p = page(c, r.archive);
  const left = questionsLeftToday(h.town(), c, h.now());
  const more = left > 0 && nextQuestion(h.town(), c);
  const opts = order(q, tx.options.length)
    .map((i) => {
      const mark = i === q.answer ? '✅ ' : i === choice ? '❌ ' : '';
      const style = i === q.answer ? 'border-color:#4f8a2b;background:#eef7e6' : i === choice ? 'border-color:#b3541e' : 'opacity:.6';
      return `<div class="opt" style="${style}"><b>${mark}${tx.options[i]}</b></div>`;
    })
    .join('');
  h.openCard(
    `<h3>${r.correct ? `✅ ${t('ui.right')} +${fmt(r.knowledge)} ${ICON.knowledge}` : `💡 ${t('ui.not_quite')}`}</h3>
     <p style="font-weight:600">${tx.prompt}</p>
     <div class="opts">${opts}</div>
     <p class="quote">${tx.explanation}</p>
     ${r.correct && p ? `<div class="active-route"><div class="top"><span class="ic">📚</span><b>${r.newPage ? tr('ui.page_opened', { title: p.title }) : p.title}</b><button type="button" class="btn" data-read="${p.id}">${t('ui.read')}</button></div></div>` : ''}
     <div class="row">
       <button type="button" class="btn" id="btn-q-close">${t('ui.close')}</button>
       ${more ? `<button type="button" class="btn primary" id="btn-q-next">${t('ui.next_question')} (${left})</button>` : ''}
     </div>`,
    (el) => {
      bindClose(h)(el);
      el.querySelector('#btn-q-next')?.addEventListener('click', () => openQuestion(h));
      el.querySelector<HTMLButtonElement>('[data-read]')?.addEventListener('click', (e) => openPage(h, (e.currentTarget as HTMLElement).dataset.read!));
    },
  );
}

function bindClose(h: QuestionsHost) {
  return (el: HTMLElement) => el.querySelector('#btn-q-close')?.addEventListener('click', () => h.closeCard());
}

export function openArchive(h: QuestionsHost): void {
  const c = h.content;
  const open = new Set(unlockedArchive(h.town(), c));
  const rows = c.archive.pages
    .map((p) => open.has(p.id)
      ? `<button type="button" class="opt" data-read="${p.id}"><b>📜 ${p.title}</b></button>`
      : `<div class="opt" style="opacity:.55"><b>🔒 ${t('ui.archive_locked')}</b></div>`)
    .join('');
  h.openCard(
    `<h3>📚 ${t('ui.archive')} <small class="muted">${open.size}/${c.archive.pages.length}</small></h3>
     <div class="opts">${rows}</div>
     <div class="row" style="margin-top:12px"><button type="button" class="btn" id="btn-q-close">${t('ui.close')}</button></div>`,
    (el) => {
      bindClose(h)(el);
      for (const b of el.querySelectorAll<HTMLElement>('[data-read]')) b.addEventListener('click', () => openPage(h, b.dataset.read!));
    },
  );
}

function openPage(h: QuestionsHost, id: string): void {
  const p = page(h.content, id);
  if (!p) return;
  const list = h.content.archive.sourceList as Record<string, string>;
  const sources = p.sources.map((sid) => `<li>${sid}: ${typeof list[sid] === 'string' ? list[sid] : sid}</li>`).join('');
  h.openCard(
    `<h3>📜 ${p.title}</h3>
     ${p.body.split('\n\n').map((para) => `<p style="line-height:1.5">${para}</p>`).join('')}
     <details><summary>${t('ui.young_reader')}</summary><p style="line-height:1.5">${p.youngReader}</p></details>
     <details><summary>${t('ui.sources')}</summary><ul style="font-size:12px">${sources}</ul></details>
     <p class="muted" style="font-size:11px">${t('ui.draft_note')}</p>
     <div class="row"><button type="button" class="btn" id="btn-archive-back">📚 ${t('ui.archive')}</button><button type="button" class="btn" id="btn-q-close">${t('ui.close')}</button></div>`,
    (el) => {
      bindClose(h)(el);
      el.querySelector('#btn-archive-back')?.addEventListener('click', () => openArchive(h));
    },
  );
}
