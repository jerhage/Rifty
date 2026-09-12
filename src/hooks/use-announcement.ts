import { useCallback } from "react";
import { AccessibilityInfo } from "react-native";

type AnnouncementUrgency = "interrupting" | "queued";

type Announce = (message: string, urgency?: AnnouncementUrgency) => void;

/** Speaks a message to the screen reader, and does nothing when none is running. */
function useAnnouncement(): Announce {
  return useCallback((message: string, urgency: AnnouncementUrgency = "queued") => {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, {
      queue: urgency === "queued",
    });
  }, []);
}

export { useAnnouncement };
export type { Announce, AnnouncementUrgency };
