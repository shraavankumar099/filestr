#!/usr/bin/env python3
"""
FileShelf — sample asset generator (optional developer tool).

Creates the demo/seed files that ship inside `public/files/` and regenerates
`src/data/files.json` from the exact byte size of every generated file.

Requirements (only needed if you want to regenerate the seed files):
    pip install reportlab python-pptx python-docx

Usage:
    python3 scripts/generate-sample-files.py

These files are ordinary static assets. FileShelf never writes to them at
runtime — the admin panel packages *new* files for you to commit yourself.
"""

from __future__ import annotations

import json
import os
import zipfile
from datetime import date
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from docx import Document
from docx.shared import Pt
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt as PPt
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

ROOT = Path(__file__).resolve().parent.parent
FILES_DIR = ROOT / "public" / "files"
CATALOGUE = ROOT / "src" / "data" / "files.json"

INK = colors.HexColor("#101828")
MUTED = colors.HexColor("#475467")
ACCENT = colors.HexColor("#1d4ed8")
RULE = colors.HexColor("#d0d5dd")

# --------------------------------------------------------------------------- #
# PDF helpers
# --------------------------------------------------------------------------- #


def pdf_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("t", parent=base["Title"], fontName="Helvetica-Bold",
                                fontSize=22, leading=26, textColor=INK, alignment=TA_LEFT,
                                spaceAfter=4),
        "subtitle": ParagraphStyle("s", parent=base["Normal"], fontName="Helvetica",
                                   fontSize=10.5, leading=15, textColor=MUTED, spaceAfter=10),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold",
                             fontSize=13, leading=17, textColor=INK, spaceBefore=12,
                             spaceAfter=5),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Helvetica-Bold",
                             fontSize=10.5, leading=14, textColor=ACCENT, spaceBefore=8,
                             spaceAfter=3),
        "body": ParagraphStyle("b", parent=base["BodyText"], fontName="Helvetica",
                               fontSize=9.6, leading=14, textColor=INK, spaceAfter=5),
        "bullet": ParagraphStyle("bl", parent=base["BodyText"], fontName="Helvetica",
                                 fontSize=9.6, leading=14, textColor=INK, leftIndent=12,
                                 bulletIndent=2, spaceAfter=3),
        "code": ParagraphStyle("c", parent=base["Code"], fontName="Courier",
                               fontSize=8.6, leading=12, textColor=colors.HexColor("#1849a9")),
    }


def build_pdf(path: Path, title: str, subtitle: str, sections, footer: str):
    """sections: list of dicts — {heading, body?, bullets?, code?, table?}"""
    st = pdf_styles()
    doc = SimpleDocTemplate(
        str(path), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
        title=title, author="FileShelf sample library",
        subject="FileShelf demo asset",
    )
    story = [
        Paragraph(escape(title), st["title"]),
        Paragraph(escape(subtitle), st["subtitle"]),
        HRFlowable(width="100%", thickness=0.8, color=RULE, spaceAfter=10),
    ]

    for section in sections:
        if section.get("heading"):
            story.append(Paragraph(escape(section["heading"]), st["h2"]))
        for para in section.get("body", []):
            story.append(Paragraph(escape(para), st["body"]))
        for bullet in section.get("bullets", []):
            story.append(Paragraph(escape(bullet), st["bullet"], bulletText="•"))
        for block in section.get("code", []):
            story.append(Paragraph(escape(block).replace(" ", "&nbsp;"), st["code"]))
        if section.get("table"):
            rows = [[Paragraph(f"<b>{escape(c)}</b>", st["body"]) if i == 0
                     else Paragraph(escape(c), st["body"]) for c in row]
                    for i, row in enumerate(section["table"])]
            tbl = Table(rows, hAlign="LEFT", colWidths=section.get("widths"))
            tbl.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.4, RULE),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f4f7")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(Spacer(1, 6))
            story.append(tbl)
            story.append(Spacer(1, 4))
        if section.get("pagebreak"):
            story.append(PageBreak())

    def decorate(canvas, document):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, 10 * mm, footer)
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {document.page}")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, 13 * mm, A4[0] - 18 * mm, 13 * mm)
        canvas.restoreState()

    doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
    return path


# --------------------------------------------------------------------------- #
# PPTX helper
# --------------------------------------------------------------------------- #


def build_deck(path: Path, title: str, subtitle: str, slides, footer: str):
    """slides: list of (heading, [bullets]) tuples."""
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)

    # Title slide
    s = prs.slides.add_slide(prs.slide_layouts[6])
    box = s.shapes.add_textbox(Inches(1), Inches(2.4), Inches(11.3), Inches(1.6))
    tf = box.text_frame
    tf.text = title
    tf.paragraphs[0].font.size = PPt(44)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = RGBColor(0x10, 0x18, 0x28)
    p = tf.add_paragraph()
    p.text = subtitle
    p.font.size = PPt(20)
    p.font.color.rgb = RGBColor(0x47, 0x54, 0x67)
    p.space_before = PPt(14)
    line = s.shapes.add_shape(1, Inches(1), Inches(4.35), Inches(2.6), Inches(0.06))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(0x1D, 0x4E, 0xD8)
    line.line.fill.background()

    for i, (heading, bullets) in enumerate(slides, start=2):
        s = prs.slides.add_slide(prs.slide_layouts[6])
        bar = s.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.333), Inches(0.22))
        bar.fill.solid()
        bar.fill.fore_color.rgb = RGBColor(0x1D, 0x4E, 0xD8)
        bar.line.fill.background()
        tb = s.shapes.add_textbox(Inches(0.9), Inches(0.75), Inches(11.5), Inches(1.0))
        tf = tb.text_frame
        tf.text = heading
        tf.paragraphs[0].font.size = PPt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(0x10, 0x18, 0x28)

        body = s.shapes.add_textbox(Inches(0.95), Inches(1.9), Inches(11.4), Inches(4.7))
        btf = body.text_frame
        btf.word_wrap = True
        for j, bullet in enumerate(bullets):
            para = btf.paragraphs[0] if j == 0 else btf.add_paragraph()
            para.text = bullet
            para.font.size = PPt(18)
            para.font.color.rgb = RGBColor(0x34, 0x40, 0x54)
            para.space_after = PPt(12)
            para.level = 0

        fb = s.shapes.add_textbox(Inches(0.9), Inches(6.85), Inches(11.5), Inches(0.4))
        ftf = fb.text_frame
        ftf.text = f"{footer}   |   {i} / {len(slides) + 1}"
        ftf.paragraphs[0].font.size = PPt(11)
        ftf.paragraphs[0].font.color.rgb = RGBColor(0x98, 0xA2, 0xB3)

    prs.save(str(path))
    return path


# --------------------------------------------------------------------------- #
# DOCX / ZIP helpers
# --------------------------------------------------------------------------- #


def build_docx(path: Path, title: str, subtitle: str, sections):
    doc = Document()
    doc.add_heading(title, level=0)
    sub = doc.add_paragraph(subtitle)
    sub.runs[0].italic = True
    sub.runs[0].font.size = Pt(10.5)
    for heading, bullets in sections:
        doc.add_heading(heading, level=1)
        for b in bullets:
            doc.add_paragraph(b, style="List Bullet")
    doc.save(str(path))
    return path


def build_zip(path: Path, entries: dict):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in entries.items():
            zf.writestr(name, content)
    return path


# --------------------------------------------------------------------------- #
# Asset definitions
# --------------------------------------------------------------------------- #

TODAY = date.today().isoformat()

PDFS = [
    dict(
        filename="dsa-notes.pdf",
        title="Data Structures & Algorithms — Revision Notes",
        subtitle="Data structures, complexity analysis and the core algorithms every interview expects.",
        description="Condensed revision notes covering arrays, linked lists, stacks, queues, hash tables, trees and graphs with complexity tables and interview-focused patterns.",
        category="Notes",
        sections=[
            {"heading": "1. Complexity at a glance", "body": [
                "Big-O describes how running time or memory grows as input size n grows. Constants and lower-order terms are dropped."],
             "table": [["Structure", "Access", "Search", "Insert", "Delete"],
                       ["Array (static)", "O(1)", "O(n)", "O(n)", "O(n)"],
                       ["Dynamic array", "O(1)", "O(n)", "O(1) amortised", "O(n)"],
                       ["Singly linked list", "O(n)", "O(n)", "O(1)", "O(1)"],
                       ["Hash table", "—", "O(1) avg", "O(1) avg", "O(1) avg"],
                       ["Balanced BST", "O(log n)", "O(log n)", "O(log n)", "O(log n)"],
                       ["Binary heap", "—", "O(n)", "O(log n)", "O(log n)"]],
             "widths": [110, 70, 75, 95, 75]},
            {"heading": "2. Arrays & two pointers", "bullets": [
                "Prefix sums turn repeated range-sum queries into O(1) work after an O(n) pre-pass.",
                "Two pointers works on sorted data: move the pointer that can still improve the result.",
                "Sliding window maintains a running invariant over a contiguous range — expand right, shrink left.",
                "In-place partitioning (Dutch national flag) sorts three-valued arrays in one pass."],
             "code": ["for (let l = 0, r = n - 1; l < r; ) {",
                      "  const sum = a[l] + a[r];",
                      "  if (sum === target) return [l, r];",
                      "  sum < target ? l++ : r--;",
                      "}"]},
            {"heading": "3. Linked lists", "bullets": [
                "Sentinel/dummy head nodes remove almost every null-edge special case.",
                "Fast and slow pointers detect cycles (Floyd) and find the middle node.",
                "Reverse iteratively with three pointers: prev, curr, next.",
                "Merge two sorted lists by advancing the list with the smaller head value."]},
            {"heading": "4. Stacks, queues & heaps", "bullets": [
                "Monotonic stack: next greater element, largest rectangle in histogram, stock span.",
                "Deque gives amortised O(1) sliding-window maximum.",
                "Binary heap supports push/pop in O(log n) and peek in O(1); heapify is O(n).",
                "Top-k problems: keep a min-heap of size k, not a full sort."], "pagebreak": True},
            {"heading": "5. Hash tables", "body": [
                "A hash table maps keys to buckets through a hash function; collisions are resolved by chaining or open addressing."],
             "bullets": [
                "Load factor above ~0.7 triggers rehashing — keep the table sized to ~2x the entry count.",
                "Counting problems are almost always hash-map problems: frequencies, first duplicate, anagrams.",
                "Prefix-sum + hash map solves subarray-sum-equals-k in O(n)."]},
            {"heading": "6. Trees", "bullets": [
                "Traversals — preorder (copy), inorder (sorted output for BST), postorder (delete/free), level order (BFS).",
                "BST operations are O(h); h is O(log n) balanced, O(n) degraded.",
                "AVL and red-black trees keep h = O(log n) with rotations.",
                "Trie: prefix search, autocomplete, word dictionaries in O(key length)."]},
            {"heading": "7. Graphs", "bullets": [
                "Represent as adjacency list (sparse) or adjacency matrix (dense).",
                "BFS finds shortest paths on unweighted graphs; DFS suits connectivity and cycle detection.",
                "Dijkstra: non-negative weights, O((V + E) log V) with a binary heap.",
                "Bellman-Ford handles negative weights in O(V·E) and detects negative cycles.",
                "Topological sort via Kahn's algorithm detects cycles in directed graphs.",
                "Union-Find with path compression near O(1) per operation for connectivity."]},
            {"heading": "8. Sorting & searching", "table": [
                ["Algorithm", "Average", "Worst", "Stable", "Notes"],
                ["Bubble / Insertion", "O(n²)", "O(n²)", "Yes", "Insertion sort wins on nearly sorted data"],
                ["Merge sort", "O(n log n)", "O(n log n)", "Yes", "Linked lists, external sort"],
                ["Quick sort", "O(n log n)", "O(n²)", "No", "In-place; randomise the pivot"],
                ["Heap sort", "O(n log n)", "O(n log n)", "No", "O(1) extra space"],
                ["Counting / Radix", "O(n + k)", "O(n + k)", "Yes", "Small integer key ranges"]],
             "widths": [110, 80, 80, 50, 175]},
            {"heading": "9. Dynamic programming checklist", "bullets": [
                "Define the state precisely, then write the recurrence before coding.",
                "Identify the base case and the iteration order that fills dependencies first.",
                "Classic patterns: 0/1 knapsack, LCS, edit distance, coin change, LIS, grid paths.",
                "Optimise space when the recurrence only needs the previous row."]},
        ],
        footer="Data Structures & Algorithms — Revision Notes · FileShelf sample library",
    ),
    dict(
        filename="react-18-cheatsheet.pdf",
        title="React 18 Cheatsheet",
        subtitle="Hooks, state patterns and rendering rules on one printable sheet.",
        description="A two-page printable reference for React 18: core hooks, rules of hooks, state update patterns, effects, memoisation and common pitfalls.",
        category="Reference",
        sections=[
            {"heading": "Core hooks", "code": [
                "const [state, setState] = useState(initial);",
                "useEffect(() => { /* setup */ return () => {/* cleanup */}; }, [deps]);",
                "const ctx = useContext(ThemeContext);",
                "const [v, dispatch] = useReducer(reducer, initialArg, init);",
                "const ref = useRef(null);              // mutable box, no re-render",
                "const memo = useMemo(() => compute(a, b), [a, b]);",
                "const cb   = useCallback((x) => run(x), [run]);"]},
            {"heading": "Rules of hooks", "bullets": [
                "Call hooks only at the top level of a component or custom hook — never inside conditions or loops.",
                "Hooks must run in the same order on every render.",
                "Custom hooks are just functions whose name starts with use."]},
            {"heading": "State updates", "bullets": [
                "State updates are asynchronous and batched inside event handlers and effects.",
                "Use the updater form when the next value depends on the previous one: setCount(c => c + 1).",
                "Never mutate state objects or arrays — create new ones with spread or map.",
                "React 18 batches updates in promises, timeouts and native handlers too (automatic batching)."], "pagebreak": True},
            {"heading": "Effects", "bullets": [
                "Effects synchronise your component with something outside React (network, DOM, subscription).",
                "An empty dependency array runs once after mount; the cleanup runs on unmount.",
                "Missing dependencies cause stale values; the exhaustive-deps lint rule catches most cases.",
                "Prefer deriving values during render over storing them in state."]},
            {"heading": "Performance", "bullets": [
                "React.memo skips re-rendering a component when its props are shallow-equal.",
                "Memoise expensive work with useMemo and stable callbacks with useCallback.",
                "Keep keys stable and unique in lists — index keys break reconciliation on reorder.",
                "Split context providers so a single value change does not re-render the whole tree.",
                "useDeferredValue and useTransition keep slow updates from blocking typing."]},
            {"heading": "React 18 additions", "bullets": [
                "createRoot() replaces ReactDOM.render() and enables concurrent rendering.",
                "Automatic batching groups updates across async boundaries.",
                "Suspense works with data-fetching libraries; useId generates stable unique ids.",
                "StrictMode double-invokes effects in development to surface cleanup bugs."]},
        ],
        footer="React 18 Cheatsheet · FileShelf sample library",
    ),
    dict(
        filename="sql-query-reference.pdf",
        title="SQL Query Reference",
        subtitle="Everyday SQL patterns: filtering, joins, aggregation, window functions and tuning.",
        description="Reference sheet of practical SQL: query execution order, join types, aggregation, subqueries, window functions, indexes and safe update habits.",
        category="Reference",
        sections=[
            {"heading": "Logical execution order", "code": [
                "FROM  →  JOIN  →  WHERE  →  GROUP BY  →  HAVING",
                "      →  SELECT  →  DISTINCT  →  ORDER BY  →  LIMIT"],
             "body": ["Column aliases from SELECT are therefore usable in ORDER BY but not in WHERE."]},
            {"heading": "Joins", "table": [
                ["Join", "Returns"],
                ["INNER JOIN", "Rows with a match on both sides"],
                ["LEFT JOIN", "All left rows; NULLs where the right side has no match"],
                ["RIGHT JOIN", "All right rows; NULLs where the left side has no match"],
                ["FULL OUTER JOIN", "All rows from both sides"],
                ["CROSS JOIN", "Cartesian product of both inputs"]],
             "widths": [120, 335]},
            {"heading": "Aggregation", "code": [
                "SELECT category, COUNT(*) AS n, AVG(size) AS avg_size",
                "FROM files",
                "WHERE deleted_at IS NULL",
                "GROUP BY category",
                "HAVING COUNT(*) > 2",
                "ORDER BY n DESC;"],
             "bullets": [
                "COUNT(*) counts rows; COUNT(col) skips NULLs.",
                "String aggregation: GROUP_CONCAT (MySQL), STRING_AGG (Postgres/SQL Server).",
                "Filter inside an aggregate with FILTER (WHERE ...) in Postgres."]},
            {"heading": "Window functions", "code": [
                "ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC)",
                "RANK()       OVER (PARTITION BY category ORDER BY downloads DESC)",
                "SUM(size)    OVER (ORDER BY created_at)          -- running total",
                "LAG(price)   OVER (PARTITION BY sku ORDER BY day) -- previous value"],
             "bullets": ["Window functions keep every row while aggregates collapse rows."], "pagebreak": True},
            {"heading": "Subqueries & CTEs", "code": [
                "WITH recent AS (",
                "  SELECT * FROM files WHERE created_at > NOW() - INTERVAL '30 days'",
                ")",
                "SELECT category, COUNT(*) FROM recent GROUP BY category;"],
             "bullets": [
                "EXISTS short-circuits as soon as one row matches — usually faster than IN for large sets.",
                "CTEs read better than nested subqueries; Postgres 12+ inlines them when possible."]},
            {"heading": "Indexes & tuning", "bullets": [
                "B-tree indexes serve equality, range and ORDER BY — the default choice.",
                "A composite index (a, b) helps WHERE a = ? AND b = ? but not WHERE b = ? alone.",
                "Always index foreign-key columns used in joins; check with EXPLAIN ANALYZE.",
                "Functions on indexed columns (WHERE LOWER(email) = ...) disable the index unless a functional index exists.",
                "Covering indexes let a query be answered from the index alone (index-only scan)."]},
            {"heading": "Safety habits", "bullets": [
                "Always write the WHERE clause before the SET clause in UPDATE/DELETE.",
                "SELECT first with the exact WHERE clause, then convert to UPDATE/DELETE.",
                "Wrap multi-statement changes in BEGIN ... COMMIT and verify with a SELECT before COMMIT.",
                "Parameterise all user input to avoid SQL injection."]},
        ],
        footer="SQL Query Reference · FileShelf sample library",
    ),
    dict(
        filename="git-workflow-guide.pdf",
        title="Git & GitHub Workflow Guide",
        subtitle="Branching, commits, pull requests and recovery commands for small teams.",
        description="Practical Git guide: trunk-based branching, conventional commits, pull-request checklist, conflict resolution and undo commands for everyday mistakes.",
        category="Guides",
        sections=[
            {"heading": "Branching model", "bullets": [
                "main is always deployable — protect it and merge through pull requests.",
                "Create short-lived feature branches: feature/<ticket>-<slug>.",
                "Rebase your branch on main before opening a PR to keep history linear.",
                "Delete branches after merge; keep the remote tidy."],
             "code": ["git switch -c feature/FIL-12-search-filter",
                      "git fetch origin && git rebase origin/main",
                      "git push -u origin HEAD"]},
            {"heading": "Everyday commands", "table": [
                ["Goal", "Command"],
                ["Status / diff", "git status · git diff --staged"],
                ["Stage part of a file", "git add -p"],
                ["Amend the last commit", "git commit --amend --no-edit"],
                ["Undo last commit (keep changes)", "git reset --soft HEAD~1"],
                ["Discard local changes", "git restore <file>"],
                ["Find the commit that broke it", "git bisect start / good / bad"],
                ["See who last touched a line", "git blame -L 40,60 <file>"],
                ["Stash work in progress", "git stash push -m \"wip\" · git stash pop"]],
             "widths": [180, 275]},
            {"heading": "Conventional commits", "code": [
                "feat(library): add category filter chips",
                "fix(admin): guard against duplicate filenames",
                "docs(readme): document the export workflow",
                "chore(deps): bump vite to 8.x",
                "",
                "Types: feat · fix · docs · style · refactor · perf · test · chore"],
             "body": ["A consistent prefix makes changelogs and semantic releases mechanically generatable."]},
            {"heading": "Pull-request checklist", "bullets": [
                "Title states the outcome, description explains why and how it was verified.",
                "Keep the diff reviewable — under ~400 changed lines where possible.",
                "Add screenshots for UI changes and note any new configuration or environment variables.",
                "CI green, no merge conflicts, at least one reviewer approval."], "pagebreak": True},
            {"heading": "Resolving conflicts", "code": ["git merge origin/main        # or: git rebase origin/main",
                                                        "# edit the conflicted files, then:",
                                                        "git add <files>",
                                                        "git rebase --continue      # or: git commit"]},
            {"heading": "Recovery", "bullets": [
                "git reflog shows every position HEAD has held — almost nothing is truly lost.",
                "git reset --hard <sha> moves the branch; git revert <sha> adds an inverse commit (safe on shared branches).",
                "git checkout <sha> -- <file> restores a single file from history.",
                "git clean -nd previews untracked files; -fd deletes them."]},
            {"heading": "Good .gitignore hygiene", "code": ["node_modules/", "dist/", ".env", ".env.local",
                                                            "*.log", ".DS_Store"]},
        ],
        footer="Git & GitHub Workflow Guide · FileShelf sample library",
    ),
    dict(
        filename="ui-design-checklist.pdf",
        title="UI & UX Design Checklist",
        subtitle="A review pass for layout, typography, states, accessibility and performance.",
        description="Design QA checklist covering visual hierarchy, spacing scale, typography, colour contrast, interaction states, empty/error states, responsive behaviour and accessibility.",
        category="Design",
        sections=[
            {"heading": "Hierarchy & layout", "bullets": [
                "One clear primary action per screen; secondary actions are visually quieter.",
                "Align everything to a spacing scale (4 / 8 / 12 / 16 / 24 / 32 / 48 px).",
                "Group related controls; separate unrelated groups with whitespace rather than lines.",
                "Keep line length between 45 and 80 characters for comfortable reading."]},
            {"heading": "Typography", "bullets": [
                "Use at most two families and a strict size ramp (12 / 14 / 16 / 20 / 24 / 32).",
                "Body text at 16px minimum on the web; line height 1.4–1.6.",
                "Avoid full-black text on white — #101828 on #ffffff reads softer.",
                "Never use colour alone to convey meaning."]},
            {"heading": "Colour & contrast", "bullets": [
                "Body text needs a contrast ratio of at least 4.5:1; large text 3:1.",
                "Interactive targets should be at least 44 × 44 px on touch screens.",
                "Reserve one accent colour for actions and highlights.",
                "Gradients, shadows and animation should be purposeful, not decorative."]},
            {"heading": "States — the part most builds forget", "table": [
                ["State", "What the user must see"],
                ["Loading", "Skeleton or spinner that matches the final layout"],
                ["Empty (no data)", "Explanation plus the action that creates the first item"],
                ["No results (filtered)", "The active filters and a one-click way to clear them"],
                ["Error", "Plain-language cause and a retry path"],
                ["Success", "Confirmation that names what changed"],
                ["Not found", "A route home, not a dead end"]],
             "widths": [120, 335], "pagebreak": True},
            {"heading": "Accessibility", "bullets": [
                "Every interactive element is reachable and operable by keyboard.",
                "Visible focus ring on all focusable elements — never outline: none without a replacement.",
                "Images have alt text; decorative images use alt=\"\".",
                "Inputs have real labels, not placeholder-only hints.",
                "Respect prefers-reduced-motion for larger transitions.",
                "Icon-only buttons need an aria-label."]},
            {"heading": "Responsive behaviour", "bullets": [
                "Design mobile-first, then widen: 360 / 768 / 1024 / 1440 px breakpoints.",
                "No horizontal scrolling at any width; test long unbroken strings.",
                "Tables collapse to cards or scroll inside a labelled container.",
                "Touch targets stay large when the layout compresses."]},
            {"heading": "Performance budget", "bullets": [
                "Lazy-load images below the fold; size them to their display box.",
                "Keep the initial JavaScript payload small — code-split routes.",
                "Avoid layout shift: reserve space for media and fonts.",
                "Measure with Lighthouse on mid-tier hardware, not just a fast laptop."]},
        ],
        footer="UI & UX Design Checklist · FileShelf sample library",
    ),
]

DECKS = [
    dict(
        filename="cloud-computing.pptx",
        title="Cloud Computing Fundamentals",
        subtitle="Service models, deployment models and the trade-offs that decide architecture.",
        description="A nine-slide primer on cloud computing: IaaS/PaaS/SaaS, deployment models, virtualisation, containers, serverless, cost models and a provider comparison.",
        category="Presentations",
        slides=[
            ("Agenda", ["What the cloud actually is",
                        "Service models: IaaS, PaaS, SaaS",
                        "Deployment models: public, private, hybrid, multi-cloud",
                        "Virtualisation, containers and serverless",
                        "Cost, resilience and lock-in trade-offs"]),
            ("Cloud in one definition", ["On-demand, self-service access to pooled, elastic computing resources over a network.",
                                         "Pay for what you consume, in seconds to hours, without owning hardware.",
                                         "The five NIST essentials: on-demand self-service, broad network access, resource pooling, rapid elasticity, measured service."]),
            ("Service models", ["IaaS — virtual machines, storage, networks. You manage the OS and everything above it.",
                                "PaaS — managed runtimes and databases. You deploy code, the platform patches the rest.",
                                "SaaS — finished software consumed over the browser.",
                                "Rule of thumb: the higher the abstraction, the faster the delivery and the less control."]),
            ("Deployment models", ["Public cloud — multi-tenant infrastructure from a provider such as AWS, Azure or GCP.",
                                   "Private cloud — dedicated to one organisation for regulatory or latency reasons.",
                                   "Hybrid — steady-state workloads on-premise, bursts in the cloud, connected securely.",
                                   "Multi-cloud — deliberately spreading risk across providers."]),
            ("Virtualisation vs containers", ["A hypervisor runs full guest operating systems — strong isolation, heavier footprint, slower boot.",
                                              "Containers share the host kernel — images of tens of megabytes, start in under a second, weaker isolation boundary.",
                                              "Orchestrators such as Kubernetes schedule, scale and heal container fleets."]),
            ("Serverless & managed data", ["Functions run per request; the provider scales to zero and bills per invocation.",
                                           "Managed databases, queues and object storage remove operational work but constrain design choices.",
                                           "Cold starts, execution time limits and statelessness are the practical constraints."]),
            ("Cost model essentials", ["Compute is billed by time and capacity; storage by volume and access class; egress by bytes leaving the network.",
                                       "Idle resources are the most common source of waste — right-size and auto-scale.",
                                       "Set budgets and alerts before, not after, the invoice arrives."]),
            ("Resilience patterns", ["Design for failure: assume every component will restart at some point.",
                                     "Use multiple availability zones; replicate state; make retries idempotent.",
                                     "Define RTO and RPO explicitly — they drive the architecture, not the other way round."]),
            ("Choosing a stack", ["Match managed services to the team's operational maturity, not to the trend list.",
                                  "Prefer portable, open standards (Kubernetes, PostgreSQL, S3-compatible APIs) to limit lock-in.",
                                  "Prototype on the simplest tier that can serve real traffic, then scale deliberately."]),
        ],
        footer="Cloud Computing Fundamentals",
    ),
    dict(
        filename="machine-learning-basics.pptx",
        title="Machine Learning Basics",
        subtitle="From problem framing to evaluation — the workflow behind most production models.",
        description="Eight-slide introduction to machine learning: problem framing, supervised vs unsupervised learning, the training workflow, evaluation metrics, overfitting and deployment concerns.",
        category="Presentations",
        slides=[
            ("What machine learning is", ["A program that improves at a task by learning patterns from data instead of following hand-written rules.",
                                          "Use it when the rules are unknown, fuzzy or too numerous to write by hand.",
                                          "It is not magic: the output is only as good as the data and the framing."]),
            ("Framing the problem", ["Start from the decision the model will support, not from the algorithm.",
                                     "Do you have labels? How much data? How fast must predictions be?",
                                     "Define the metric you will be judged on before training anything."]),
            ("Learning paradigms", ["Supervised — learn a mapping from labelled examples (classification, regression).",
                                    "Unsupervised — discover structure in unlabelled data (clustering, dimensionality reduction).",
                                    "Reinforcement — learn actions from reward signals through interaction."]),
            ("The training workflow", ["Collect and clean data → split train/validation/test → choose a baseline → train → evaluate → iterate.",
                                       "Always start with a trivial baseline; it tells you whether the model adds value at all.",
                                       "Keep the test set untouched until the very end."]),
            ("Features and data quality", ["Feature engineering often matters more than model choice.",
                                           "Handle missing values deliberately; scale numeric features; encode categoricals consistently.",
                                           "Leakage — information from the future or the target sneaking into features — silently inflates scores."]),
            ("Evaluation metrics", ["Classification: accuracy is misleading on imbalanced data — use precision, recall and F1.",
                                    "Ranking: ROC-AUC and precision-recall AUC.",
                                    "Regression: MAE, RMSE and R²; report residuals, not just one number.",
                                    "Always compare against the baseline with confidence intervals or cross-validation."]),
            ("Overfitting and generalisation", ["Overfitting: excellent on training data, poor on unseen data. Fix with more data, simpler models or regularisation.",
                                                "Underfitting: poor on both — the model is too simple for the signal.",
                                                "Cross-validation gives a more stable estimate than a single split."]),
            ("Shipping a model", ["Serving choices: batch scoring, a REST endpoint or an on-device model.",
                                  "Monitor input drift and prediction quality after deployment — performance decays silently.",
                                  "Version data, code and model artifacts together so any result can be reproduced."]),
        ],
        footer="Machine Learning Basics",
    ),
]

ZIPS = {
    "project-source.zip": {
        "project/README.md": """# Task API — sample project

A tiny Express + SQLite task API used as demo source code inside FileShelf.

## Run

```bash
npm install
npm run dev
```

The server listens on http://localhost:4000.
""",
        "project/package.json": json.dumps({
            "name": "task-api",
            "version": "1.0.0",
            "type": "module",
            "scripts": {"dev": "node src/server.js", "start": "node src/server.js"},
            "dependencies": {"express": "^4.19.2"}
        }, indent=2, ensure_ascii=False) + "\n",
        "project/src/server.js": """import express from 'express';
import { createTask, listTasks, completeTask } from './tasks.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/tasks', (_req, res) => res.json(listTasks()));
app.post('/tasks', (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  return res.status(201).json(createTask(title));
});
app.patch('/tasks/:id/complete', (req, res) => {
  const task = completeTask(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'task not found' });
  return res.json(task);
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`Task API listening on http://localhost:${port}`));
""",
        "project/src/tasks.js": """let seq = 0;
const tasks = [];

export function listTasks() {
  return [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
}

export function createTask(title) {
  const task = { id: ++seq, title, done: false, createdAt: new Date().toISOString() };
  tasks.push(task);
  return task;
}

export function completeTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.done = true;
  task.completedAt = new Date().toISOString();
  return task;
}
""",
        "project/tests/tasks.test.js": """import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask, completeTask } from '../src/tasks.js';

test('creates and completes a task', () => {
  const task = createTask('write docs');
  assert.equal(task.done, false);
  const done = completeTask(task.id);
  assert.equal(done.done, true);
  assert.ok(done.completedAt);
});

test('returns null for an unknown id', () => {
  assert.equal(completeTask(99999), null);
});
""",
        "project/.gitignore": "node_modules/\n.env\n*.log\n",
        "project/LICENSE": "MIT License — sample project bundled with FileShelf for demonstration purposes.\n",
        "HOW-TO-USE.txt": """This archive is a FileShelf demo download.

Unzip it and run `npm install` inside project/ to start the sample API.
""",
    }
}


# --------------------------------------------------------------------------- #
# Build everything
# --------------------------------------------------------------------------- #


def main():
    FILES_DIR.mkdir(parents=True, exist_ok=True)
    for stale in FILES_DIR.iterdir():
        if stale.is_file():
            stale.unlink()

    entries = []

    for spec in PDFS:
        path = FILES_DIR / spec["filename"]
        build_pdf(path, spec["title"], spec["subtitle"], spec["sections"], spec["footer"])
        entries.append({
            "id": spec["filename"].rsplit(".", 1)[0],
            "title": spec["title"],
            "filename": spec["filename"],
            "description": spec["description"],
            "category": spec["category"],
            "fileType": "pdf",
            "size": path.stat().st_size,
            "url": f"/files/{spec['filename']}",
            "addedAt": TODAY,
        })

    for spec in DECKS:
        path = FILES_DIR / spec["filename"]
        build_deck(path, spec["title"], spec["subtitle"], spec["slides"], spec["footer"])
        entries.append({
            "id": spec["filename"].rsplit(".", 1)[0],
            "title": spec["title"],
            "filename": spec["filename"],
            "description": spec["description"],
            "category": spec["category"],
            "fileType": "pptx",
            "size": path.stat().st_size,
            "url": f"/files/{spec['filename']}",
            "addedAt": TODAY,
        })

    for filename, contents in ZIPS.items():
        path = FILES_DIR / filename
        build_zip(path, contents)
        entries.append({
            "id": filename.rsplit(".", 1)[0],
            "title": "Sample Project Source Package",
            "filename": filename,
            "description": "A small Express task-API project archive (source, tests and README) included as a downloadable ZIP example.",
            "category": "Archives",
            "fileType": "zip",
            "size": path.stat().st_size,
            "url": f"/files/{filename}",
            "addedAt": TODAY,
        })

    docx_path = FILES_DIR / "internship-report-template.docx"
    build_docx(
        docx_path,
        "Internship Report Template",
        "Replace every bracketed placeholder with your own content before submission.",
        [
            ("1. Cover page", ["Title: [Project Title]",
                               "Submitted by: [Full name], [Roll number], [Programme]",
                               "Organisation: [Company name], [City]",
                               "Duration: [Start date] to [End date]",
                               "Academic guide: [Name, designation]"]),
            ("2. Acknowledgements", ["Thank the organisation, the reporting manager, the academic guide and the department."]),
            ("3. Abstract", ["Summarise the problem, the approach, the deliverable and the outcome in 150–250 words."]),
            ("4. Introduction", ["Background and context", "Problem statement", "Objectives of the internship",
                                 "Scope and limitations"]),
            ("5. Organisation profile", ["About the organisation, its domain, teams and technology stack."]),
            ("6. Work done", ["Week-by-week log of tasks, tools and technologies used.",
                              "Architecture or data-flow diagram of the work delivered.",
                              "Screenshots or outputs that demonstrate the result."]),
            ("7. Learning outcomes", ["Technical skills gained", "Process and collaboration skills", "Challenges and how they were resolved"]),
            ("8. Conclusion and future work", ["What was achieved against the objectives, and what would be done next."]),
            ("9. References", ["Books, documentation, papers and repositories consulted, in a consistent citation style."]),
            ("10. Appendix", ["Code listings, configuration files, additional screenshots and the weekly log sheet."]),
        ],
    )
    entries.append({
        "id": "internship-report-template",
        "title": "Internship Report Template",
        "filename": "internship-report-template.docx",
        "description": "Editable Word template for an internship or industrial-training report, with sections, placeholders and formatting guidance.",
        "category": "Templates",
        "fileType": "docx",
        "size": docx_path.stat().st_size,
        "url": "/files/internship-report-template.docx",
        "addedAt": TODAY,
    })

    order = ["Notes", "Presentations", "Archives", "Reference", "Guides", "Design", "Templates"]
    entries.sort(key=lambda e: (order.index(e["category"]), e["title"]))

    CATALOGUE.parent.mkdir(parents=True, exist_ok=True)
    CATALOGUE.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {len(entries)} files to {FILES_DIR}")
    for e in entries:
        print(f"  {e['filename']:<36} {e['size']:>8,} bytes  {e['category']}")
    print(f"Wrote catalogue with {len(entries)} entries to {CATALOGUE}")


if __name__ == "__main__":
    main()
