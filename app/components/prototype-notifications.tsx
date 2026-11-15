// PROTOTYPE (Issue #8): Three radically different variants of Cadence's in-app notification UI
// (Knock prebuilt popover vs. custom slide-over drawer vs. top-right floating bell & split tray),
// switchable via ?variant=A|B|C on any authenticated route inside layout.app.tsx.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Archive,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Inbox,
  Layers,
  MessageSquare,
  Receipt,
  RotateCcw,
  Settings,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { UserRole } from "~/db/schema";
import { cn } from "~/lib/utils";
import type { PrototypeVariantMeta } from "~/components/prototype-switcher";

export type PrototypeVariantKey = "A" | "B" | "C";

export const NOTIFICATION_VARIANTS: PrototypeVariantMeta[] = [
  {
    key: "A",
    name: "Knock Prebuilt Popover",
    summary:
      "Sidebar-header bell + Knock-style floating popover (@knocklabs/react look): flat chronological feed, All/Unread dropdown, hover archive, footer link to /settings.",
  },
  {
    key: "B",
    name: "Custom Slide-Over Drawer",
    summary:
      "Sidebar nav 'Inbox' item + full-height right-hand slide-over drawer over Knock hooks: category tabs, Today/Earlier grouping, inline quote/amount previews, explicit deep-link CTAs.",
  },
  {
    key: "C",
    name: "Top-Right Floating Bell",
    summary:
      "Sidebar untouched; floating top-right bell pill in main viewport opening a split New/Earlier tray with optional group-by-course and two-step quick-peek.",
  },
];

export interface PrototypeNotification {
  id: string;
  category: "comment" | "course" | "refund" | "team";
  actorName: string;
  title: string;
  body: string;
  previewQuote?: string;
  courseTitle?: string;
  deepLink: string;
  deepLinkLabel: string;
  createdAtLabel: string;
  groupBucket: "Today" | "Earlier";
  read: boolean;
  archived: boolean;
}

export function getSeedNotifications(
  role: UserRole | null,
  isTeamAdmin: boolean
): PrototypeNotification[] {
  if (role === UserRole.Instructor) {
    return [
      {
        id: "inst-1",
        category: "comment",
        actorName: "Maya Lin",
        title: "New question on TypeScript Fundamentals",
        body: "Asked in Lesson 3: Error Handling Patterns",
        previewQuote:
          "Should we prefer discriminated unions over thrown exceptions for loader validation?",
        courseTitle: "TypeScript Fundamentals",
        deepLink: "/instructor/questions",
        deepLinkLabel: "Reply to question",
        createdAtLabel: "8m ago",
        groupBucket: "Today",
        read: false,
        archived: false,
      },
      {
        id: "inst-2",
        category: "course",
        actorName: "Cadence",
        title: "3 new Students enrolled",
        body: "TypeScript Fundamentals reached 42 active Enrollments this week.",
        courseTitle: "TypeScript Fundamentals",
        deepLink: "/instructor/analytics",
        deepLinkLabel: "View analytics",
        createdAtLabel: "2h ago",
        groupBucket: "Today",
        read: false,
        archived: false,
      },
      {
        id: "inst-3",
        category: "comment",
        actorName: "Samir Patel",
        title: "Replied on React Router Data Flow",
        body: "Commented on Lesson 1: Loaders & Actions",
        previewQuote: "That diagram made route revalidation click immediately.",
        courseTitle: "React Router Data Flow",
        deepLink: "/instructor/questions",
        deepLinkLabel: "View thread",
        createdAtLabel: "Yesterday",
        groupBucket: "Earlier",
        read: true,
        archived: false,
      },
    ];
  }

  if (role === UserRole.Admin) {
    return [
      {
        id: "adm-1",
        category: "refund",
        actorName: "Alex Rivera",
        title: "Open Refund Request ($99.00)",
        body: "Individual Purchase · TypeScript Fundamentals (12m Watched, under Watch Limit).",
        previewQuote: "Bought the wrong course level — meant to pick Advanced.",
        courseTitle: "TypeScript Fundamentals",
        deepLink: "/admin/refunds",
        deepLinkLabel: "Review Refund Request",
        createdAtLabel: "14m ago",
        groupBucket: "Today",
        read: false,
        archived: false,
      },
      {
        id: "adm-2",
        category: "refund",
        actorName: "Stripe Webhook",
        title: "Failed Refund requires attention",
        body: "Approved Refund Request #18 ($249.00) failed payout; card expired.",
        courseTitle: "Team Licence #14",
        deepLink: "/admin/refunds",
        deepLinkLabel: "Inspect Refund",
        createdAtLabel: "3h ago",
        groupBucket: "Today",
        read: false,
        archived: false,
      },
      {
        id: "adm-3",
        category: "course",
        actorName: "Elena Vance",
        title: "Course published: Drizzle ORM Deep Dive",
        body: "4 modules, 18 lessons are now live in the catalog.",
        courseTitle: "Drizzle ORM Deep Dive",
        deepLink: "/admin/courses",
        deepLinkLabel: "Manage courses",
        createdAtLabel: "2d ago",
        groupBucket: "Earlier",
        read: true,
        archived: false,
      },
    ];
  }

  const studentItems: PrototypeNotification[] = [
    {
      id: "stu-1",
      category: "comment",
      actorName: "Elena Vance (Instructor)",
      title: "Replied to your comment",
      body: "In TypeScript Fundamentals · Lesson 2: Narrowing",
      previewQuote:
        "Great catch! Using `satisfies` keeps the literal keys intact without widening.",
      courseTitle: "TypeScript Fundamentals",
      deepLink: "/courses",
      deepLinkLabel: "Jump to comment",
      createdAtLabel: "12m ago",
      groupBucket: "Today",
      read: false,
      archived: false,
    },
    {
      id: "stu-2",
      category: "course",
      actorName: "Cadence",
      title: "2 new lessons added",
      body: "Module 3 of TypeScript Fundamentals now has Generics & Mapped Types.",
      courseTitle: "TypeScript Fundamentals",
      deepLink: "/dashboard",
      deepLinkLabel: "Resume course",
      createdAtLabel: "1h ago",
      groupBucket: "Today",
      read: false,
      archived: false,
    },
    {
      id: "stu-3",
      category: "refund",
      actorName: "Cadence Billing",
      title: "Approved Refund Request ($79.00)",
      body: "Your Refund for Intro to CSS Grid is now Pending Refund to your original card.",
      courseTitle: "Intro to CSS Grid",
      deepLink: "/settings",
      deepLinkLabel: "View status",
      createdAtLabel: "Yesterday",
      groupBucket: "Earlier",
      read: true,
      archived: false,
    },
  ];

  if (isTeamAdmin) {
    studentItems.unshift({
      id: "team-1",
      category: "team",
      actorName: "Team Licence",
      title: "All 5 Seats claimed",
      body: "Every Seat on your TypeScript Fundamentals Team Licence is now active.",
      courseTitle: "TypeScript Fundamentals",
      deepLink: "/team",
      deepLinkLabel: "Manage Team",
      createdAtLabel: "5m ago",
      groupBucket: "Today",
      read: false,
      archived: false,
    });
  }

  return studentItems;
}

export function usePrototypeNotifications(
  userId: number | null,
  role: UserRole | null,
  isTeamAdmin: boolean
) {
  const [items, setItems] = useState<PrototypeNotification[]>(() =>
    getSeedNotifications(role, isTeamAdmin)
  );
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [lastAction, setLastAction] = useState<string>("initialized");
  const [lastDeepLink, setLastDeepLink] = useState<string | null>(null);

  useEffect(() => {
    setItems(getSeedNotifications(role, isTeamAdmin));
    setSimulateEmpty(false);
    setLastAction(`switched-user(${userId ?? "anon"}:${role ?? "none"})`);
    setLastDeepLink(null);
  }, [userId, role, isTeamAdmin]);

  const visibleItems = simulateEmpty
    ? []
    : items.filter((item) => !item.archived);
  const unreadCount = visibleItems.filter((i) => !i.read).length;

  function markRead(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i))
    );
    setLastAction(`markRead(${id})`);
  }

  function toggleRead(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: !i.read } : i))
    );
    setLastAction(`toggleRead(${id})`);
  }

  function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setLastAction("markAllRead()");
  }

  function archive(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, archived: true } : i))
    );
    setLastAction(`archive(${id})`);
  }

  function resetDemo() {
    setItems(getSeedNotifications(role, isTeamAdmin));
    setSimulateEmpty(false);
    setLastAction("resetDemo()");
    setLastDeepLink(null);
  }

  function toggleEmpty() {
    setSimulateEmpty((prev) => {
      setLastAction(`simulateEmpty(${!prev})`);
      return !prev;
    });
  }

  return {
    items: visibleItems,
    unreadCount,
    simulateEmpty,
    lastAction,
    lastDeepLink,
    setLastDeepLink,
    markRead,
    toggleRead,
    markAllRead,
    archive,
    resetDemo,
    toggleEmpty,
  };
}

export type PrototypeNotificationStore = ReturnType<
  typeof usePrototypeNotifications
>;

function CategoryIcon({
  category,
  className,
}: {
  category: PrototypeNotification["category"];
  className?: string;
}) {
  switch (category) {
    case "comment":
      return <MessageSquare className={cn("size-4 text-blue-500", className)} />;
    case "refund":
      return <Receipt className={cn("size-4 text-amber-500", className)} />;
    case "team":
      return <UsersRound className={cn("size-4 text-violet-500", className)} />;
    case "course":
    default:
      return <BookOpen className={cn("size-4 text-emerald-500", className)} />;
  }
}

function DemoControlsBar({ store }: { store: PrototypeNotificationStore }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
      <button
        type="button"
        onClick={store.toggleEmpty}
        className="hover:text-foreground underline-offset-2 hover:underline"
      >
        {store.simulateEmpty ? "Show sample items" : "Simulate empty"}
      </button>
      <button
        type="button"
        onClick={store.resetDemo}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        <RotateCcw className="size-3" />
        Reset
      </button>
    </div>
  );
}

/**
 * VARIANT A: Knock Prebuilt Popover
 * Bell in sidebar header, anchored floating popover mirroring @knocklabs/react's NotificationFeedPopover.
 */
export function VariantASidebarBell({
  store,
  onSelectDeepLink,
}: {
  store: PrototypeNotificationStore;
  onSelectDeepLink?: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const filtered =
    filter === "unread" ? store.items.filter((i) => !i.read) : store.items;

  function handleOpenItem(item: PrototypeNotification) {
    store.markRead(item.id);
    store.setLastDeepLink(item.deepLink);
    setOpen(false);
    onSelectDeepLink?.(item.deepLink);
    navigate(item.deepLink);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label="Notifications"
        title="Notifications (Variant A: Knock Popover)"
      >
        <Bell className="size-4" />
        {store.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {store.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-56 top-3 z-50 ml-2 flex w-[380px] max-w-[calc(100vw-15rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
            {/* Knock-style header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Notifications</span>
                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value as "all" | "unread")
                  }
                  className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                  aria-label="Filter notifications"
                >
                  <option value="all">All ({store.items.length})</option>
                  <option value="unread">Unread ({store.unreadCount})</option>
                </select>
              </div>
              <button
                type="button"
                onClick={store.markAllRead}
                disabled={store.unreadCount === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-40 dark:text-blue-400"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            </div>

            {/* Knock-style flat feed */}
            <div className="max-h-[380px] divide-y divide-border overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
                    <Bell className="size-5" />
                  </div>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {filter === "unread"
                      ? "You're all caught up on unread notifications."
                      : "We'll notify you here when something happens."}
                  </p>
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                      !item.read && "bg-blue-500/[0.04]"
                    )}
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <CategoryIcon category={item.category} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-xs font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {item.actorName} · {item.createdAtLabel}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {!item.read && (
                        <span
                          className="mt-1 size-2 rounded-full bg-blue-600"
                          title="Unread"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => store.archive(item.id)}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        title="Archive"
                        aria-label="Archive notification"
                      >
                        <Archive className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Knock footer + preferences link */}
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-3.5" />
                Notification Preferences
              </button>
              <span className="text-[10px] text-muted-foreground/70">
                Powered by Knock UI
              </span>
            </div>
            <DemoControlsBar store={store} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * VARIANT B: Custom Slide-Over Drawer
 * Sidebar nav "Inbox" item + full-height right-hand drawer over custom Knock hooks.
 */
export function VariantBSidebarNavAndDrawer({
  store,
}: {
  store: PrototypeNotificationStore;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread" | "comment" | "refund">("all");
  const navigate = useNavigate();

  const filtered = store.items.filter((item) => {
    if (tab === "unread") return !item.read;
    if (tab === "comment") return item.category === "comment";
    if (tab === "refund") return item.category === "refund";
    return true;
  });

  const todayItems = filtered.filter((i) => i.groupBucket === "Today");
  const earlierItems = filtered.filter((i) => i.groupBucket === "Earlier");

  function openDeepLink(item: PrototypeNotification) {
    store.markRead(item.id);
    store.setLastDeepLink(item.deepLink);
    setOpen(false);
    navigate(item.deepLink);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
          open
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <span className="flex items-center gap-3">
          <Inbox className="size-4" />
          Inbox
        </span>
        {store.unreadCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {store.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-full max-w-[440px] flex-col border-l border-border bg-background text-foreground shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Inbox</h2>
                  {store.unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {store.unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Activity across your courses and account
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={store.markAllRead}
                  disabled={store.unreadCount === 0}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close inbox"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1 border-b border-border px-5 py-2">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread" },
                  { id: "comment", label: "Comments" },
                  { id: "refund", label: "Refunds" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Grouped Feed */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="mb-3 size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">
                    {tab === "all"
                      ? "Your inbox is empty"
                      : `No ${tab} notifications`}
                  </p>
                  <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                    {tab !== "all"
                      ? "Try switching back to All to see earlier updates."
                      : "New comments, course updates, and refund decisions will appear here."}
                  </p>
                  {tab !== "all" && (
                    <button
                      type="button"
                      onClick={() => setTab("all")}
                      className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Show all
                    </button>
                  )}
                </div>
              ) : (
                [
                  { label: "Today", list: todayItems },
                  { label: "Earlier", list: earlierItems },
                ]
                  .filter((g) => g.list.length > 0)
                  .map((group) => (
                    <section key={group.label} className="space-y-2.5">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </h3>
                      <div className="space-y-2.5">
                        {group.list.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded-lg border p-3.5 transition-colors",
                              !item.read
                                ? "border-l-4 border-l-primary border-border bg-card shadow-xs"
                                : "border-border/70 bg-muted/20 opacity-85"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <CategoryIcon category={item.category} />
                                {item.courseTitle && (
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {item.courseTitle}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {item.createdAtLabel}
                              </span>
                            </div>

                            <h4 className="mt-2 text-sm font-semibold">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.body}
                            </p>

                            {item.previewQuote && (
                              <blockquote className="mt-2 border-l-2 border-border pl-2.5 text-xs italic text-muted-foreground">
                                "{item.previewQuote}"
                              </blockquote>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => openDeepLink(item)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                {item.deepLinkLabel}
                                <ChevronRight className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => store.toggleRead(item.id)}
                                className="text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                {item.read ? "Mark unread" : "Mark read"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-3.5" />
                Notification Preferences
              </button>
              <span className="text-[11px] text-muted-foreground">
                Custom Hooks UI
              </span>
            </div>
            <DemoControlsBar store={store} />
          </aside>
        </div>
      )}
    </>
  );
}

/**
 * VARIANT C: Top-Right Floating Bell + Split New/Earlier Tray
 * Leaves sidebar untouched; mounts a floating top-right utility bell in <main>.
 */
export function VariantCFloatingBell({
  store,
}: {
  store: PrototypeNotificationStore;
}) {
  const [open, setOpen] = useState(false);
  const [groupByCourse, setGroupByCourse] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const unreadItems = store.items.filter((i) => !i.read);
  const readItems = store.items.filter((i) => i.read);

  function goToDeepLink(item: PrototypeNotification) {
    store.markRead(item.id);
    store.setLastDeepLink(item.deepLink);
    setOpen(false);
    navigate(item.deepLink);
  }

  function renderSplitRow(item: PrototypeNotification) {
    const isExpanded = expandedId === item.id;
    return (
      <div
        key={item.id}
        className="rounded-lg border border-border/70 bg-background p-2.5 transition-colors hover:border-border"
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() =>
              setExpandedId((cur) => (cur === item.id ? null : item.id))
            }
            className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
          >
            <div className="mt-0.5 shrink-0">
              <CategoryIcon category={item.category} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">
                  {item.title}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {item.createdAtLabel}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {item.body}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2.5 border-t border-border/60 pt-2 text-xs">
            {item.previewQuote && (
              <p className="mb-2 rounded bg-muted/60 px-2.5 py-1.5 text-[11px] italic text-muted-foreground">
                "{item.previewQuote}"
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => goToDeepLink(item)}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                {item.deepLinkLabel}
                <ChevronRight className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => store.toggleRead(item.id)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Check className="size-3" />
                {item.read ? "Mark unread" : "Mark read"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const courseGroups = Array.from(
    store.items.reduce((acc, item) => {
      const key = item.courseTitle ?? "General";
      acc.set(key, [...(acc.get(key) ?? []), item]);
      return acc;
    }, new Map<string, PrototypeNotification[]>())
  );

  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur transition-colors hover:bg-muted"
        aria-label="Toggle notifications tray"
      >
        <Bell className="size-4" />
        <span>Inbox</span>
        {store.unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {store.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-40 mt-2 flex w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGroupByCourse((g) => !g)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    groupByCourse
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Layers className="size-3" />
                  By course
                </button>
                <button
                  type="button"
                  onClick={store.markAllRead}
                  disabled={store.unreadCount === 0}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Clear unread
                </button>
              </div>
            </div>

            <div className="max-h-[400px] space-y-4 overflow-y-auto p-3">
              {store.items.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto mb-2 size-6 text-muted-foreground/50" />
                  <p className="text-sm font-medium">All caught up</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No notifications to show right now.
                  </p>
                </div>
              ) : groupByCourse ? (
                courseGroups.map(([courseTitle, groupItems]) => (
                  <div key={courseTitle} className="space-y-1.5">
                    <div className="px-1 text-[11px] font-semibold text-muted-foreground">
                      {courseTitle}
                    </div>
                    <div className="space-y-1.5">
                      {groupItems.map(renderSplitRow)}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {unreadItems.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                        <span>New ({unreadItems.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {unreadItems.map(renderSplitRow)}
                      </div>
                    </div>
                  )}
                  {readItems.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Earlier ({readItems.length})
                      </div>
                      <div className="space-y-1.5 opacity-80">
                        {readItems.map(renderSplitRow)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-3.5" />
                Preferences
              </button>
              <span className="text-[10px] text-muted-foreground">
                Click row to peek · CTA to navigate
              </span>
            </div>
            <DemoControlsBar store={store} />
          </div>
        </>
      )}
    </div>
  );
}
