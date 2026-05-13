# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla JS 칸반 보드 (To-Do / In Progress / Done). 빌드 도구 없음 — `index.html`을 브라우저에서 직접 열면 동작한다.

## Commands

```bash
# 개발 서버 (빌드 불필요, 브라우저에서 직접 열기)
open index.html          # macOS
xdg-open index.html      # Linux

# 간단한 로컬 서버가 필요한 경우 (ES Modules 사용 시 필수)
python3 -m http.server 8080
# 또는
npx serve .
```

테스트 프레임워크 없음. 브라우저에서 직접 동작 확인.

## Architecture

### 파일 역할

| 파일 | 역할 |
|------|------|
| `index.html` | 마크업 전담. JS/CSS 인라인 금지 |
| `style.css` | 스타일 전담. CSS 변수는 `:root`에서 중앙 관리 |
| `app.js` | 동작 전담. `'use strict'` 필수 |

### 핵심 설계 원칙

**DOM이 단일 진실 공급원**: 별도 state 객체 없이 DOM에서 직접 읽어 localStorage에 직렬화한다.

**Storage Adapter 패턴 (진행 예정)**: 저장소를 교체할 때 `app.js`를 건드리지 않도록 `storageAdapter.js`로 분리 예정. 지금도 `saveToStorage()` / `loadFromStorage()` 함수가 그 경계 역할을 한다. 이 함수들을 건드릴 때는 인터페이스를 유지할 것.

**다중 사용자 대비 데이터 모델**: 카드 스키마에는 `userId` 필드가 있어야 한다. 현재 localStorage 단계에서는 로컬 random ID를 사용하지만, Supabase 전환 시 UUID로 교체된다.

### Drag & Drop 흐름

```
dragstart → draggedCard 참조 저장 + .dragging 클래스
dragover  → getCardAfterCursor()로 삽입 위치 계산 → DOM 실시간 반영
drop      → .drag-over 제거 → updateAllBadges() → saveToStorage()
dragend   → .dragging 제거
```

`getCardAfterCursor(list, cursorY)`: 드래그 중인 카드를 제외한 카드들의 중심 Y와 커서 Y를 비교해 삽입 위치를 결정한다. `dragover`마다 호출되므로 DOM 쿼리를 추가하지 말 것.

### 저장소 구조 (localStorage)

```
kanban_session  →  { userId, email, createdAt }
kanban_cards    →  [{ id, userId, text, column, order, createdAt }]
```

`column` 값: `"todo"` | `"inprogress"` | `"done"` (`.card-list`의 `id`와 일치해야 함)

## Planned v2 (Supabase)

`docs/` 안에 PRD, TRD, DatabaseDesign, UserFlow, Tasks, DesignSystem, CodingConvention 문서가 있다. 기능 추가 전에 `docs/Tasks.md`의 Phase 순서를 확인할 것.

v2 전환 순서: **Phase 3 (storageAdapter 분리) → Phase 5 (Supabase 연동)**. `app.js`의 저장소 호출이 async/await로 바뀌므로 Phase 3부터 어댑터 함수를 `async`로 선언해야 한다.

## 코딩 규칙 요약

- 클래스명: `kebab-case` / JS 변수·함수: `camelCase`
- `data-id` 속성으로 카드 식별 (DOM 구조에 의존 금지)
- `var` 사용 금지, `const` 우선
- 주석은 WHY만. 섹션 구분: `// ===== 섹션명 =====`
- 자세한 규칙: `docs/CodingConvention.md`
