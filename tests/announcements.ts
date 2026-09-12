import { AccessibilityInfo } from "react-native";

interface Announcement {
  readonly message: string;
  readonly queued: boolean;
}

/** Captures what the screen reader would have been told, in order. */
function recordAnnouncements(): Announcement[] {
  const announcements: Announcement[] = [];

  jest
    .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
    .mockImplementation((message, options) => {
      announcements.push({ message, queued: options.queue === true });
    });

  return announcements;
}

export { recordAnnouncements };
export type { Announcement };
