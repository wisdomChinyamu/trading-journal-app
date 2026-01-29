<!--
This is documentation only.
Not executable.
Not imported.
-->

Improvements to app
# Notion‑Style Notes Module – Technical Documentation

## 1. Overview

This document defines a **Notion‑like notes system** for your app. The goal is to allow users to create rich, flexible notes composed of blocks, pages, and nested content, with real‑time editing, media support, and extensibility.

Core principles:

* Everything is a **block**
* Pages are just **special blocks**
* Content is **hierarchical**
* Editing feels **fluid, keyboard‑first, and modular**

---

## 2. Core Concepts

### 2.1 Blocks

A **block** is the smallest unit of content.

Examples:

* Paragraph
* Heading
* Image
* To‑do item
* Quote
* Divider
* Page

Every block:

* Has a unique `blockId`
* Has a `type`
* Stores `properties`
* Can optionally have `children`

```json
{
  "blockId": "uuid",
  "type": "paragraph",
  "properties": {
    "text": "Hello world"
  },
  "children": []
}
```

---

### 2.2 Pages

A **page** is a container block that can hold other blocks.

Capabilities:

* Acts like a note
* Can be nested inside other pages
* Has metadata (title, icon, cover image)

```json
{
  "blockId": "page-uuid",
  "type": "page",
  "properties": {
    "title": "Daily Journal",
    "icon": "📓",
    "cover": "image_url"
  },
  "children": []
}
```

---

## 3. User Actions (Feature Set)

### 3.1 Page Management

Users can:

* Create new pages
* Nest pages inside pages
* Rename pages
* Delete pages
* Duplicate pages
* Move pages (drag & drop)

Keyboard shortcuts:

* `Enter` → open page
* `Backspace` on empty title → delete page
* `Cmd/Ctrl + D` → duplicate page

---

### 3.2 Block Editing

#### Supported Block Types

| Type            | Description         |
| --------------- | ------------------- |
| Paragraph       | Basic text          |
| Heading (H1–H3) | Titles              |
| Bullet List     | Unordered list      |
| Numbered List   | Ordered list        |
| To‑Do           | Checkbox list       |
| Toggle          | Collapsible content |
| Quote           | Quoted text         |
| Divider         | Horizontal line     |
| Image           | Embedded images     |
| Video           | Embedded videos     |
| File            | Attachments         |

---

### 3.3 Slash Commands

Typing `/` opens a command menu.

Examples:

* `/text`
* `/h1`
* `/image`
* `/todo`
* `/code`
* `/divider`

This menu is searchable and keyboard navigable.

---

### 3.4 Text Editing Capabilities

Supported formatting:

* Bold
* Italic
* Underline
* Strikethrough
* Inline code
* Links
* Mentions (`@page`, `@user`)

Behavior:

* Selection‑based formatting toolbar
* Markdown shortcuts (`**bold**`, `# Heading`)

---

## 4. Media Handling

### 4.1 Images

Users can:

* Upload images
* Paste images
* Drag & drop images
* Resize images
* Add captions
* Set alignment

Image block example:

```json
{
  "type": "image",
  "properties": {
    "url": "https://cdn...",
    "caption": "My setup",
    "width": 600
  }
}
```

Storage:

* Use object storage (S3, Supabase Storage)
* Store only URLs in the block data

---

### 4.2 Files & Embeds

Supported embeds:

* PDFs
* External links (preview cards)

Each embed is a block with provider metadata.

---

## 5. Data Architecture

### 5.1 Block Tree Model

Options:

**Option A: Tree stored as nested JSON**

* Easy rendering
* Harder updates

**Option B: Flat blocks with parentId (Recommended Use this)**

```json
{
  "blockId": "uuid",
  "parentId": "page-uuid",
  "type": "paragraph",
  "order": 3
}
```

Benefits:

* Efficient reordering
* Easier real‑time sync
* Scales well

---

### 5.2 Database Schema (Example)

**Blocks Collection**

| Field      | Type      |
| ---------- | --------- |
| blockId    | string    |
| parentId   | string    |
| type       | string    |
| properties | object    |
| order      | number    |
| createdAt  | timestamp |
| updatedAt  | timestamp |

---

## 6. Editing Engine

### 6.1 Editor Architecture

Recommended approach:

* Virtualized block rendering
* One editable block at a time
* Controlled content state

Libraries to consider:

* Slate.js
* ProseMirror
* TipTap
* Lexical

---

### 6.2 Undo / Redo

Implementation:

* Command‑based history
* Store diffs, not full state

```ts
interface EditorAction {
  type: 'insert' | 'delete' | 'update';
  blockId: string;
  prevState: any;
  nextState: any;
}
```

---

## 7. Collaboration (Optional Advanced Not to be implemented just yet)

Features:

* Real‑time cursors
* Live edits
* Presence indicators

Tech:

* CRDTs (Yjs, Automerge)
* WebSockets
* Firestore real‑time listeners

---

## 8. Permissions & Access

Page permissions:

* Owner
* Editor
* Viewer

Block‑level permissions inherit from page.

---

## 9. Performance Considerations

* Lazy load blocks
* Paginate long pages
* Debounce saves
* Cache editor state locally

---

## 10. UX Details That Make It Feel Like Notion

* Smooth block drag handles
* Hover‑only controls
* Keyboard‑first navigation
* Instant feedback (no save buttons)
* Subtle animations

---

## 11. Future* Extensions

* Databases (tables as blocks)
* Inline comments
* Version history
* AI‑assisted writing
* Templates

---

## 12. Platform Tailoring (Web vs Mobile)

### Web

* Keyboard-first interactions (Enter, Tab, Cmd shortcuts)
* Hover-based controls (drag handles, + buttons)
* Wide canvas with resizable blocks
* Multi-column layouts (future)

### Mobile

* Tap-first interactions
* Floating "+" insert button
* Bottom-sheet slash command menu
* Block-level drag via long-press
* Simplified formatting toolbar

---

## 13. Recommended Editor Stack

### Web (Recommended)

* **Lexical** (Meta)

  * Fast, modern, extensible
  * Great for custom block systems
* **Yjs** (optional, for collaboration)
* **React + Zustand** for editor state

### Mobile

* **React Native + Custom Block Renderer**
* Use Markdown-lite parsing per block
* Avoid heavy DOM-based editors

---

## 14. Firestore Schema (Production‑Ready, Images Excluded)

### 14.1 Collection Structure

```
users/{userId}
  └─ pages/{pageId}
  └─ blocks/{blockId}
```

Blocks are flat and reference parents by ID. No nested documents.

---

### 14.2 pages Collection

| Field        | Type          | Notes                        |
| ------------ | ------------- | ---------------------------- |
| pageId       | string        | Document ID                  |
| ownerId      | string        | Auth UID                     |
| parentPageId | string | null | Enables nested pages         |
| title        | string        | Editable title               |
| icon         | string | null | Emoji or icon key            |
| cover        | string | null | URL reference only           |
| order        | number        | Ordering among sibling pages |
| isArchived   | boolean       | Soft delete                  |
| createdAt    | timestamp     | Server timestamp             |
| updatedAt    | timestamp     | Server timestamp             |

---

### 14.3 blocks Collection

| Field       | Type      | Notes                          |
| ----------- | --------- | ------------------------------ |
| blockId     | string    | Document ID                    |
| pageId      | string    | Root page                      |
| parentId    | string    | Page or block ID               |
| type        | string    | paragraph, heading, image, etc |
| properties  | map       | Block‑specific data            |
| order       | number    | Position among siblings        |
| depth       | number    | Cached nesting depth           |
| isCollapsed | boolean   | For toggles                    |
| createdAt   | timestamp | Server timestamp               |
| updatedAt   | timestamp | Server timestamp               |

> Images, files, and videos are **never stored in Firestore**, only referenced by URL in `properties`.

---

### 14.4 Indexes (non negotiable)

* blocks: `(pageId, parentId, order)`
* pages: `(ownerId, parentPageId, order)`

---

------ | --------- |
| pageId    | string    |
| ownerId   | string    |
| title     | string    |
| icon      | string    |
| cover     | string    |
| createdAt | timestamp |
| updatedAt | timestamp |

#### blocks

| Field      | Type      |
| ---------- | --------- |
| blockId    | string    |
| pageId     | string    |
| parentId   | string    |
| type       | string    |
| properties | map       |
| order      | number    |
| createdAt  | timestamp |
| updatedAt  | timestamp |

> Image URLs are stored inside `properties`, but actual files live in object storage (not Firestore).

---

## 15. UI Wireframe Logic (Detailed)

### 15.1 Page Layout

Top to bottom:

1. Page icon + title (editable)
2. Optional cover image
3. Vertical block stack

Scrolling is per‑page, not per‑block.

---

### 15.2 Block Row Structure

Each block row contains:

* Drag handle (hidden until hover / long‑press)
* Block content area
* Inline "+" insert button

Controls never shift layout when visible.

---

### 15.3 Insertion Logic

* Enter → new block of same type
* Cmd/Ctrl + Enter → new paragraph below
* "+" button → opens block picker
* Slash command → transforms current block

---

### 15.4 Reordering Logic

* Drag handle initiates reorder
* Drop recalculates `order` for affected siblings
* Only update changed blocks

---

### 15.5 Selection & Focus

* One active block at a time
* Arrow keys move caret between blocks
* Shift + arrows → multi‑block selection

---

## 16. API Contracts

All APIs are scoped per authenticated user.

---

### 16.1 Pages API

**Create Page**

```
POST /pages
```

```json
{ "title": "New Page", "parentPageId": null }
```

**Update Page**

```
PATCH /pages/{pageId}
```

**Delete Page (Soft)**

```
DELETE /pages/{pageId}
```

---

### 16.2 Blocks API

**Create Block**

```
POST /blocks
```

```json
{ "pageId": "pageId", "parentId": "parentId", "type": "paragraph", "properties": {}, "order": 4 }
```

**Update Block**

```
PATCH /blocks/{blockId}
```

**Reorder Blocks**

```
POST /blocks/reorder
```

```json
{ "updates": [{ "blockId": "id", "order": 2 }] }
```

**Delete Block**

```
DELETE /blocks/{blockId}
```

---

## 17. MVP vs Notion-Level Feature Split

### MVP

* Pages
* Paragraphs
* Headings
* Images
* Lists
* Basic formatting

### Advanced (to be done later)

* Toggles
* Embeds
* Databases
* Collaboration
* Version history

---

### image storage
the images will be stored on supabase in a storage bucket 'n-images'

## 17. Summary

This system treats notes as **living documents**, not static text. By using a block‑based architecture, hierarchical pages, and a flexible editor engine, you can replicate and extend Notion‑level functionality while keeping your app scalable.

navigating between the trade journal screen and the notes section should be via the floating button... remove the add trade floating button on the trade journal page.. when the user is on the trade journal screen the floating button (always there adn does not disappear) should be the Notes button and when they are on the notes screen the floating button should be to lead the suer to the trade journal screen)


----------------------------------------------------------
## The Add Trade Screen UI
Have the actual exit and win, loss and breakeven section to appear directly below where the take profit section is 
Have the back button look more like it was designed by a professional not the way it is currently implemented, it looks to novice like

----------------------------------------------------------
## THE ACCOUNT TRANSACTIONS
i want that the user should be able to specify the date and time the user deposited and withdrew cash from the account and these transactions arrangement should respect the users input of date and time not the date and time the transaction information was added to the database
i want that the equity curve chat on the analytics page should use this date and time the user inputs to affect the calculation of the current balance at a particular point as well as on the accounts card and also for the dropdown to select the account to filter the information by on the trade journal, dashboard adn the analytics page's current balance of each account should be affected by the date the user inputs of when the transaction was carried out
make sure the logic for this is so that the current balance calculations match the actual current balance
i do not want that the equity curve chart should be affected by the date and time the transaction was added to the database but the calculation of the current balance, peak and drawdown should be affected by the date and time the user inputs... this means any transaction that is added to the database should be used only in the calculations of the current balance, peak and drawdown

---------------------------------------------------------
### TRADING CALENDER AND WEEKLY SUMMARY PANEL SYNC
when the user clicks the button to see the stats for a particular month either on the weekly summary panel, weekly summary panel small or the trading calender, make sure that they are in sync always such that when i press back on the weeklys summary panel and weekly summary panel small to see the previous months stats, the trading calender hould also go to that date and the same when i click on the today button or the forward button on either one of them

---------------------------------------------------------
### The calculation for loss amount 
should be improved in the sense that the amount risked is for the stop loss to take profit input... not the actual exit.... so yes, when the actual exit is below tp and the entry price the RR changes, but there should be anequal logic for when the actual exit being between the stop loss and entry and at times even beyond the stop loss in calculating the amount actually risked when the as a result of the actual exit making the trade a loss 

---------------------------------------------------------
###  
Bet. I’ll keep this **clean, brutal, and build-ready** — not academic fluff.

We’ll design **one core risk engine**, then **instrument adapters** for **FX, Gold, Commodities, and Stocks**.

This is the kind of logic you can drop straight into an app backend or mobile logic layer.

---

# 1️⃣ Core Assumptions (lock these in)

* Account currency is known (e.g. USD)
* User **must** provide a stop loss
* Risk is either:

  * `% of balance`, or
  * `fixed amount`
* Final size is **rounded DOWN** to broker-allowed increments

---

# 2️⃣ Core Data Models (pseudocode)

```plaintext
Account:
    balance
    currency

RiskConfig:
    riskType          // "PERCENT" or "FIXED"
    riskValue         // e.g. 1 or 10

Trade:
    instrumentType    // FX, GOLD, COMMODITY, STOCK
    symbol
    entryPrice
    stopLossPrice
```

---

# 3️⃣ Core Risk Engine (shared logic)

```plaintext
function calculateRiskAmount(account, riskConfig):
    if riskConfig.riskType == "PERCENT":
        return account.balance * (riskConfig.riskValue / 100)

    if riskConfig.riskType == "FIXED":
        return riskConfig.riskValue

    throw Error("Invalid risk configuration")
```

This function **never changes**.

---

# 4️⃣ FX POSITION SIZE CALCULATOR

### FX Instrument Specs

```plaintext
FXSpecs:
    lotSize           // 100000 for standard
    pipSize           // 0.0001 or 0.01 (JPY)
    quoteCurrency
```

---

### FX Logic

```plaintext
function calculateFXPositionSize(trade, fxSpecs, account, riskAmount, exchangeRate):

    stopLossPips = abs(trade.entryPrice - trade.stopLossPrice) / fxSpecs.pipSize

    if fxSpecs.quoteCurrency == account.currency:
        pipValuePerLot = fxSpecs.lotSize * fxSpecs.pipSize
    else:
        pipValuePerLot = (fxSpecs.lotSize * fxSpecs.pipSize) / exchangeRate

    riskPerLot = stopLossPips * pipValuePerLot

    lotSize = riskAmount / riskPerLot

    return roundDown(lotSize, 0.01)
```

---

# 5️⃣ GOLD (XAUUSD) POSITION SIZE CALCULATOR

Gold is just a **special commodity**, but traders mess it up constantly.

### Gold Specs

```plaintext
GoldSpecs:
    contractSize      // 100 oz
    tickSize          // 0.01
    tickValue         // 1.00 USD
```

---

### Gold Logic

```plaintext
function calculateGoldPositionSize(trade, goldSpecs, riskAmount):

    stopLossTicks = abs(trade.entryPrice - trade.stopLossPrice) / goldSpecs.tickSize

    riskPerContract = stopLossTicks * goldSpecs.tickValue

    contracts = riskAmount / riskPerContract

    return roundDown(contracts, 0.01)
```

---

# 6️⃣ GENERAL COMMODITY POSITION SIZE

Works for Oil, Silver, Indices, etc.

### Commodity Specs

```plaintext
CommoditySpecs:
    tickSize
    tickValue
```

---

### Commodity Logic

```plaintext
function calculateCommodityPositionSize(trade, commoditySpecs, riskAmount):

    stopLossTicks = abs(trade.entryPrice - trade.stopLossPrice) / commoditySpecs.tickSize

    riskPerContract = stopLossTicks * commoditySpecs.tickValue

    contracts = riskAmount / riskPerContract

    return roundDown(contracts, commoditySpecs.minContractSize)
```

---

# 7️⃣ STOCK POSITION SIZE CALCULATOR

Dead simple, but must be precise.

### Stock Logic

```plaintext
function calculateStockPositionSize(trade, riskAmount):

    riskPerShare = abs(trade.entryPrice - trade.stopLossPrice)

    shares = riskAmount / riskPerShare

    return floor(shares)
```

No decimals. Ever.

---

# 8️⃣ MAIN DISPATCHER (this is important)

This keeps your app scalable.

```plaintext
function calculatePositionSize(trade, account, riskConfig, instrumentSpecs, exchangeRate):

    riskAmount = calculateRiskAmount(account, riskConfig)

    switch trade.instrumentType:

        case "FX":
            return calculateFXPositionSize(
                trade,
                instrumentSpecs,
                account,
                riskAmount,
                exchangeRate
            )

        case "GOLD":
            return calculateGoldPositionSize(
                trade,
                instrumentSpecs,
                riskAmount
            )

        case "COMMODITY":
            return calculateCommodityPositionSize(
                trade,
                instrumentSpecs,
                riskAmount
            )

        case "STOCK":
            return calculateStockPositionSize(
                trade,
                riskAmount
            )

        default:
            throw Error("Unsupported instrument type")
```

---

# 9️⃣ Mandatory Safety Checks (don’t skip these)

```plaintext
if trade.entryPrice == trade.stopLossPrice:
    throw Error("Stop loss cannot equal entry")

if positionSize <= 0:
    throw Error("Position size too small for selected risk")
```

---

# 🔥 Final Notes (real talk)

* This logic matches **prop firm risk engines**
* You’re not guessing — you’re **engineering risk**

---------------------------------------------------------
striclty follow all the instructions i have given you and by all means before ever giving me a summary of any changes you make, make sure that there are no erros by running the npx tsc --noEmit command

scan the entire codebase to understand the current code implementation and then define the logic for how you are going to improve the code to reflect the changes i have requested

1. Continue autiimatically meanign if there are any next steps just proceed to do them without having to ask me
2. Make sure to check for any errors you may have caused in the codebase before you give me any overviews of the work done to ensure there are no errors\
3. Focus on the work and only on the things i have asked you to do without touhing any other unrelated code or breaking the code entirely. Only focus on the concerned parts
