import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";

import { SAVED_TITLE, NOTHING_SAVED_SUMMARY } from "@/components/app-shell/saved-format";
import { SavedScreen } from "@/components/app-shell/saved-screen";
import { SavedSections } from "@/features/annotation/presentation/components/saved-sections";
import { SavedSectionsData } from "@/features/annotation/presentation/data/saved-sections-data";
import {
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";
import {
  savedCardsSectionLabel,
  savedCoreRulesSectionLabel,
} from "@/features/annotation/presentation/saved-subjects-format";
import { keptCountsOf } from "@/features/annotation/presentation/saved-subjects";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

import {
  createBookmarkStore,
  createNoteStore,
  createSubjectStore,
  fixedClock,
  sequentialIds,
  subject,
  writtenNote,
  type NoteStore,
} from "../annotation/fixtures";
import { coreRuleDocument } from "../rules/fixtures";
import { createTestWrapper, type TestFrame } from "../test-wrapper";

const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const CARD = subject("card", "vi");
const CORE_RULE = subject("coreRule", "104.2");
const DOCUMENT = coreRuleDocument([{ number: "104.2", body: "A player may pass priority." }]);
const PHONE = { height: 874, width: 402 } as const;
const TABLET = { height: 1280, width: 800 } as const;
const SCROLLING_AREA = "RCTScrollView";
const VI = {
  printingId: printingIdSchema.parse("vi"),
  riftboundId: "ogn-119-298",
  name: "Vi",
  domainIds: ["Fury"],
  orientation: "portrait",
  imageUrl: "http://localhost:8787/ogn-119-298.webp",
} as const satisfies CardSummary;

async function renderSaved(
  store: NoteStore = createNoteStore(),
  marked: readonly AnnotationSubject[] = [],
  frame: TestFrame = PHONE,
): Promise<NoteStore> {
  const bookmarks = createBookmarkStore(marked);
  const subjects = createSubjectStore([VI], DOCUMENT);

  await render(
    <SavedSectionsData
      bookmarkManager={bookmarks.manager}
      cardSummariesFinder={subjects.cardSummariesFinder}
      clock={fixedClock(WRITTEN_AT)}
      coreRulesFinder={subjects.coreRulesFinder}
      idGenerator={sequentialIds()}
      noteManager={store.manager}
    >
      {(saved) => (
        <SavedScreen
          counts={keptCountsOf(saved.sections)}
          sections={<SavedSections saved={saved} />}
        />
      )}
    </SavedSectionsData>,
    { wrapper: createTestWrapper(frame) },
  );
  await screen.findByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` });

  return store;
}

async function addScratchpadNote(body: string) {
  await fireEvent.press(
    screen.getByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` }),
  );
  await fireEvent.changeText(screen.getByLabelText(`New note on ${SCRATCHPAD_NOTES_NAME}`), body);
  await fireEvent.press(
    screen.getByRole("button", { name: `Save the new note on ${SCRATCHPAD_NOTES_NAME}` }),
  );
}

type RenderedNode = ReturnType<typeof screen.getByRole>;

function sectionHeader(label: string): RenderedNode {
  return screen.getByRole("header", { name: label });
}

function ancestorsOf(node: RenderedNode): readonly RenderedNode[] {
  const chain: RenderedNode[] = [];

  for (let above = node.parent; above !== null; above = above.parent) chain.push(above);

  return chain;
}

function nearestHolderOf(one: RenderedNode, other: RenderedNode): RenderedNode {
  const above = new Set(ancestorsOf(one));
  const shared = ancestorsOf(other).find((node) => above.has(node));

  if (shared === undefined) throw new Error("the two sections stand in separate trees");

  return shared;
}

function scrollingAreasIn(nodes: readonly RenderedNode[]): readonly RenderedNode[] {
  return nodes.filter((node) => node.type === SCROLLING_AREA);
}

function scrollingAreaOf(node: RenderedNode): RenderedNode {
  const [nearest] = scrollingAreasIn(ancestorsOf(node));

  if (nearest === undefined) throw new Error("the section stands in nothing that scrolls");

  return nearest;
}

describe("the saved screen", () => {
  it("should name itself and hold the scratchpad the rules tab used to", async () => {
    await renderSaved();

    expect(screen.getByRole("header", { name: SAVED_TITLE })).toBeTruthy();
    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
  });

  it("should hold a note on a card beside the scratchpad rather than in it", async () => {
    await renderSaved(
      createNoteStore([writtenNote("note-1", CARD, "Holds the point.", WRITTEN_AT)]),
    );

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: VI.name })).toBeTruthy();
    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
    expect(screen.getByLabelText(`0 notes on ${SCRATCHPAD_NOTES_NAME}`)).toBeTruthy();
  });

  it("should ask the notes table once for every section it shows", async () => {
    const store = await renderSaved(
      createNoteStore([writtenNote("note-1", CARD, "Holds the point.", WRITTEN_AT)]),
    );

    expect(store.scopes()).toEqual([{ type: "all" }]);
  });

  it("should store a note written from it against no subject at all", async () => {
    const store = await renderSaved();

    await addScratchpadNote("Match one: mulliganed two.");

    await waitFor(() => expect(store.notes()).toHaveLength(1));
    expect(store.notes()[0]?.subject).toBeNull();
    await expect(store.manager.getAll({ type: "onSubject", subject: CARD })).resolves.toEqual([]);
  });

  it("should read the notes back once when one is written from the scratchpad", async () => {
    const store = await renderSaved();

    await addScratchpadNote("Match one: mulliganed two.");

    await screen.findByLabelText(`Note 1 on ${SCRATCHPAD_NOTES_NAME}`);
    expect(store.scopes()).toEqual([{ type: "all" }, { type: "all" }]);
  });
});

describe("the columns the saved sections stand in", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should stand every section under one another while only one column fits", async () => {
    await renderSaved(createNoteStore(), [], PHONE);

    const holder = nearestHolderOf(
      sectionHeader(SCRATCHPAD_TITLE),
      sectionHeader(savedCardsSectionLabel(0)),
    );

    expect(
      within(holder).getByRole("header", { name: savedCoreRulesSectionLabel(0) }),
    ).toBeTruthy();
  });

  it("should cut three sections into two columns, the earlier one taking the remainder", async () => {
    await renderSaved(createNoteStore(), [], TABLET);

    const holder = nearestHolderOf(
      sectionHeader(SCRATCHPAD_TITLE),
      sectionHeader(savedCardsSectionLabel(0)),
    );

    expect(
      within(holder).queryByRole("header", { name: savedCoreRulesSectionLabel(0) }),
    ).toBeNull();
  });

  it("should keep that arrangement with a note written in every section", async () => {
    await renderSaved(
      createNoteStore([
        writtenNote("note-1", CARD, "Holds the point.", WRITTEN_AT),
        writtenNote("note-2", CORE_RULE, "Priority passes.", WRITTEN_AT),
      ]),
      [],
      TABLET,
    );

    const holder = nearestHolderOf(
      sectionHeader(SCRATCHPAD_TITLE),
      sectionHeader(savedCardsSectionLabel(1)),
    );

    expect(
      within(holder).queryByRole("header", { name: savedCoreRulesSectionLabel(1) }),
    ).toBeNull();
  });
});

describe("the scrolling of the saved columns", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should give each column a scrolling area of its own, with none above them", async () => {
    await renderSaved(createNoteStore(), [], TABLET);

    const scratchpad = scrollingAreaOf(sectionHeader(SCRATCHPAD_TITLE));
    const rules = scrollingAreaOf(sectionHeader(savedCoreRulesSectionLabel(0)));

    expect(rules).not.toBe(scratchpad);
    expect(scrollingAreasIn([...ancestorsOf(scratchpad), ...ancestorsOf(rules)])).toEqual([]);
  });

  it("should scroll the one column a phone fits, every section riding with it", async () => {
    await renderSaved(createNoteStore(), [], PHONE);

    const scratchpad = scrollingAreaOf(sectionHeader(SCRATCHPAD_TITLE));

    expect(scrollingAreaOf(sectionHeader(savedCoreRulesSectionLabel(0)))).toBe(scratchpad);
    expect(scrollingAreasIn(ancestorsOf(scratchpad))).toEqual([]);
  });
});

describe("the saved summary", () => {
  it("should say nothing is saved while neither act has filed anything", async () => {
    await renderSaved();

    expect(screen.getByText(NOTHING_SAVED_SUMMARY)).toBeTruthy();
  });

  it("should count what stands in each section once something is written", async () => {
    await renderSaved();

    await addScratchpadNote("Trades to chase.");

    expect(await screen.findByText("1 standalone note")).toBeTruthy();
    expect(screen.queryByText(NOTHING_SAVED_SUMMARY)).toBeNull();
  });

  it("should count the subjects that are kept, whichever act filed each one", async () => {
    await renderSaved(
      createNoteStore([writtenNote("note-1", CORE_RULE, "Priority passes.", WRITTEN_AT)]),
      [CARD],
    );

    expect(screen.getByText("1 card · 1 rule")).toBeTruthy();
  });

  it("should count a subject that is both bookmarked and noted once", async () => {
    await renderSaved(
      createNoteStore([
        writtenNote("note-1", CARD, "Holds the point.", WRITTEN_AT),
        writtenNote("note-2", CARD, "Trade it instead.", WRITTEN_AT),
      ]),
      [CARD],
    );

    expect(screen.getByText("1 card")).toBeTruthy();
  });

  it("should count the scratchpad by its notes, having no subject to keep", async () => {
    await renderSaved(
      createNoteStore([
        writtenNote("note-1", null, "Trades to chase.", WRITTEN_AT),
        writtenNote("note-2", null, "Round three went long.", WRITTEN_AT),
      ]),
    );

    expect(screen.getByText("2 standalone notes")).toBeTruthy();
  });
});
