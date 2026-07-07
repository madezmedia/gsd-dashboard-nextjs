import { jsx as n, jsxs as u, Fragment as Ce } from "react/jsx-runtime";
import ae, { createContext as Ee, useContext as Re, useRef as V, useState as $, useEffect as H, useCallback as g, useMemo as Z, isValidElement as va, cloneElement as ya, memo as ka, useLayoutEffect as Ta } from "react";
import { useStore as _e } from "zustand/react";
import { createAcpProvider as Na, acpStore as se, createFileSystemProvider as Da, createSession as La, RequestError as Pa, loadSession as Ia, selectSession as $a, closeSession as Aa, deleteSession as Va, forkSession as Ma, refreshSessions as Fa, loadMoreSessions as xa, sessionStore as ve, fileTreeStore as Ba, loadFileTree as Ea, expandDirectory as Ra, collapseDirectory as za, sendPrompt as Oa, cancelPrompt as Ha, setSessionConfigOption as Wa, respondToPermission as Ua, denyPermission as qa, authenticate as Ga, authenticateWithEnv as ja, callExtMethod as Ka, sendExtNotification as Xa } from "@acp-components/core";
import { createInstance as Ja } from "i18next";
import { I18nextProvider as Qa, initReactI18next as Ya, useTranslation as B } from "react-i18next";
import { useTranslation as Jl } from "react-i18next";
import { SettingOutlined as Za, BgColorsOutlined as en, GlobalOutlined as la, PlusOutlined as pa, RightOutlined as be, FolderOutlined as da, FolderOpenOutlined as ua, MessageOutlined as an, ForkOutlined as nn, CloseOutlined as ze, FileTextOutlined as ye, ArrowLeftOutlined as ma, DownOutlined as tn, ToolOutlined as sn, SyncOutlined as _a, BulbOutlined as on, ThunderboltOutlined as cn, SearchOutlined as rn, InboxOutlined as ln, DeleteOutlined as pn, EditOutlined as ga, CheckCircleFilled as dn, CheckCircleOutlined as un, LinkOutlined as ha, CheckOutlined as mn, CopyOutlined as _n, PaperClipOutlined as gn, PauseOutlined as hn, ArrowUpOutlined as fn } from "@ant-design/icons";
import bn from "react-markdown";
import wn from "remark-gfm";
import { Virtuoso as Sn } from "react-virtuoso";
import { createPortal as Cn } from "react-dom";
const fa = Ee(null);
function ke() {
  const a = Re(fa);
  if (!a)
    throw new Error("useAcpContext must be used within an AcpProvider");
  return a;
}
const xe = Ee(null);
function vn() {
  const a = Re(xe);
  if (!a)
    throw new Error("useSettings must be used within a SettingsContext.Provider");
  return a;
}
const qe = (a) => Symbol.iterator in a, Ge = (a) => (
  // HACK: avoid checking entries type
  "entries" in a
), je = (a, e) => {
  const t = a instanceof Map ? a : new Map(a.entries()), s = e instanceof Map ? e : new Map(e.entries());
  if (t.size !== s.size)
    return !1;
  for (const [o, c] of t)
    if (!s.has(o) || !Object.is(c, s.get(o)))
      return !1;
  return !0;
}, yn = (a, e) => {
  const t = a[Symbol.iterator](), s = e[Symbol.iterator]();
  let o = t.next(), c = s.next();
  for (; !o.done && !c.done; ) {
    if (!Object.is(o.value, c.value))
      return !1;
    o = t.next(), c = s.next();
  }
  return !!o.done && !!c.done;
};
function kn(a, e) {
  return Object.is(a, e) ? !0 : typeof a != "object" || a === null || typeof e != "object" || e === null || Object.getPrototypeOf(a) !== Object.getPrototypeOf(e) ? !1 : qe(a) && qe(e) ? Ge(a) && Ge(e) ? je(a, e) : yn(a, e) : je(
    { entries: () => Object.entries(a) },
    { entries: () => Object.entries(e) }
  );
}
function Ve(a) {
  const e = ae.useRef(void 0);
  return (t) => {
    const s = a(t);
    return kn(e.current, s) ? e.current : e.current = s;
  };
}
function Tn(a) {
  const e = V(null), [t, s] = $(!1);
  e.current || (e.current = Na(a)), H(() => {
    const m = e.current, w = m.subscribe(() => {
      s(m.ready);
    });
    return m.ready && s(!0), () => {
      w(), m.destroy();
    };
  }, []);
  const o = _e(se, Ve((m) => Array.from(m.agents.values()))), c = _e(se, Ve((m) => Array.from(m.workspaces.values()))), r = g((m) => {
    var w;
    return ((w = e.current) == null ? void 0 : w.getClient(m)) ?? null;
  }, []), i = g(async (m) => {
    var w;
    await ((w = e.current) == null ? void 0 : w.addAgent(m));
  }, []), l = g(async (m) => {
    var w;
    await ((w = e.current) == null ? void 0 : w.removeAgent(m));
  }, []), p = g((m) => {
    se.getState().addWorkspace(m);
  }, []), _ = g((m) => {
    se.getState().removeWorkspace(m);
  }, []);
  return {
    getClient: r,
    agents: o,
    workspaces: c,
    addAgent: i,
    removeAgent: l,
    addWorkspace: p,
    removeWorkspace: _,
    isReady: t
  };
}
function Nn(a) {
  const e = V(null);
  return e.current || (e.current = Da(a)), H(() => () => {
    var t;
    (t = e.current) == null || t.destroy(), e.current = null;
  }, []), e.current;
}
const Dn = {
  // CommandPalette
  "commandPalette.open": "Open command palette",
  "commandPalette.commands": "Commands",
  "commandPalette.searchPlaceholder": "Search commands...",
  "commandPalette.filterCommands": "Filter commands",
  "commandPalette.noMatching": "No matching commands",
  // ChatComposer
  "composer.placeholder": "Type a message... (Enter to send, / for commands)",
  "composer.ariaLabel": "Message input",
  "composer.cancelAriaLabel": "Cancel generation",
  "composer.cancel": "Cancel",
  "composer.sendAriaLabel": "Send message",
  "composer.send": "Send (Enter)",
  "composer.attachFile": "Attach file",
  "composer.attachFileAriaLabel": "Attach a file",
  "composer.removeFileAriaLabel": "Remove file",
  // ChatView
  "chat.emptyState": "Select or create a session to begin",
  "chat.title": "Chat",
  "chat.scrollToBottom": "Scroll to bottom",
  // Workbench
  "workbench.ariaLabel": "ACP Workbench",
  "workbench.resizeSidebar": "Resize sidebar",
  "workbench.resizePanel": "Resize panel",
  // PermissionDialog
  "permission.ariaLabel": "Permission required",
  "permission.title": "Permission Required",
  "permission.description": "The agent wants to execute a tool that requires your approval.",
  "permission.deny": "Deny",
  "permission.allow": "Allow",
  // SessionList
  "sessionList.title": "Workspaces",
  "sessionList.newSession": "New session",
  "sessionList.deleteSession": "Delete session",
  "sessionList.forkSession": "Fork session",
  "sessionList.defaultSessionTitle": "New Session",
  "sessionList.emptyState": "No sessions yet. Click + to start.",
  "sessionList.loadMore": "Load more",
  "sessionList.statusRunning": "Running",
  "sessionList.statusNeedsAction": "Needs action",
  "sessionList.workspaceEmpty": "No sessions in this workspace",
  "sessionList.addWorkspace": "Add workspace",
  "sessionList.addWorkspacePlaceholder": "Enter workspace path",
  "sessionList.addWorkspaceAriaLabel": "Workspace directory path",
  // Time
  "time.justNow": "Just now",
  "time.minutesAgo": "{minutes}m ago",
  "time.hoursAgo": "{hours}h ago",
  "time.daysAgo": "{days}d ago",
  // ThoughtView
  "thought.thinking": "Thinking...",
  "thought.title": "Thought",
  "thought.reasoning": "Reasoning...",
  // PlanView
  "plan.planning": "Planning...",
  "plan.title": "Plan",
  // StreamingIndicator
  "streaming.ariaLabel": "Agent is thinking",
  "streaming.generating": "Generating",
  // DiffView
  "diff.title": "Diff",
  "diff.emptyState": "No diffs to display",
  // TerminalView
  "terminal.title": "Terminal",
  "terminal.empty": "No active terminals",
  "terminal.command": "Command:",
  "terminal.running": "Running...",
  "terminal.signaled": "SIG",
  "terminal.truncated": "Output truncated",
  // AcpProvider
  "loading.connecting": "Connecting to agents...",
  // UsageBar
  "usageBar.ariaLabel": "Context window: {used} of {total} tokens",
  // Workspace
  "workspace.switchWorkspace": "Switch workspace",
  "workspace.addWorkspace": "Add workspace",
  "workspace.removeWorkspace": "Remove workspace",
  "workspace.noWorkspaces": "No workspaces",
  "workspace.selectWorkspace": "Select a workspace",
  // UserMessage
  "userMessage.copy": "Copy",
  "userMessage.copied": "Copied",
  "userMessage.edit": "Edit",
  // StopReason
  "stopReason.end_turn": "Reply complete",
  "stopReason.max_tokens": "Reached token limit",
  "stopReason.max_turn_requests": "Reached max turns",
  "stopReason.refusal": "Request refused",
  "stopReason.cancelled": "Cancelled",
  // LoginDialog
  "login.ariaLabel": "Login required",
  "login.title": "Login Required",
  "login.description": "You need to log in before creating a session. Please select an authentication method:",
  "login.authenticating": "Authenticating...",
  "login.cancel": "Cancel",
  "login.error": "Authentication failed. Please try again.",
  "login.authenticate": "Authenticate",
  "login.envVarOptional": "(optional)",
  "login.envVarSecretPlaceholder": "Enter {label}",
  "login.methodTerminal": "Terminal authentication",
  // FileTree
  "fileTree.title": "Files",
  "fileTree.search": "Search files",
  "fileTree.searchPlaceholder": "Search files...",
  "fileTree.searchAriaLabel": "Search files",
  "fileTree.empty": "No files",
  // FileViewer
  "fileViewer.title": "File Viewer",
  "fileViewer.loading": "Loading...",
  "fileViewer.loadingMonaco": "Loading editor...",
  "fileViewer.error": "Failed to load file",
  "fileViewer.close": "Close",
  "fileViewer.closeAll": "Close all",
  "fileViewer.noFile": "No file open",
  "fileViewer.monacoRequired": "monaco-editor is required for file viewing",
  // Settings
  "settings.title": "Settings",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.language": "Language",
  // Sidebar
  "sidebar.sessionsTitle": "Sessions",
  "sidebar.filesTitle": "Files",
  "sidebar.backToSessions": "Back to sessions",
  "sidebar.showFiles": "Show files",
  "sidebar.noWorkspace": "Select a workspace"
}, Ln = {
  // CommandPalette
  "commandPalette.open": "打开命令面板",
  "commandPalette.commands": "命令",
  "commandPalette.searchPlaceholder": "搜索命令...",
  "commandPalette.filterCommands": "过滤命令",
  "commandPalette.noMatching": "无匹配命令",
  // ChatComposer
  "composer.placeholder": "输入消息...（Enter 发送，/ 触发命令）",
  "composer.ariaLabel": "消息输入",
  "composer.cancelAriaLabel": "取消生成",
  "composer.cancel": "取消",
  "composer.sendAriaLabel": "发送消息",
  "composer.send": "发送（Enter）",
  "composer.attachFile": "添加文件",
  "composer.attachFileAriaLabel": "添加文件",
  "composer.removeFileAriaLabel": "移除文件",
  // ChatView
  "chat.emptyState": "选择或创建一个会话以开始",
  "chat.title": "对话",
  "chat.scrollToBottom": "滚动到底部",
  // Workbench
  "workbench.ariaLabel": "ACP 工作台",
  "workbench.resizeSidebar": "调整侧边栏宽度",
  "workbench.resizePanel": "调整面板宽度",
  // PermissionDialog
  "permission.ariaLabel": "需要授权",
  "permission.title": "需要授权",
  "permission.description": "智能体想要执行一个需要您批准的工具操作。",
  "permission.deny": "拒绝",
  "permission.allow": "允许",
  // SessionList
  "sessionList.title": "工作区",
  "sessionList.newSession": "新建会话",
  "sessionList.deleteSession": "删除会话",
  "sessionList.forkSession": "复刻会话",
  "sessionList.defaultSessionTitle": "新会话",
  "sessionList.emptyState": "暂无会话，点击 + 开始",
  "sessionList.loadMore": "加载更多",
  "sessionList.statusRunning": "运行中",
  "sessionList.statusNeedsAction": "待操作",
  "sessionList.workspaceEmpty": "此工作区暂无会话",
  "sessionList.addWorkspace": "添加工作区",
  "sessionList.addWorkspacePlaceholder": "请输入工作区路径",
  "sessionList.addWorkspaceAriaLabel": "工作区目录路径",
  // Time
  "time.justNow": "刚刚",
  "time.minutesAgo": "{minutes}分钟前",
  "time.hoursAgo": "{hours}小时前",
  "time.daysAgo": "{days}天前",
  // ThoughtView
  "thought.thinking": "思考中...",
  "thought.title": "思考过程",
  "thought.reasoning": "推理中...",
  // PlanView
  "plan.planning": "规划中...",
  "plan.title": "计划",
  // StreamingIndicator
  "streaming.ariaLabel": "智能体正在思考",
  "streaming.generating": "生成中",
  // DiffView
  "diff.title": "差异",
  "diff.emptyState": "无差异可显示",
  // TerminalView
  "terminal.title": "终端",
  "terminal.empty": "无活动终端",
  "terminal.command": "命令:",
  "terminal.running": "运行中...",
  "terminal.signaled": "信号",
  "terminal.truncated": "输出已截断",
  // AcpProvider
  "loading.connecting": "正在连接智能体...",
  // UsageBar
  "usageBar.ariaLabel": "上下文窗口：{used} / {total} tokens",
  // Workspace
  "workspace.switchWorkspace": "切换工作区",
  "workspace.addWorkspace": "添加工作区",
  "workspace.removeWorkspace": "移除工作区",
  "workspace.noWorkspaces": "暂无工作区",
  "workspace.selectWorkspace": "选择工作区",
  // UserMessage
  "userMessage.copy": "复制",
  "userMessage.copied": "已复制",
  "userMessage.edit": "编辑",
  // StopReason
  "stopReason.end_turn": "回复完毕",
  "stopReason.max_tokens": "已达到 Token 上限",
  "stopReason.max_turn_requests": "已达到最大轮次",
  "stopReason.refusal": "请求被拒绝",
  "stopReason.cancelled": "已取消",
  // LoginDialog
  "login.ariaLabel": "需要登录",
  "login.title": "需要登录",
  "login.description": "创建会话前需要先登录，请选择认证方式：",
  "login.authenticating": "认证中...",
  "login.cancel": "取消",
  "login.error": "认证失败，请重试。",
  "login.authenticate": "认证",
  "login.envVarOptional": "（可选）",
  "login.envVarSecretPlaceholder": "请输入{label}",
  "login.methodTerminal": "终端认证",
  // FileTree
  "fileTree.title": "文件",
  "fileTree.search": "搜索文件",
  "fileTree.searchPlaceholder": "搜索文件...",
  "fileTree.searchAriaLabel": "搜索文件",
  "fileTree.empty": "无文件",
  // FileViewer
  "fileViewer.title": "文件查看器",
  "fileViewer.loading": "加载中...",
  "fileViewer.loadingMonaco": "编辑器加载中...",
  "fileViewer.error": "加载文件失败",
  "fileViewer.close": "关闭",
  "fileViewer.closeAll": "全部关闭",
  "fileViewer.noFile": "未打开文件",
  "fileViewer.monacoRequired": "文件查看需要 monaco-editor",
  // Settings
  "settings.title": "设置",
  "settings.theme": "主题",
  "settings.themeDark": "深色",
  "settings.themeLight": "浅色",
  "settings.language": "语言",
  // Sidebar
  "sidebar.sessionsTitle": "会话",
  "sidebar.filesTitle": "文件",
  "sidebar.backToSessions": "返回会话",
  "sidebar.showFiles": "显示文件",
  "sidebar.noWorkspace": "请选择工作区"
}, ba = "acp-i18n-locale";
function Pn(a) {
  try {
    const e = localStorage.getItem(ba);
    if (e) return e;
  } catch {
  }
  if (typeof navigator < "u" && navigator.language) {
    const e = navigator.language;
    if (e.startsWith("zh")) return "zh-CN";
    if (e.startsWith("en")) return "en-US";
  }
  return a;
}
function In(a, e) {
  const t = {
    "en-US": { translation: Dn },
    "zh-CN": { translation: Ln }
  };
  if (e)
    for (const o of Object.keys(e))
      t[o] || (t[o] = { translation: {} }), Object.assign(t[o].translation, e[o]);
  const s = Ja();
  return s.use(Ya).init({
    resources: t,
    lng: a,
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: !1,
      prefix: "{",
      suffix: "}"
    },
    returnNull: !1,
    returnEmptyString: !1
  }), s;
}
function Ml({ defaultLocale: a = "en-US", customLocales: e, children: t }) {
  const s = Z(
    () => In(Pn(a), e),
    [a, e]
  );
  return H(() => {
    try {
      localStorage.setItem(ba, s.language);
    } catch {
    }
  }, [s.language]), ae.createElement(Qa, { i18n: s }, t);
}
const $n = "_acp-loading_1tulc_1", An = "_acp-loading__spinner_1tulc_13", Ke = {
  acpLoading: $n,
  acpLoadingSpinner: An
};
function Vn({ options: a, children: e }) {
  return Nn(a), /* @__PURE__ */ n(Ce, { children: e });
}
function Fl({
  agents: a,
  theme: e = "dark",
  children: t,
  onTerminal: s,
  onExtMethod: o,
  onExtNotification: c,
  defaultCwd: r = "",
  fileSystem: i,
  onOpenFile: l
}) {
  const p = Tn({
    agents: a,
    onTerminal: s,
    onExtMethod: o,
    onExtNotification: c,
    fileSystem: i
  }), { t: _ } = B(), [m, w] = $(e);
  ae.useEffect(() => (document.body.setAttribute("data-acp-theme", m), () => {
    document.body.removeAttribute("data-acp-theme");
  }), [m]), ae.useEffect(() => {
    w(e);
  }, [e]);
  const f = Z(() => ({ theme: m, setTheme: w }), [m]), d = Z(() => ({
    getClient: p.getClient,
    agents: p.agents,
    workspaces: p.workspaces,
    addAgent: p.addAgent,
    removeAgent: p.removeAgent,
    addWorkspace: p.addWorkspace,
    removeWorkspace: p.removeWorkspace,
    isReady: p.isReady,
    onOpenFile: l,
    onFileContentRead: i == null ? void 0 : i.onFileContentRead
  }), [p, l, i == null ? void 0 : i.onFileContentRead]);
  if (ae.useEffect(() => {
    r && se.getState().addWorkspace(r);
  }, [r]), !p.isReady)
    return /* @__PURE__ */ n(xe.Provider, { value: f, children: /* @__PURE__ */ u("div", { className: Ke.acpLoading, children: [
      /* @__PURE__ */ n("div", { className: Ke.acpLoadingSpinner }),
      /* @__PURE__ */ n("span", { children: _("loading.connecting") })
    ] }) });
  const b = /* @__PURE__ */ n(xe.Provider, { value: f, children: /* @__PURE__ */ n(fa.Provider, { value: d, children: /* @__PURE__ */ n("div", { children: t }) }) });
  return i != null && i.onDirectoryRead ? /* @__PURE__ */ n(Vn, { options: i, children: b }) : b;
}
function Mn(a, e, t) {
  return Math.max(e, Math.min(t, a));
}
function Xe({
  initialWidth: a,
  minWidth: e = 120,
  maxWidth: t = 800,
  direction: s,
  onChange: o
}) {
  const [c, r] = $(a), [i, l] = $(!1), p = V(c), _ = V(0), m = V(0);
  H(() => {
    p.current = c;
  }, [c]);
  const w = g(
    (v) => {
      const y = Mn(Math.round(v), e, t);
      r(y), o == null || o(y);
    },
    [e, t, o]
  ), f = g(
    (v) => {
      if (v.button !== 0) return;
      v.preventDefault(), _.current = v.clientX, m.current = p.current, l(!0), document.body.style.cursor = "col-resize", document.body.style.userSelect = "none", document.body.classList.add("acp-resizing");
      const y = (S) => {
        const h = s === "left" ? S.clientX - _.current : _.current - S.clientX;
        w(m.current + h);
      }, C = () => {
        l(!1), document.body.style.cursor = "", document.body.style.userSelect = "", document.body.classList.remove("acp-resizing"), document.removeEventListener("pointermove", y), document.removeEventListener("pointerup", C);
      };
      document.addEventListener("pointermove", y), document.addEventListener("pointerup", C);
    },
    [s, w]
  ), d = g(() => {
    w(a);
  }, [a, w]), b = g(
    (v) => {
      const y = v.shiftKey ? 50 : 10;
      let C = !0;
      switch (v.key) {
        case "ArrowLeft":
          w(p.current + (s === "left" ? -y : y));
          break;
        case "ArrowRight":
          w(p.current + (s === "left" ? y : -y));
          break;
        case "Home":
          w(e);
          break;
        case "End":
          w(t);
          break;
        default:
          C = !1;
      }
      C && v.preventDefault();
    },
    [s, w, e, t]
  );
  return {
    width: c,
    isResizing: i,
    reset: d,
    setWidth: w,
    handleProps: { onPointerDown: f, onDoubleClick: d, onKeyDown: b }
  };
}
const Fn = "_resize-handle_q8q2c_1", xn = "_resize-handle__line_q8q2c_15", Bn = "_resize-handle--active_q8q2c_31", Fe = {
  resizeHandle: Fn,
  resizeHandleLine: xn,
  resizeHandleActive: Bn
};
function Je({
  onPointerDown: a,
  onDoubleClick: e,
  onKeyDown: t,
  isResizing: s,
  "aria-label": o = "Resize panel",
  "aria-valuenow": c,
  "aria-valuemin": r,
  "aria-valuemax": i,
  className: l
}) {
  const p = g(
    (m) => {
      t(m);
    },
    [t]
  ), _ = [
    Fe.resizeHandle,
    s ? Fe.resizeHandleActive : "",
    l || ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ n(
    "div",
    {
      role: "separator",
      "aria-orientation": "vertical",
      "aria-label": o,
      "aria-valuenow": c,
      "aria-valuemin": r,
      "aria-valuemax": i,
      tabIndex: 0,
      className: _,
      onPointerDown: a,
      onDoubleClick: e,
      onKeyDown: p,
      children: /* @__PURE__ */ n("span", { className: Fe.resizeHandleLine, "aria-hidden": "true" })
    }
  );
}
const En = "_acp-workbench_r8tp7_1", Rn = "_acp-workbench__sidebar_r8tp7_10", zn = "_acp-workbench__main_r8tp7_22", On = "_acp-workbench__panel_r8tp7_29", Pe = {
  acpWorkbench: En,
  acpWorkbenchSidebar: Rn,
  acpWorkbenchMain: zn,
  acpWorkbenchPanel: On
};
function xl({
  sidebar: a,
  main: e,
  panel: t,
  className: s,
  sidebarWidth: o = 260,
  panelWidth: c = 360,
  minSidebarWidth: r = 180,
  maxSidebarWidth: i = 480,
  minPanelWidth: l = 240,
  maxPanelWidth: p = 600,
  onSidebarWidthChange: _,
  onPanelWidthChange: m
}) {
  const w = !!t, { t: f } = B(), d = Xe({
    initialWidth: o,
    minWidth: r,
    maxWidth: i,
    direction: "left",
    onChange: _
  }), b = Xe({
    initialWidth: c,
    minWidth: l,
    maxWidth: p,
    direction: "right",
    onChange: m
  });
  return /* @__PURE__ */ u(
    "div",
    {
      className: `${Pe.acpWorkbench}${s ? ` ${s}` : ""}`,
      role: "application",
      "aria-label": f("workbench.ariaLabel"),
      children: [
        /* @__PURE__ */ n(
          "aside",
          {
            className: Pe.acpWorkbenchSidebar,
            role: "complementary",
            style: { width: d.width },
            children: a
          }
        ),
        /* @__PURE__ */ n(
          Je,
          {
            ...d.handleProps,
            isResizing: d.isResizing,
            "aria-label": f("workbench.resizeSidebar"),
            "aria-valuenow": d.width,
            "aria-valuemin": r,
            "aria-valuemax": i
          }
        ),
        /* @__PURE__ */ n("main", { className: Pe.acpWorkbenchMain, role: "main", children: e }),
        w && /* @__PURE__ */ u(Ce, { children: [
          /* @__PURE__ */ n(
            Je,
            {
              ...b.handleProps,
              isResizing: b.isResizing,
              "aria-label": f("workbench.resizePanel"),
              "aria-valuenow": b.width,
              "aria-valuemin": l,
              "aria-valuemax": p
            }
          ),
          /* @__PURE__ */ n(
            "section",
            {
              className: Pe.acpWorkbenchPanel,
              role: "complementary",
              style: { width: b.width },
              children: t
            }
          )
        ] })
      ]
    }
  );
}
const Hn = "_acp-dropdown_p43k4_1", Wn = "_acp-dropdown-placement-bottom-start_p43k4_7", Un = "_acp-dropdown__content_p43k4_7", qn = "_acp-dropdown-placement-bottom-end_p43k4_13", Gn = "_acp-dropdown-placement-top-start_p43k4_19", jn = "_acp-dropdown-placement-top-end_p43k4_25", Kn = "_acp-dropdown__trigger_p43k4_31", Xn = "_acp-dropdown__section-label_p43k4_51", Jn = "_acp-dropdown__item_p43k4_61", Qn = "_acp-dropdown__item--disabled_p43k4_80", Yn = "_acp-dropdown__item-icon_p43k4_88", Zn = "_acp-dropdown__item-label_p43k4_103", et = "_acp-dropdown__item-value_p43k4_110", at = "_acp-dropdown__chevron_p43k4_118", nt = "_acp-dropdown__chevron--expanded_p43k4_126", tt = "_acp-dropdown__submenu-group_p43k4_131", st = "_acp-dropdown__submenu-group--expanded_p43k4_134", ot = "_acp-dropdown__submenu_p43k4_131", ct = "_acp-dropdown__submenu-item_p43k4_154", it = "_acp-dropdown__submenu-item--active_p43k4_173", rt = "_acp-dropdown__submenu-check_p43k4_178", F = {
  acpDropdown: Hn,
  acpDropdownPlacementBottomStart: Wn,
  acpDropdownContent: Un,
  acpDropdownPlacementBottomEnd: qn,
  acpDropdownPlacementTopStart: Gn,
  acpDropdownPlacementTopEnd: jn,
  acpDropdownTrigger: Kn,
  acpDropdownSectionLabel: Xn,
  acpDropdownItem: Jn,
  acpDropdownItemDisabled: Qn,
  acpDropdownItemIcon: Yn,
  acpDropdownItemLabel: Zn,
  acpDropdownItemValue: et,
  acpDropdownChevron: at,
  acpDropdownChevronExpanded: nt,
  acpDropdownSubmenuGroup: tt,
  acpDropdownSubmenuGroupExpanded: st,
  acpDropdownSubmenu: ot,
  acpDropdownSubmenuItem: ct,
  acpDropdownSubmenuItemActive: it,
  acpDropdownSubmenuCheck: rt
}, wa = Ee(null);
function Oe() {
  const a = Re(wa);
  if (!a)
    throw new Error("Dropdown compound components must be used within <Dropdown>");
  return a;
}
function lt({ children: a, placement: e = "bottom-start", className: t }) {
  const [s, o] = $(!1), c = V(null), r = V(null), i = g(() => o(!1), []), l = g(() => o((m) => !m), []);
  H(() => {
    if (!s) return;
    const m = (w) => {
      const f = w.target;
      r.current && !r.current.contains(f) && c.current && !c.current.contains(f) && o(!1);
    };
    return document.addEventListener("mousedown", m), () => document.removeEventListener("mousedown", m);
  }, [s]), H(() => {
    if (!s) return;
    const m = (w) => {
      w.key === "Escape" && o(!1);
    };
    return document.addEventListener("keydown", m), () => document.removeEventListener("keydown", m);
  }, [s]);
  const p = {
    open: s,
    toggle: l,
    close: i,
    triggerRef: c,
    contentRef: r,
    placement: e
  }, _ = e === "top-start" ? F.acpDropdownPlacementTopStart : e === "top-end" ? F.acpDropdownPlacementTopEnd : e === "bottom-end" ? F.acpDropdownPlacementBottomEnd : F.acpDropdownPlacementBottomStart;
  return /* @__PURE__ */ n(wa.Provider, { value: p, children: /* @__PURE__ */ n(
    "div",
    {
      className: `${F.acpDropdown}${` ${_}`}${t ? ` ${t}` : ""}`,
      "data-acp-dropdown-open": s || void 0,
      children: a
    }
  ) });
}
function pt({ children: a, asChild: e = !1, className: t }) {
  const { open: s, toggle: o, triggerRef: c } = Oe();
  if (e && va(a)) {
    const r = a;
    return ya(r, {
      ref: c,
      onClick: o,
      className: `${r.props.className ?? ""}${s ? ` ${F.acpDropdownTriggerActive}` : ""}`.trim()
    });
  }
  return /* @__PURE__ */ n(
    "button",
    {
      ref: c,
      type: "button",
      className: `${F.acpDropdownTrigger}${s ? ` ${F.acpDropdownTriggerActive}` : ""}${t ? ` ${t}` : ""}`,
      onClick: o,
      children: a
    }
  );
}
function dt({ children: a, className: e, width: t = 220 }) {
  const { open: s, contentRef: o } = Oe();
  return s ? /* @__PURE__ */ n(
    "div",
    {
      ref: o,
      className: `${F.acpDropdownContent}${e ? ` ${e}` : ""}`,
      style: { width: t },
      role: "menu",
      children: a
    }
  ) : null;
}
function ut({ children: a, label: e }) {
  return /* @__PURE__ */ u("div", { className: F.acpDropdownSection, role: "group", "aria-label": e, children: [
    e && /* @__PURE__ */ n("div", { className: F.acpDropdownSectionLabel, children: e }),
    a
  ] });
}
function mt({
  icon: a,
  label: e,
  value: t,
  disabled: s,
  onClick: o,
  children: c,
  className: r,
  role: i = "menuitem",
  "aria-checked": l
}) {
  const p = () => {
    s || o == null || o();
  };
  return /* @__PURE__ */ u(
    "button",
    {
      type: "button",
      className: `${F.acpDropdownItem}${s ? ` ${F.acpDropdownItemDisabled}` : ""}${r ? ` ${r}` : ""}`,
      onClick: p,
      disabled: s,
      role: i,
      "aria-checked": l,
      children: [
        a && /* @__PURE__ */ n("span", { className: F.acpDropdownItemIcon, children: a }),
        /* @__PURE__ */ n("span", { className: F.acpDropdownItemLabel, children: e }),
        t && /* @__PURE__ */ n("span", { className: F.acpDropdownItemValue, children: t }),
        c
      ]
    }
  );
}
function _t({ icon: a, label: e, value: t, children: s, className: o }) {
  const [c, r] = $(!1), i = V(void 0);
  H(() => () => {
    i.current && clearTimeout(i.current);
  }, []);
  const l = g(() => {
    i.current && clearTimeout(i.current), r(!0);
  }, []), p = g(() => {
    i.current = setTimeout(() => r(!1), 200);
  }, []), _ = g(() => {
    i.current && clearTimeout(i.current);
  }, []), m = g(() => {
    i.current = setTimeout(() => r(!1), 200);
  }, []);
  return /* @__PURE__ */ u(
    "div",
    {
      className: `${F.acpDropdownSubmenuGroup}${c ? ` ${F.acpDropdownSubmenuGroupExpanded}` : ""}${o ? ` ${o}` : ""}`,
      onMouseEnter: l,
      onMouseLeave: p,
      children: [
        /* @__PURE__ */ u("div", { className: F.acpDropdownItem, role: "menuitem", "aria-haspopup": "true", "aria-expanded": c, children: [
          a && /* @__PURE__ */ n("span", { className: F.acpDropdownItemIcon, children: a }),
          /* @__PURE__ */ n("span", { className: F.acpDropdownItemLabel, children: e }),
          t && /* @__PURE__ */ n("span", { className: F.acpDropdownItemValue, children: t }),
          /* @__PURE__ */ n("span", { className: `${F.acpDropdownChevron}${c ? ` ${F.acpDropdownChevronExpanded}` : ""}`, children: "›" })
        ] }),
        c && /* @__PURE__ */ n(
          "div",
          {
            className: F.acpDropdownSubmenu,
            onMouseEnter: _,
            onMouseLeave: m,
            role: "menu",
            children: s
          }
        )
      ]
    }
  );
}
function gt({ label: a, active: e, onClick: t, className: s }) {
  const { close: o } = Oe(), c = () => {
    t == null || t(), o();
  };
  return /* @__PURE__ */ u(
    "button",
    {
      type: "button",
      className: `${F.acpDropdownSubmenuItem}${e ? ` ${F.acpDropdownSubmenuItemActive}` : ""}${s ? ` ${s}` : ""}`,
      onClick: c,
      role: "menuitem",
      children: [
        /* @__PURE__ */ n("span", { children: a }),
        e && /* @__PURE__ */ n("span", { className: F.acpDropdownSubmenuCheck, children: "✓" })
      ]
    }
  );
}
const he = Object.assign(lt, {
  Trigger: pt,
  Content: dt,
  Section: ut,
  Item: mt,
  Submenu: _t,
  SubmenuItem: gt
}), ht = "_acp-settings-menu_1nd1p_1", ft = "_acp-settings-trigger_1nd1p_8", bt = "_acp-settings-toggle_1nd1p_40", wt = "_acp-settings-toggle--on_1nd1p_51", St = "_acp-settings-toggle__knob_1nd1p_56", De = {
  acpSettingsMenu: ht,
  acpSettingsTrigger: ft,
  acpSettingsToggle: bt,
  acpSettingsToggleOn: wt,
  acpSettingsToggleKnob: St
};
function Ct({ on: a }) {
  return /* @__PURE__ */ n("span", { className: `${De.acpSettingsToggle}${a ? ` ${De.acpSettingsToggleOn}` : ""}`, children: /* @__PURE__ */ n("span", { className: De.acpSettingsToggleKnob }) });
}
function vt({ className: a }) {
  var l;
  const { t: e, i18n: t } = B(), { theme: s, setTheme: o } = vn(), c = (l = t.language) != null && l.startsWith("zh") ? "zh-CN" : "en-US", r = g(() => {
    o(s === "dark" ? "light" : "dark");
  }, [s, o]), i = g((p) => {
    t.changeLanguage(p);
    try {
      localStorage.setItem("acp-i18n-locale", p);
    } catch {
    }
  }, [t]);
  return /* @__PURE__ */ n("div", { className: `${De.acpSettingsMenu}${a ? ` ${a}` : ""}`, children: /* @__PURE__ */ u(he, { placement: "top-start", children: [
    /* @__PURE__ */ n(he.Trigger, { asChild: !0, children: /* @__PURE__ */ n(
      "button",
      {
        className: De.acpSettingsTrigger,
        "aria-label": e("settings.title"),
        title: e("settings.title"),
        children: /* @__PURE__ */ n(Za, {})
      }
    ) }),
    /* @__PURE__ */ n(he.Content, { width: 220, children: /* @__PURE__ */ u(he.Section, { label: e("settings.title"), children: [
      /* @__PURE__ */ n(
        he.Item,
        {
          icon: /* @__PURE__ */ n(en, {}),
          label: e("settings.theme"),
          value: e(s === "dark" ? "settings.themeDark" : "settings.themeLight"),
          onClick: r,
          role: "switch",
          "aria-checked": s === "dark",
          children: /* @__PURE__ */ n(Ct, { on: s === "dark" })
        }
      ),
      /* @__PURE__ */ u(
        he.Submenu,
        {
          icon: /* @__PURE__ */ n(la, {}),
          label: e("settings.language"),
          value: c === "zh-CN" ? "中文" : "English",
          children: [
            /* @__PURE__ */ n(
              he.SubmenuItem,
              {
                label: "English",
                active: c === "en-US",
                onClick: () => i("en-US")
              }
            ),
            /* @__PURE__ */ n(
              he.SubmenuItem,
              {
                label: "中文",
                active: c === "zh-CN",
                onClick: () => i("zh-CN")
              }
            )
          ]
        }
      )
    ] }) })
  ] }) });
}
function K(a) {
  return _e(se, a ?? ((e) => e));
}
function He() {
  const { getClient: a } = ke(), e = K((d) => d.activeSessionId), t = K((d) => d.setActiveSession), s = K(
    Ve((d) => {
      const b = [];
      for (const v of d.workspaces.values())
        for (const y of v.sessions.values())
          b.push(y);
      return b;
    })
  ), o = g((d) => {
    const b = se.getState();
    for (const [, v] of b.workspaces) {
      const y = v.sessions.get(d);
      if (y) return a(y.agentId);
    }
    return null;
  }, [a]), c = g(async (d, b) => {
    const v = a(d);
    if (!v) throw new Error(`Agent ${d} not found`);
    try {
      return await La(v, d, b);
    } catch (y) {
      throw y instanceof Pa && y.code === -32e3 && se.getState().setAuthRequired(d), y;
    }
  }, [a]), r = g(async (d, b) => {
    const v = o(d);
    if (!v) throw new Error("No client for session");
    return Ia(v, d, b);
  }, [o]), i = g(async (d) => {
    const b = o(d);
    if (b)
      return $a(b, d);
  }, [o]), l = g(async (d) => {
    const b = o(d);
    if (b)
      return Aa(b, d);
  }, [o]), p = g(async (d) => {
    const b = o(d);
    if (b)
      return Va(b, d);
  }, [o]), _ = g(async (d) => {
    const b = o(d);
    if (!b) throw new Error("No client for session");
    return Ma(b, d);
  }, [o]), m = g(async (d, b) => {
    const v = a(d);
    if (v)
      return Fa(v, d, b);
  }, [a]), w = g(async (d, b) => {
    var C;
    const v = a(d);
    if (!v) return;
    const y = (C = se.getState().workspaces.get(b)) == null ? void 0 : C.sessionListCursors.get(d);
    if (y)
      return xa(v, d, b, y);
  }, [a]), f = K(
    Ve((d) => {
      const b = [];
      for (const v of d.workspaces.values())
        for (const y of v.sessionListCursors.keys())
          b.includes(y) || b.push(y);
      return b;
    })
  );
  return {
    sessions: s,
    activeSessionId: e,
    sessionListCursors: f,
    setActiveSession: t,
    selectSession: i,
    createSession: c,
    loadSession: r,
    closeSession: l,
    deleteSession: p,
    forkSession: _,
    refreshSessions: m,
    loadMoreSessions: w
  };
}
const yt = "_acp-session-list_1yy54_1", kt = "_acp-session-list__header_1yy54_7", Tt = "_acp-session-list__title_1yy54_14", Nt = "_acp-session-list__new-btn_1yy54_22", Dt = "_acp-session-list__input_1yy54_40", Lt = "_acp-session-list__items_1yy54_56", Pt = "_acp-session-list__empty-state_1yy54_77", It = "_acp-session-item_1yy54_91", $t = "_acp-session-item__fork_1yy54_110", At = "_acp-session-item__delete_1yy54_113", Vt = "_acp-session-item--active_1yy54_119", Mt = "_acp-session-item__title_1yy54_122", Ft = "_acp-session-item__icon_1yy54_126", xt = "_acp-session-item__icon--running_1yy54_141", Bt = "_acp-session-item__icon--needs-action_1yy54_148", Et = "_acp-session-item__spinner_1yy54_153", Rt = "_acp-spin_1yy54_1", zt = "_acp-session-item__content_1yy54_161", Ot = "_acp-session-item__meta_1yy54_175", Ht = "_acp-session-workspace-group_1yy54_224", Wt = "_acp-session-workspace-header_1yy54_233", Ut = "_acp-session-workspace-header__files-btn_1yy54_246", qt = "_acp-session-workspace-header__left_1yy54_252", Gt = "_acp-session-workspace-header__actions_1yy54_259", jt = "_acp-session-workspace-header__folder_1yy54_285", Kt = "_acp-session-workspace-header__name_1yy54_291", Xt = "_acp-session-workspace-header__badge_1yy54_300", Jt = "_acp-session-workspace-body_1yy54_317", Qt = "_acp-session-workspace-empty_1yy54_322", Yt = "_acp-session-agent-group_1yy54_330", Zt = "_acp-session-agent-header_1yy54_334", es = "_acp-session-agent-header__add_1yy54_345", as = "_acp-session-agent-header__name_1yy54_348", ns = "_acp-session-agent-header__dot_1yy54_363", ts = "_acp-session-agent-header__dot--connected_1yy54_370", ss = "_acp-session-agent-header__dot--connecting_1yy54_374", os = "_acp-session-agent-header__dot--disconnected_1yy54_378", cs = "_acp-session-agent-header__dot--error_1yy54_381", is = "_acp-session-group-chevron_1yy54_405", rs = "_acp-session-group-chevron--expanded_1yy54_416", ls = "_acp-session-load-more_1yy54_420", ps = "_acp-session-load-more__btn_1yy54_426", ds = "_acp-agent-info_1yy54_446", us = "_acp-agent-info__name_1yy54_452", I = {
  acpSessionList: yt,
  acpSessionListHeader: kt,
  acpSessionListTitle: Tt,
  acpSessionListNewBtn: Nt,
  acpSessionListInput: Dt,
  acpSessionListItems: Lt,
  acpSessionListEmptyState: Pt,
  acpSessionItem: It,
  acpSessionItemFork: $t,
  acpSessionItemDelete: At,
  acpSessionItemActive: Vt,
  acpSessionItemTitle: Mt,
  acpSessionItemIcon: Ft,
  acpSessionItemIconRunning: xt,
  acpSessionItemIconNeedsAction: Bt,
  acpSessionItemSpinner: Et,
  acpSpin: Rt,
  acpSessionItemContent: zt,
  acpSessionItemMeta: Ot,
  acpSessionWorkspaceGroup: Ht,
  acpSessionWorkspaceHeader: Wt,
  acpSessionWorkspaceHeaderFilesBtn: Ut,
  acpSessionWorkspaceHeaderLeft: qt,
  acpSessionWorkspaceHeaderActions: Gt,
  acpSessionWorkspaceHeaderFolder: jt,
  acpSessionWorkspaceHeaderName: Kt,
  acpSessionWorkspaceHeaderBadge: Xt,
  acpSessionWorkspaceBody: Jt,
  acpSessionWorkspaceEmpty: Qt,
  acpSessionAgentGroup: Yt,
  acpSessionAgentHeader: Zt,
  acpSessionAgentHeaderAdd: es,
  acpSessionAgentHeaderName: as,
  acpSessionAgentHeaderDot: ns,
  acpSessionAgentHeaderDotConnected: ts,
  acpSessionAgentHeaderDotConnecting: ss,
  acpSessionAgentHeaderDotDisconnected: os,
  acpSessionAgentHeaderDotError: cs,
  acpSessionGroupChevron: is,
  acpSessionGroupChevronExpanded: rs,
  acpSessionLoadMore: ls,
  acpSessionLoadMoreBtn: ps,
  acpAgentInfo: ds,
  acpAgentInfoName: us
};
function ms(a) {
  const t = a.replace(/[/\\]+$/, "").split(/[/\\]/);
  return t[t.length - 1] || a;
}
function _s(a) {
  const e = V(null);
  return _e(ve, (s) => {
    const o = s.sessions.get(a);
    if (!o) return null;
    let c = null;
    return o.pendingPermissions.length > 0 ? c = "needs-action" : o.isStreaming && (c = "running"), c === e.current ? e.current : (e.current = c, c);
  });
}
function gs() {
  const { t: a } = B();
  return g((e) => {
    if (!e) return "";
    const t = new Date(e);
    if (isNaN(t.getTime())) return "";
    const o = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), c = Math.floor(o / 6e4), r = Math.floor(o / 36e5), i = Math.floor(o / 864e5);
    return c < 1 ? a("time.justNow") : c < 60 ? a("time.minutesAgo", { minutes: c }) : r < 24 ? a("time.hoursAgo", { hours: r }) : i < 7 ? a("time.daysAgo", { days: i }) : t.toLocaleDateString();
  }, [a]);
}
function hs({ session: a, isActive: e }) {
  const { t } = B(), s = gs(), { selectSession: o, deleteSession: c, forkSession: r, setActiveSession: i } = He(), l = _s(a.id), p = K((f) => {
    var d, b, v;
    return !!((v = (b = (d = f.agents.get(a.agentId)) == null ? void 0 : d.capabilities) == null ? void 0 : b.sessionCapabilities) != null && v.fork);
  }), _ = K((f) => {
    var d, b, v;
    return !!((v = (b = (d = f.agents.get(a.agentId)) == null ? void 0 : d.capabilities) == null ? void 0 : b.sessionCapabilities) != null && v.delete);
  }), [m, w] = $(!1);
  return /* @__PURE__ */ u(
    "div",
    {
      className: `${I.acpSessionItem}${e ? ` ${I.acpSessionItemActive}` : ""}`,
      onClick: () => {
        e || o(a.id);
      },
      role: "option",
      "aria-selected": e,
      children: [
        /* @__PURE__ */ n("span", { className: `${I.acpSessionItemIcon}${l ? ` ${I[`acpSessionItemIcon${l === "running" ? "Running" : "NeedsAction"}`]}` : ""}`, title: l ? t(l === "running" ? "sessionList.statusRunning" : "sessionList.statusNeedsAction") : void 0, children: l === "running" ? /* @__PURE__ */ n("span", { className: I.acpSessionItemSpinner }) : l === "needs-action" ? "!" : /* @__PURE__ */ n(an, {}) }),
        /* @__PURE__ */ u("div", { className: I.acpSessionItemContent, children: [
          /* @__PURE__ */ n("div", { className: I.acpSessionItemTitle, children: a.title || t("sessionList.defaultSessionTitle") }),
          /* @__PURE__ */ n("div", { className: I.acpSessionItemMeta, children: s(a.updatedAt) })
        ] }),
        p && /* @__PURE__ */ n(
          "button",
          {
            className: I.acpSessionItemFork,
            onClick: async (f) => {
              if (f.stopPropagation(), !m) {
                w(!0);
                try {
                  const d = await r(a.id);
                  i(d);
                } catch (d) {
                  console.error("Failed to fork session:", d);
                } finally {
                  w(!1);
                }
              }
            },
            disabled: m,
            "aria-label": t("sessionList.forkSession"),
            title: t("sessionList.forkSession"),
            children: /* @__PURE__ */ n(nn, {})
          }
        ),
        _ && /* @__PURE__ */ n(
          "button",
          {
            className: I.acpSessionItemDelete,
            onClick: (f) => {
              f.stopPropagation(), c(a.id);
            },
            "aria-label": t("sessionList.deleteSession"),
            title: t("sessionList.deleteSession"),
            children: /* @__PURE__ */ n(ze, {})
          }
        )
      ]
    }
  );
}
const fs = {
  connected: I.acpSessionAgentHeaderDotConnected,
  connecting: I.acpSessionAgentHeaderDotConnecting,
  disconnected: I.acpSessionAgentHeaderDotDisconnected,
  error: I.acpSessionAgentHeaderDotError
};
function bs({ agentId: a, agentName: e, agentStatus: t, sessions: s, cwd: o }) {
  const { t: c } = B(), { activeSessionId: r, loadMoreSessions: i, createSession: l, setActiveSession: p } = He(), [_, m] = $(!1), w = g(() => m((y) => !y), []), f = K((y) => {
    var S;
    const C = (S = y.workspaces.get(o)) == null ? void 0 : S.sessionListCursors;
    return (C == null ? void 0 : C.has(a)) ?? !1;
  }), [d, b] = $(!1), v = g(async () => {
    if (!d) {
      b(!0);
      try {
        await i(a, o);
      } finally {
        b(!1);
      }
    }
  }, [d, i, a, o]);
  return /* @__PURE__ */ u("div", { className: I.acpSessionAgentGroup, children: [
    /* @__PURE__ */ u("div", { className: I.acpSessionAgentHeader, children: [
      /* @__PURE__ */ u(
        "span",
        {
          className: I.acpSessionAgentHeaderName,
          onClick: w,
          role: "button",
          tabIndex: 0,
          children: [
            /* @__PURE__ */ n("span", { className: `${I.acpSessionGroupChevron}${_ ? "" : ` ${I.acpSessionGroupChevronExpanded}`}`, children: /* @__PURE__ */ n(be, {}) }),
            /* @__PURE__ */ n("span", { className: `${I.acpSessionAgentHeaderDot} ${fs[t] || ""}` }),
            e
          ]
        }
      ),
      /* @__PURE__ */ n(
        "button",
        {
          className: I.acpSessionAgentHeaderAdd,
          onClick: async () => {
            try {
              const y = await l(a, o);
              p(y);
            } catch (y) {
              console.error("Failed to create session:", y);
            }
          },
          "aria-label": c("sessionList.newSession"),
          title: c("sessionList.newSession"),
          children: /* @__PURE__ */ n(pa, {})
        }
      )
    ] }),
    !_ && /* @__PURE__ */ u(Ce, { children: [
      s.map((y) => /* @__PURE__ */ n(
        hs,
        {
          session: y,
          isActive: r === y.id
        },
        y.id
      )),
      f && /* @__PURE__ */ n("div", { className: I.acpSessionLoadMore, children: /* @__PURE__ */ n(
        "button",
        {
          className: I.acpSessionLoadMoreBtn,
          onClick: v,
          disabled: d,
          children: d ? "..." : c("sessionList.loadMore")
        }
      ) })
    ] })
  ] });
}
function ws({ cwd: a, workspace: e, isWorkspaceActive: t, onShowFiles: s }) {
  const { t: o } = B(), c = K((f) => f.agents), [r, i] = $(!1), l = g(() => i((f) => !f), []), p = Array.from(e.sessions.values()), _ = p.length, m = Z(() => {
    const f = /* @__PURE__ */ new Map();
    for (const d of p) {
      const b = f.get(d.agentId);
      b ? b.push(d) : f.set(d.agentId, [d]);
    }
    return f;
  }, [p]), w = Array.from(c.values());
  return /* @__PURE__ */ u("div", { className: `${I.acpSessionWorkspaceGroup}${t ? ` ${I.acpSessionWorkspaceGroupActive}` : ""}`, children: [
    /* @__PURE__ */ u(
      "div",
      {
        className: I.acpSessionWorkspaceHeader,
        onClick: l,
        role: "button",
        tabIndex: 0,
        title: a,
        children: [
          /* @__PURE__ */ u("span", { className: I.acpSessionWorkspaceHeaderLeft, children: [
            /* @__PURE__ */ n("span", { className: `${I.acpSessionGroupChevron}${r ? "" : ` ${I.acpSessionGroupChevronExpanded}`}`, children: /* @__PURE__ */ n(be, {}) }),
            /* @__PURE__ */ n("span", { className: I.acpSessionWorkspaceHeaderFolder, children: /* @__PURE__ */ n(da, {}) }),
            /* @__PURE__ */ n("span", { className: I.acpSessionWorkspaceHeaderName, children: ms(a) })
          ] }),
          /* @__PURE__ */ u("div", { className: I.acpSessionWorkspaceHeaderActions, children: [
            s && /* @__PURE__ */ n(
              "button",
              {
                className: I.acpSessionWorkspaceHeaderFilesBtn,
                onClick: (f) => {
                  f.stopPropagation(), s(a);
                },
                "aria-label": o("sidebar.showFiles"),
                title: o("sidebar.showFiles"),
                children: /* @__PURE__ */ n(ua, {})
              }
            ),
            _ > 0 && /* @__PURE__ */ n("span", { className: I.acpSessionWorkspaceHeaderBadge, children: _ })
          ] })
        ]
      }
    ),
    !r && /* @__PURE__ */ u("div", { className: I.acpSessionWorkspaceBody, children: [
      w.map((f) => /* @__PURE__ */ n(
        bs,
        {
          agentId: f.id,
          agentName: f.name,
          agentStatus: f.status,
          sessions: m.get(f.id) ?? [],
          cwd: a
        },
        f.id
      )),
      _ === 0 && /* @__PURE__ */ n("div", { className: I.acpSessionWorkspaceEmpty, children: o("sessionList.workspaceEmpty") })
    ] })
  ] });
}
function Ss({ onBrowse: a, onShowFiles: e }) {
  const { activeSessionId: t } = He(), s = K((C) => C.agents), o = K((C) => C.workspaces), c = K((C) => C.addWorkspace), { t: r } = B(), [i, l] = $(!1), [p, _] = $(""), m = V(null), w = Array.from(s.values()), f = Array.from(o.entries()), d = Z(() => {
    if (!t) return null;
    for (const [C, S] of o)
      if (S.sessions.has(t)) return C;
    return null;
  }, [t, o]), b = g(() => {
    a ? a().then((C) => {
      C && c(C);
    }).catch(console.error) : (l(!0), _(""));
  }, [a, c]), v = g((C) => {
    if (C.key === "Enter") {
      const S = p.trim();
      S && c(S), l(!1), _("");
    } else C.key === "Escape" && (l(!1), _(""));
  }, [p, c]), y = g(() => {
    const C = p.trim();
    C && c(C), l(!1), _("");
  }, [p, c]);
  return /* @__PURE__ */ u("div", { className: I.acpSessionList, children: [
    /* @__PURE__ */ u("div", { className: I.acpSessionListHeader, children: [
      /* @__PURE__ */ n("span", { className: I.acpSessionListTitle, children: r("sessionList.title") }),
      i ? /* @__PURE__ */ n(
        "input",
        {
          ref: m,
          className: I.acpSessionListInput,
          type: "text",
          value: p,
          onChange: (C) => _(C.target.value),
          onKeyDown: v,
          onBlur: y,
          placeholder: r("sessionList.addWorkspacePlaceholder"),
          autoFocus: !0,
          "aria-label": r("sessionList.addWorkspaceAriaLabel")
        }
      ) : /* @__PURE__ */ n(
        "button",
        {
          className: I.acpSessionListNewBtn,
          onClick: b,
          "aria-label": r("sessionList.addWorkspace"),
          title: r("sessionList.addWorkspace"),
          children: /* @__PURE__ */ n(pa, {})
        }
      )
    ] }),
    /* @__PURE__ */ u("div", { className: I.acpSessionListItems, role: "listbox", "aria-label": r("sessionList.title"), children: [
      w.length === 0 && /* @__PURE__ */ n("div", { className: I.acpSessionListEmptyState, children: r("sessionList.emptyState") }),
      f.map(([C, S]) => /* @__PURE__ */ n(
        ws,
        {
          cwd: C,
          workspace: S,
          isWorkspaceActive: C === d,
          onShowFiles: e
        },
        C
      ))
    ] })
  ] });
}
function Cs({ cwd: a }) {
  const e = _e(
    Ba,
    g(
      (c) => c.workspaces.get(a),
      [a]
    )
  ), t = g(() => {
    Ea(a);
  }, [a]), s = g(
    (c) => {
      Ra(a, c);
    },
    [a]
  ), o = g(
    (c) => {
      za(a, c);
    },
    [a]
  );
  return {
    files: (e == null ? void 0 : e.rootNodes) ?? [],
    loading: (e == null ? void 0 : e.loading) ?? !1,
    error: (e == null ? void 0 : e.error) ?? null,
    load: t,
    onExpand: s,
    onCollapse: o
  };
}
const vs = "_acp-file-tree_u8kq0_1", ys = "_acp-file-tree__body_u8kq0_7", ks = "_acp-file-tree-row_u8kq0_14", Ts = "_acp-file-tree-chevron_u8kq0_38", Ns = "_acp-file-tree-chevron--open_u8kq0_49", Ds = "_acp-file-tree-spacer_u8kq0_53", Ls = "_acp-file-tree-icon_u8kq0_59", Ps = "_acp-file-tree-name_u8kq0_70", Is = "_acp-file-tree-name--file_u8kq0_77", $s = "_acp-file-tree-empty_u8kq0_81", pe = {
  acpFileTree: vs,
  acpFileTreeBody: ys,
  acpFileTreeRow: ks,
  acpFileTreeChevron: Ts,
  acpFileTreeChevronOpen: Ns,
  acpFileTreeSpacer: Ds,
  acpFileTreeIcon: Ls,
  acpFileTreeName: Ps,
  acpFileTreeNameFile: Is,
  acpFileTreeEmpty: $s
};
function Sa(a) {
  const e = [...a].sort((t, s) => t.kind === "directory" && s.kind !== "directory" ? -1 : t.kind !== "directory" && s.kind === "directory" ? 1 : t.name.localeCompare(s.name, void 0, { sensitivity: "base" }));
  for (const t of e)
    t.children && (t.children = Sa(t.children));
  return e;
}
const As = ka(function a({
  node: e,
  depth: t,
  onNavigate: s,
  onExpand: o,
  onCollapse: c
}) {
  const r = e.expanded === !0, i = e.children && e.children.length > 0, l = e.kind === "directory", p = g(() => {
    r ? c == null || c(e.path) : o == null || o(e.path);
  }, [r, o, c, e.path]), _ = g(() => {
    l ? p() : s == null || s(e.path);
  }, [l, p, s, e.path]), m = g(
    (f) => {
      f.key === "Enter" || f.key === " " ? (f.preventDefault(), _()) : f.key === "ArrowRight" && !r && l ? (f.preventDefault(), o == null || o(e.path)) : f.key === "ArrowLeft" && r && l && (f.preventDefault(), c == null || c(e.path));
    },
    [_, r, l, o, c, e.path]
  ), w = {
    paddingLeft: `${8 + t * 16}px`
  };
  return /* @__PURE__ */ u(Ce, { children: [
    /* @__PURE__ */ u(
      "div",
      {
        className: pe.acpFileTreeRow,
        style: w,
        onClick: _,
        onKeyDown: m,
        role: "treeitem",
        "aria-expanded": l ? r : void 0,
        "aria-selected": !1,
        tabIndex: 0,
        title: e.path,
        children: [
          l ? /* @__PURE__ */ n(
            "span",
            {
              className: `${pe.acpFileTreeChevron}${r ? ` ${pe.acpFileTreeChevronOpen}` : ""}`,
              children: /* @__PURE__ */ n(be, {})
            }
          ) : /* @__PURE__ */ n("span", { className: pe.acpFileTreeSpacer }),
          /* @__PURE__ */ n("span", { className: pe.acpFileTreeIcon, children: l ? r ? /* @__PURE__ */ n(ua, {}) : /* @__PURE__ */ n(da, {}) : /* @__PURE__ */ n(ye, {}) }),
          /* @__PURE__ */ n(
            "span",
            {
              className: `${pe.acpFileTreeName}${l ? "" : ` ${pe.acpFileTreeNameFile}`}`,
              children: e.name
            }
          )
        ]
      }
    ),
    l && r && i && /* @__PURE__ */ n("div", { role: "group", children: e.children.map((f) => /* @__PURE__ */ n(
      a,
      {
        node: f,
        depth: t + 1,
        onNavigate: s,
        onExpand: o,
        onCollapse: c
      },
      f.path
    )) })
  ] });
});
function Vs({
  files: a,
  onNavigate: e,
  className: t,
  showRoot: s,
  onExpand: o,
  onCollapse: c
}) {
  const { t: r } = B(), i = Z(() => Sa(a), [a]), l = i.length > 0;
  return /* @__PURE__ */ n(
    "div",
    {
      className: `${pe.acpFileTree}${t ? ` ${t}` : ""}`,
      children: /* @__PURE__ */ n("div", { className: pe.acpFileTreeBody, role: "tree", "aria-label": r("fileTree.title"), children: l ? i.map((p) => /* @__PURE__ */ n(
        As,
        {
          node: p,
          depth: 0,
          onNavigate: e,
          onExpand: o,
          onCollapse: c
        },
        p.path
      )) : /* @__PURE__ */ n("div", { className: pe.acpFileTreeEmpty, children: r("fileTree.empty") }) })
    }
  );
}
const Ms = "_acp-sidebar_rymgi_1", Fs = "_acp-sidebar__sessions_rymgi_6", xs = "_acp-sidebar__files_rymgi_12", Bs = "_acp-sidebar__files-header_rymgi_18", Es = "_acp-sidebar__files-back_rymgi_26", Rs = "_acp-sidebar__files-title_rymgi_44", zs = "_acp-sidebar__files-name_rymgi_52", Os = "_acp-sidebar__files-body_rymgi_61", Hs = "_acp-sidebar__files-error_rymgi_67", Ws = "_acp-sidebar__files-loading_rymgi_72", Us = "_acp-sidebar__empty_rymgi_77", qs = "_acp-sidebar__empty-back_rymgi_88", te = {
  acpSidebar: Ms,
  acpSidebarSessions: Fs,
  acpSidebarFiles: xs,
  acpSidebarFilesHeader: Bs,
  acpSidebarFilesBack: Es,
  acpSidebarFilesTitle: Rs,
  acpSidebarFilesName: zs,
  acpSidebarFilesBody: Os,
  acpSidebarFilesError: Hs,
  acpSidebarFilesLoading: Ws,
  acpSidebarEmpty: Us,
  acpSidebarEmptyBack: qs
};
function Gs(a) {
  const t = a.replace(/[/\\]+$/, "").split(/[/\\]/);
  return t[t.length - 1] || a;
}
function js({ cwd: a, onNavigateFile: e, onBack: t }) {
  const { t: s } = B(), { files: o, loading: c, error: r, onExpand: i, onCollapse: l } = Cs({ cwd: a });
  return /* @__PURE__ */ u("div", { className: te.acpSidebarFiles, children: [
    /* @__PURE__ */ u("div", { className: te.acpSidebarFilesHeader, children: [
      /* @__PURE__ */ n(
        "button",
        {
          className: te.acpSidebarFilesBack,
          onClick: t,
          "aria-label": s("sidebar.backToSessions"),
          title: s("sidebar.backToSessions"),
          children: /* @__PURE__ */ n(ma, {})
        }
      ),
      /* @__PURE__ */ n("span", { className: te.acpSidebarFilesTitle, children: s("sidebar.filesTitle") }),
      /* @__PURE__ */ n("span", { className: te.acpSidebarFilesName, children: Gs(a) })
    ] }),
    /* @__PURE__ */ n("div", { className: te.acpSidebarFilesBody, children: r ? /* @__PURE__ */ u("div", { className: te.acpSidebarFilesError, children: [
      "Error: ",
      r
    ] }) : c && o.length === 0 ? /* @__PURE__ */ n("div", { className: te.acpSidebarFilesLoading, children: "Loading..." }) : /* @__PURE__ */ n(
      Vs,
      {
        files: o,
        onExpand: i,
        onCollapse: l,
        onNavigate: e
      }
    ) })
  ] });
}
function Bl({ onBrowse: a, onNavigateFile: e, className: t }) {
  const { t: s } = B(), [o, c] = $("sessions"), [r, i] = $(null), l = K((w) => {
    if (!w.activeSessionId) return null;
    for (const [f, d] of w.workspaces)
      if (d.sessions.has(w.activeSessionId)) return f;
    return null;
  }), p = g((w) => {
    i(w), c("files");
  }, []), _ = g(() => {
    c("sessions");
  }, []), m = r || l;
  return /* @__PURE__ */ n("div", { className: `${te.acpSidebar}${t ? ` ${t}` : ""}`, children: o === "sessions" ? /* @__PURE__ */ u(Ce, { children: [
    /* @__PURE__ */ n("div", { className: te.acpSidebarSessions, children: /* @__PURE__ */ n(Ss, { onBrowse: a, onShowFiles: p }) }),
    /* @__PURE__ */ n(vt, {})
  ] }) : m ? /* @__PURE__ */ n(
    js,
    {
      cwd: m,
      onNavigateFile: e,
      onBack: _
    }
  ) : /* @__PURE__ */ u("div", { className: te.acpSidebarEmpty, children: [
    /* @__PURE__ */ n(
      "button",
      {
        className: te.acpSidebarEmptyBack,
        onClick: _,
        "aria-label": s("sidebar.backToSessions"),
        children: /* @__PURE__ */ n(ma, {})
      }
    ),
    s("sidebar.noWorkspace")
  ] }) });
}
const Ks = "_acp-markdown_ovrih_1", Xs = "_acp-markdown-table_ovrih_106", Js = "_acp-markdown-code-block_ovrih_113", Qs = "_acp-markdown-code-header_ovrih_135", Ae = {
  acpMarkdown: Ks,
  acpMarkdownTable: Xs,
  acpMarkdownCodeBlock: Js,
  acpMarkdownCodeHeader: Qs
}, Ys = {
  pre({ children: a, node: e, ...t }) {
    var i, l;
    const s = e == null ? void 0 : e.children, o = (l = (i = s == null ? void 0 : s[0]) == null ? void 0 : i.properties) == null ? void 0 : l.className, c = Array.isArray(o) ? o.find((p) => p.startsWith("language-")) : void 0, r = c == null ? void 0 : c.replace("language-", "");
    return r ? /* @__PURE__ */ u("div", { className: Ae.acpMarkdownCodeBlock, children: [
      /* @__PURE__ */ n("div", { className: Ae.acpMarkdownCodeHeader, children: /* @__PURE__ */ n("span", { children: r }) }),
      /* @__PURE__ */ n("pre", { ...t, children: a })
    ] }) : /* @__PURE__ */ n("pre", { ...t, children: a });
  },
  code({ className: a, children: e, ...t }) {
    return /* @__PURE__ */ n("code", { className: a, ...t, children: e });
  },
  a({ href: a, children: e, ...t }) {
    return /* @__PURE__ */ n("a", { href: a, target: "_blank", rel: "noopener noreferrer", ...t, children: e });
  },
  table({ children: a }) {
    return /* @__PURE__ */ n("div", { className: Ae.acpMarkdownTable, children: /* @__PURE__ */ n("table", { children: a }) });
  }
}, We = ae.memo(function({ children: e, className: t }) {
  return /* @__PURE__ */ n("div", { className: `${Ae.acpMarkdown}${t ? ` ${t}` : ""}`, children: /* @__PURE__ */ n(bn, { remarkPlugins: [wn], components: Ys, children: e }) });
});
function Le(a) {
  const e = _e(ve, (t) => a ? t.sessions.get(a) ?? null : null);
  return e ? {
    messages: e.messages,
    isStreaming: e.isStreaming,
    pendingToolCalls: Array.from(e.pendingToolCalls.values()),
    pendingPermissions: e.pendingPermissions,
    plan: e.plan,
    usage: e.usage,
    configOptions: e.configOptions,
    availableCommands: e.availableCommands
  } : {
    messages: [],
    isStreaming: !1,
    pendingToolCalls: [],
    pendingPermissions: [],
    plan: [],
    usage: null,
    configOptions: [],
    availableCommands: []
  };
}
const Zs = "_acp-diff-view_1cavl_1", eo = "_acp-diff-view__header_1cavl_8", ao = "_acp-diff-view__content_1cavl_23", no = "_acp-diff-view__file_1cavl_31", to = "_acp-diff-view__filename_1cavl_37", so = "_acp-diff-view__old_1cavl_45", oo = "_acp-diff-view__new_1cavl_51", re = {
  acpDiffView: Zs,
  acpDiffViewHeader: eo,
  acpDiffViewContent: ao,
  acpDiffViewFile: no,
  acpDiffViewFilename: to,
  acpDiffViewOld: so,
  acpDiffViewNew: oo
};
function co({ diffs: a = [] }) {
  const { t: e } = B();
  return a.length === 0 ? /* @__PURE__ */ u("div", { className: re.acpDiffView, children: [
    /* @__PURE__ */ n("div", { className: re.acpDiffViewHeader, children: e("diff.title") }),
    /* @__PURE__ */ n("div", { className: re.acpDiffEmptyState, children: e("diff.emptyState") })
  ] }) : /* @__PURE__ */ u("div", { className: re.acpDiffView, children: [
    /* @__PURE__ */ n("div", { className: re.acpDiffViewHeader, children: e("diff.title") }),
    /* @__PURE__ */ n("div", { className: re.acpDiffViewContent, children: a.map((t, s) => /* @__PURE__ */ u("div", { className: re.acpDiffViewFile, children: [
      /* @__PURE__ */ n("div", { className: re.acpDiffViewFilename, children: t.path }),
      t.oldText && /* @__PURE__ */ u("div", { className: re.acpDiffViewOld, children: [
        "- ",
        t.oldText
      ] }),
      /* @__PURE__ */ u("div", { className: re.acpDiffViewNew, children: [
        "+ ",
        t.newText
      ] })
    ] }, s)) })
  ] });
}
function io(a) {
  const e = _e(ve, (t) => a ? t.sessions.get(a) ?? null : null);
  return Z(() => e ? Array.from(e.terminals.values()) : [], [e]);
}
const ro = "_acp-terminal-view_h2e3h_1", lo = "_acp-terminal-view__header_h2e3h_9", W = {
  acpTerminalView: ro,
  acpTerminalViewHeader: lo
};
function po({ sessionId: a, terminalId: e }) {
  const { t } = B(), s = io(a ?? null), o = _e(ve, (r) => {
    var i;
    if (!(!a || !e))
      return (i = r.sessions.get(a)) == null ? void 0 : i.terminals.get(e);
  });
  let c;
  return e ? c = o ? [o] : [{ terminalId: e, command: "", output: "", exitStatus: null, truncated: !1 }] : c = s, c.length === 0 ? /* @__PURE__ */ u("div", { className: W.acpTerminalView, children: [
    /* @__PURE__ */ n("div", { className: W.acpTerminalViewHeader, children: t("terminal.title") }),
    /* @__PURE__ */ n("div", { className: W.acpTerminalEmpty, children: t("terminal.empty") })
  ] }) : /* @__PURE__ */ u("div", { className: W.acpTerminalView, children: [
    /* @__PURE__ */ u("div", { className: W.acpTerminalViewHeader, children: [
      t("terminal.title"),
      /* @__PURE__ */ n("span", { className: W.acpTerminalCount, children: c.length })
    ] }),
    /* @__PURE__ */ n("div", { className: W.acpTerminalList, children: c.map((r) => /* @__PURE__ */ n(uo, { terminal: r, t }, r.terminalId)) })
  ] });
}
function uo({ terminal: a, t: e }) {
  var r;
  const [t, s] = $(!1), o = a.exitStatus === null, c = ((r = a.exitStatus) == null ? void 0 : r.exitCode) != null;
  return /* @__PURE__ */ u("div", { className: `${W.acpTerminalItem} ${o ? W.acpTerminalItemRunning : ""}`, children: [
    /* @__PURE__ */ u(
      "button",
      {
        type: "button",
        className: W.acpTerminalItemHeader,
        onClick: () => s(!t),
        "aria-expanded": !t,
        children: [
          /* @__PURE__ */ n("span", { className: W.acpTerminalItemStatus, children: o ? /* @__PURE__ */ n("span", { className: W.acpTerminalStatusDot }) : c ? /* @__PURE__ */ n("span", { className: `${W.acpTerminalExitBadge} ${a.exitStatus.exitCode === 0 ? W.acpTerminalExitSuccess : W.acpTerminalExitError}`, children: a.exitStatus.exitCode }) : /* @__PURE__ */ n("span", { className: W.acpTerminalExitBadge, children: e("terminal.signaled") }) }),
          /* @__PURE__ */ u("span", { className: W.acpTerminalItemCommand, children: [
            /* @__PURE__ */ n("span", { className: W.acpTerminalItemLabel, children: e("terminal.command") }),
            a.command,
            a.args ? ` ${a.args.join(" ")}` : ""
          ] }),
          /* @__PURE__ */ n("span", { className: W.acpTerminalChevron, children: t ? /* @__PURE__ */ n(be, {}) : /* @__PURE__ */ n(tn, {}) })
        ]
      }
    ),
    !t && /* @__PURE__ */ u("pre", { className: W.acpTerminalItemOutput, children: [
      a.output || (o ? e("terminal.running") : ""),
      a.truncated && /* @__PURE__ */ n("span", { className: W.acpTerminalTruncatedNote, children: e("terminal.truncated") })
    ] })
  ] });
}
const mo = "_acp-tool-call_1ozwf_1", _o = "_acp-tool-call__header_1ozwf_14", go = "_acp-tool-call__status_1ozwf_28", ho = "_acp-tool-call__status--pending_1ozwf_34", fo = "_acp-tool-call__status--in-progress_1ozwf_38", bo = "_acp-tool-call__status--completed_1ozwf_42", wo = "_acp-tool-call__status--failed_1ozwf_45", So = "_acp-tool-call__kind_1ozwf_48", Co = "_acp-tool-call__name_1ozwf_56", vo = "_acp-tool-call__chevron_1ozwf_65", yo = "_acp-tool-call__chevron--open_1ozwf_73", ko = "_acp-tool-call__body_1ozwf_76", To = "_acp-tool-call__content-text_1ozwf_82", No = "_acp-tool-call__locations_1ozwf_85", Do = "_acp-tool-call__location_1ozwf_85", Lo = "_acp-tool-call__location-icon_1ozwf_116", Po = "_acp-tool-call__location-path_1ozwf_120", Io = "_acp-tool-call__location-line_1ozwf_123", j = {
  acpToolCall: mo,
  acpToolCallHeader: _o,
  acpToolCallStatus: go,
  acpToolCallStatusPending: ho,
  acpToolCallStatusInProgress: fo,
  acpToolCallStatusCompleted: bo,
  acpToolCallStatusFailed: wo,
  acpToolCallKind: So,
  acpToolCallName: Co,
  acpToolCallChevron: vo,
  acpToolCallChevronOpen: yo,
  acpToolCallBody: ko,
  acpToolCallContentText: To,
  acpToolCallLocations: No,
  acpToolCallLocation: Do,
  acpToolCallLocationIcon: Lo,
  acpToolCallLocationPath: Po,
  acpToolCallLocationLine: Io
}, $o = {
  pending: j.acpToolCallStatusPending,
  in_progress: j.acpToolCallStatusInProgress,
  completed: j.acpToolCallStatusCompleted,
  failed: j.acpToolCallStatusFailed
}, Ao = {
  read: /* @__PURE__ */ n(ye, {}),
  edit: /* @__PURE__ */ n(ga, {}),
  delete: /* @__PURE__ */ n(pn, {}),
  move: /* @__PURE__ */ n(ln, {}),
  search: /* @__PURE__ */ n(rn, {}),
  execute: /* @__PURE__ */ n(cn, {}),
  think: /* @__PURE__ */ n(on, {}),
  fetch: /* @__PURE__ */ n(la, {}),
  switch_mode: /* @__PURE__ */ n(_a, {})
};
function Vo({ loc: a, onNavigate: e }) {
  const t = a.path.replace(/\\/g, "/").split("/").pop() || a.path, s = (o) => {
    o.stopPropagation(), e == null || e(a.path, a.line);
  };
  return /* @__PURE__ */ u(
    "span",
    {
      className: j.acpToolCallLocation,
      onClick: s,
      title: `${a.path}${a.line != null ? `:${a.line}` : ""}`,
      role: "button",
      tabIndex: 0,
      onKeyDown: (o) => {
        (o.key === "Enter" || o.key === " ") && (o.preventDefault(), o.stopPropagation(), e == null || e(a.path, a.line));
      },
      children: [
        /* @__PURE__ */ n("span", { className: j.acpToolCallLocationIcon, children: /* @__PURE__ */ n(ye, {}) }),
        /* @__PURE__ */ u("span", { className: j.acpToolCallLocationPath, children: [
          t,
          a.line != null && /* @__PURE__ */ u("span", { className: j.acpToolCallLocationLine, children: [
            ":",
            a.line
          ] })
        ] })
      ]
    }
  );
}
const Mo = ae.memo(function({ sessionId: e, toolCall: t, onNavigate: s, expanded: o, onExpandedChange: c }) {
  const r = t.content && t.content.length > 0, i = t.locations && t.locations.length > 0, { t: l } = B();
  return /* @__PURE__ */ u("div", { className: j.acpToolCall, children: [
    /* @__PURE__ */ u(
      "button",
      {
        className: j.acpToolCallHeader,
        onClick: () => c(!o),
        "aria-expanded": o,
        children: [
          /* @__PURE__ */ n("span", { className: `${j.acpToolCallStatus} ${$o[String(t.status)] || ""}` }),
          t.kind && /* @__PURE__ */ n("span", { className: j.acpToolCallKind, title: t.kind, children: Ao[t.kind] || /* @__PURE__ */ n(sn, {}) }),
          /* @__PURE__ */ n("span", { className: j.acpToolCallName, children: t.title }),
          /* @__PURE__ */ n("span", { className: `${j.acpToolCallChevron}${o ? ` ${j.acpToolCallChevronOpen}` : ""}`, children: /* @__PURE__ */ n(be, {}) })
        ]
      }
    ),
    o && i && /* @__PURE__ */ n("div", { className: j.acpToolCallLocations, children: t.locations.map((p, _) => /* @__PURE__ */ n(Vo, { loc: p, onNavigate: s }, `${p.path}:${p.line ?? ""}-${_}`)) }),
    o && r && /* @__PURE__ */ n("div", { className: j.acpToolCallBody, children: t.content.map((p, _) => {
      switch (p.type) {
        case "content": {
          const m = p;
          return /* @__PURE__ */ n("pre", { className: j.acpToolCallContentText, children: m.content.text }, _);
        }
        case "diff": {
          const m = p;
          return /* @__PURE__ */ n(
            co,
            {
              diffs: [{ path: m.path, oldText: m.oldText ?? void 0, newText: m.newText }]
            },
            _
          );
        }
        case "terminal":
          return /* @__PURE__ */ n(po, { sessionId: e, terminalId: p.terminalId }, _);
        default:
          return null;
      }
    }) })
  ] });
}), Fo = "_acp-thought-view_1hsnd_1", xo = "_acp-thought-view__header_1hsnd_6", Bo = "_acp-thought-view__label_1hsnd_22", Eo = "_acp-thought-view__chevron_1hsnd_25", Ro = "_acp-thought-view__chevron--open_1hsnd_31", zo = "_acp-thought-view__spinner_1hsnd_34", Oo = "_acp-thought-view__body_1hsnd_42", Ho = "_acp-thought-view__empty_1hsnd_72", ue = {
  acpThoughtView: Fo,
  acpThoughtViewHeader: xo,
  acpThoughtViewLabel: Bo,
  acpThoughtViewChevron: Eo,
  acpThoughtViewChevronOpen: Ro,
  acpThoughtViewSpinner: zo,
  acpThoughtViewBody: Oo,
  acpThoughtViewEmpty: Ho
};
function Wo(a) {
  switch (a.type) {
    case "text":
      return /* @__PURE__ */ n(We, { children: a.text });
    case "resource":
    case "resource_link":
      return null;
    default:
      return null;
  }
}
const Uo = ae.memo(function({ thought: e, isStreaming: t, expanded: s, onExpandedChange: o }) {
  const { t: c } = B(), r = V(!1);
  H(() => {
    t && !r.current ? o(!0) : !t && r.current && o(!1), r.current = t;
  }, [t]);
  const i = e.length > 0 && e.some(
    (l) => l.type === "text" && l.text.length > 0
  );
  return /* @__PURE__ */ u("div", { className: ue.acpThoughtView, children: [
    /* @__PURE__ */ u(
      "button",
      {
        className: ue.acpThoughtViewHeader,
        onClick: () => o(!s),
        "aria-expanded": s,
        children: [
          /* @__PURE__ */ n("span", { className: `${ue.acpThoughtViewChevron}${s ? ` ${ue.acpThoughtViewChevronOpen}` : ""}`, children: /* @__PURE__ */ n(be, {}) }),
          /* @__PURE__ */ n("span", { className: ue.acpThoughtViewLabel, children: c(t ? "thought.thinking" : "thought.title") }),
          t && /* @__PURE__ */ n("span", { className: ue.acpThoughtViewSpinner })
        ]
      }
    ),
    s && i && /* @__PURE__ */ n("div", { className: ue.acpThoughtViewBody, children: e.map((l, p) => /* @__PURE__ */ n(ae.Fragment, { children: Wo(l) }, p)) }),
    s && t && !i && /* @__PURE__ */ n("div", { className: ue.acpThoughtViewBody, children: /* @__PURE__ */ n("span", { className: ue.acpThoughtViewEmpty, children: c("thought.reasoning") }) })
  ] });
}), qo = "_acp-plan-view_1yzmu_1", Go = "_acp-plan-view--streaming_1yzmu_13", jo = "_acp-plan-view__header_1yzmu_16", Ko = "_acp-plan-view__chevron_1yzmu_32", Xo = "_acp-plan-view__chevron--open_1yzmu_41", Jo = "_acp-plan-view__label_1yzmu_44", Qo = "_acp-plan-view__progress_1yzmu_47", Yo = "_acp-plan-view__spinner_1yzmu_53", Zo = "_acp-plan-view__body_1yzmu_61", ec = "_acp-plan-list_1yzmu_68", ac = "_acp-plan-item_1yzmu_74", nc = "_acp-plan-item-status_1yzmu_106", tc = "_acp-plan-item-content_1yzmu_124", sc = "_acp-plan-item-content--done_1yzmu_127", q = {
  acpPlanView: qo,
  acpPlanViewStreaming: Go,
  acpPlanViewHeader: jo,
  acpPlanViewChevron: Ko,
  acpPlanViewChevronOpen: Xo,
  acpPlanViewLabel: Jo,
  acpPlanViewProgress: Qo,
  acpPlanViewSpinner: Yo,
  acpPlanViewBody: Zo,
  acpPlanList: ec,
  acpPlanItem: ac,
  acpPlanItemStatus: nc,
  acpPlanItemContent: tc,
  acpPlanItemContentDone: sc
}, Qe = {
  pending: /* @__PURE__ */ n(un, {}),
  in_progress: /* @__PURE__ */ n(_a, { spin: !0 }),
  completed: /* @__PURE__ */ n(dn, {})
}, oc = {
  pending: q.acpPlanStatusPending,
  in_progress: q.acpPlanStatusInProgress,
  completed: q.acpPlanStatusCompleted
}, cc = {
  high: q.acpPlanPriorityHigh,
  medium: q.acpPlanPriorityMedium,
  low: q.acpPlanPriorityLow
};
function Ca({ entries: a, isStreaming: e }) {
  const [t, s] = $(!0), o = V(e), { t: c } = B();
  if (H(() => {
    e ? s(!0) : o.current && !e && s(!1), o.current = e;
  }, [e]), a.length === 0) return null;
  const r = a.filter((l) => l.status === "completed").length, i = a.filter((l) => l.status === "in_progress").length;
  return /* @__PURE__ */ u("div", { className: `${q.acpPlanView}${e ? ` ${q.acpPlanViewStreaming}` : ""}`, children: [
    /* @__PURE__ */ u(
      "button",
      {
        className: q.acpPlanViewHeader,
        onClick: () => s(!t),
        "aria-expanded": t,
        children: [
          /* @__PURE__ */ n("span", { className: `${q.acpPlanViewChevron}${t ? ` ${q.acpPlanViewChevronOpen}` : ""}`, children: /* @__PURE__ */ n(be, {}) }),
          /* @__PURE__ */ n("span", { className: q.acpPlanViewLabel, children: c(e ? "plan.planning" : "plan.title") }),
          /* @__PURE__ */ u("span", { className: q.acpPlanViewProgress, children: [
            r,
            "/",
            a.length
          ] }),
          i > 0 && /* @__PURE__ */ n("span", { className: q.acpPlanViewSpinner })
        ]
      }
    ),
    t && /* @__PURE__ */ n("div", { className: q.acpPlanViewBody, children: /* @__PURE__ */ n("ol", { className: q.acpPlanList, children: a.map((l, p) => /* @__PURE__ */ u("li", { className: `${q.acpPlanItem} ${cc[l.priority] ?? ""}`, children: [
      /* @__PURE__ */ n("span", { className: `${q.acpPlanItemStatus} ${oc[l.status] ?? ""}`, children: Qe[l.status] ?? Qe.pending }),
      /* @__PURE__ */ n("span", { className: `${q.acpPlanItemContent}${l.status === "completed" ? ` ${q.acpPlanItemContentDone}` : ""}`, children: l.content })
    ] }, p)) }) })
  ] });
}
const ic = "_acp-chat-view_8r5ye_1", rc = "_acp-chat-header_8r5ye_9", lc = "_acp-chat-header__title_8r5ye_20", pc = "_acp-message-list-wrapper_8r5ye_30", dc = "_acp-message-list_8r5ye_30", uc = "_acp-virtuoso-item_8r5ye_40", mc = "_acp-round_8r5ye_54", _c = "_acp-message-bubble_8r5ye_62", gc = "_acp-message-bubble--agent_8r5ye_66", hc = "_acp-message-bubble__content_8r5ye_66", fc = "_acp-message-bubble__resource_8r5ye_75", bc = "_acp-message-bubble__resource-name_8r5ye_90", wc = "_acp-message-bubble__stop-reason_8r5ye_99", Sc = "_acp-message-bubble__image_8r5ye_104", Cc = "_acp-streaming-indicator_8r5ye_112", vc = "_acp-streaming-indicator__dots_8r5ye_123", yc = "_acp-streaming-indicator__dot_8r5ye_123", kc = "_acp-scroll-to-bottom_8r5ye_151", Tc = "_acp-scroll-to-bottom-arrow_8r5ye_178", Nc = "_acp-chat-bottom_8r5ye_197", Dc = "_acp-chat-footer_8r5ye_204", Lc = "_acp-chat-empty_8r5ye_212", x = {
  acpChatView: ic,
  acpChatHeader: rc,
  acpChatHeaderTitle: lc,
  acpMessageListWrapper: pc,
  acpMessageList: dc,
  acpVirtuosoItem: uc,
  acpRound: mc,
  acpMessageBubble: _c,
  acpMessageBubbleAgent: gc,
  acpMessageBubbleContent: hc,
  acpMessageBubbleResource: fc,
  acpMessageBubbleResourceName: bc,
  acpMessageBubbleStopReason: wc,
  acpMessageBubbleImage: Sc,
  acpStreamingIndicator: Cc,
  acpStreamingIndicatorDots: vc,
  acpStreamingIndicatorDot: yc,
  acpScrollToBottom: kc,
  acpScrollToBottomArrow: Tc,
  acpChatBottom: Nc,
  acpChatFooter: Dc,
  acpChatEmpty: Lc
};
function Pc(a) {
  if ("annotations" in a && a.annotations != null) return null;
  switch (a.type) {
    case "text":
      return /* @__PURE__ */ n(We, { children: a.text });
    case "resource":
      const e = a, t = e.resource.uri.split("/").pop() || e.resource.uri, s = decodeURIComponent(t);
      return /* @__PURE__ */ u("div", { className: x.acpMessageBubbleResource, children: [
        /* @__PURE__ */ n("span", { children: /* @__PURE__ */ n(ye, {}) }),
        /* @__PURE__ */ n("div", { children: /* @__PURE__ */ n("div", { className: x.acpMessageBubbleResourceName, children: s }) })
      ] });
    case "resource_link":
      const o = a;
      return /* @__PURE__ */ u("div", { className: x.acpMessageBubbleResource, children: [
        /* @__PURE__ */ n("span", { children: /* @__PURE__ */ n(ha, {}) }),
        /* @__PURE__ */ n("span", { className: x.acpMessageBubbleResourceName, children: o.name || o.uri })
      ] });
    case "image": {
      const c = a, r = `data:${c.mimeType};base64,${c.data}`;
      return /* @__PURE__ */ n(
        "img",
        {
          className: x.acpMessageBubbleImage,
          src: r,
          alt: c.uri || "image"
        }
      );
    }
    default:
      return null;
  }
}
function Ic(a, e, t, s, o, c) {
  const r = a.expanded ?? !1;
  function i(l) {
    t && ve.getState().setPartExpanded(t, s, e, l);
  }
  switch (a.type) {
    case "thought":
      return /* @__PURE__ */ n(
        Uo,
        {
          thought: a.thought,
          isStreaming: !!o,
          expanded: r,
          onExpandedChange: i
        },
        e
      );
    case "tool_calls":
      return a.toolCalls.map((l) => /* @__PURE__ */ n(
        Mo,
        {
          sessionId: t,
          toolCall: l,
          onNavigate: c,
          expanded: r,
          onExpandedChange: i
        },
        l.toolCallId
      ));
    case "content":
      return a.content.map((l, p) => /* @__PURE__ */ n(ae.Fragment, { children: Pc(l) }, p));
    case "plan":
      return a.plan.every((l) => l.status === "completed") ? /* @__PURE__ */ n(Ca, { entries: a.plan, isStreaming: !1 }, e) : null;
  }
}
function $c(a, e) {
  if (a.length !== e.length) return !1;
  for (let t = 0; t < a.length; t++)
    if (a[t] !== e[t]) return !1;
  return !0;
}
const Ac = ae.memo(function({
  message: e,
  sessionId: t,
  isStreaming: s,
  onNavigateFile: o
}) {
  const { t: c } = B(), r = e.parts.length - 1, i = e.parts[r], l = s && (i == null ? void 0 : i.type) === "thought";
  return /* @__PURE__ */ u(Ce, { children: [
    e.parts.map((p, _) => {
      const m = _ === r && l;
      return Ic(p, _, t, e.id, m, o);
    }),
    e.stopReason && /* @__PURE__ */ n("div", { className: x.acpMessageBubbleStopReason, children: c(`stopReason.${e.stopReason}`) })
  ] });
}), Vc = ae.memo(function({ sessionId: e, messages: t, isStreaming: s = !1, onNavigateFile: o }) {
  const c = t.length - 1;
  return /* @__PURE__ */ n("div", { className: `${x.acpMessageBubble} ${x.acpMessageBubbleAgent}`, children: /* @__PURE__ */ n("div", { className: x.acpMessageBubbleContent, children: t.map((r, i) => /* @__PURE__ */ n(
    Ac,
    {
      message: r,
      sessionId: e,
      isStreaming: s && i === c,
      onNavigateFile: o
    },
    r.id
  )) }) });
}, (a, e) => a.sessionId === e.sessionId && a.isStreaming === e.isStreaming && a.onNavigateFile === e.onNavigateFile && $c(a.messages, e.messages)), Mc = "_acp-user-message_4a1s0_1", Fc = "_acp-user-message__actions_4a1s0_8", xc = "_acp-user-message__action-btn_4a1s0_25", Bc = "_acp-user-message__action-btn--copied_4a1s0_45", Ec = "_acp-user-message__bubble_4a1s0_49", Rc = "_acp-user-message__attachments_4a1s0_60", zc = "_acp-user-message__attachment_4a1s0_60", Oc = "_acp-user-message__attachment--image_4a1s0_80", Hc = "_acp-user-message__stop-reason_4a1s0_91", oe = {
  acpUserMessage: Mc,
  acpUserMessageActions: Fc,
  acpUserMessageActionBtn: xc,
  acpUserMessageActionBtnCopied: Bc,
  acpUserMessageBubble: Ec,
  acpUserMessageAttachments: Rc,
  acpUserMessageAttachment: zc,
  acpUserMessageAttachmentImage: Oc,
  acpUserMessageStopReason: Hc
};
function Wc({ textContent: a, onEdit: e }) {
  const [t, s] = $(!1), { t: o } = B();
  H(() => {
    if (!t) return;
    const i = setTimeout(() => s(!1), 2e3);
    return () => clearTimeout(i);
  }, [t]);
  const c = g(async () => {
    try {
      await navigator.clipboard.writeText(a), s(!0);
    } catch {
    }
  }, [a]), r = g(() => {
    e(a);
  }, [a, e]);
  return /* @__PURE__ */ u("div", { className: oe.acpUserMessageActions, children: [
    /* @__PURE__ */ n(
      "button",
      {
        className: `${oe.acpUserMessageActionBtn} ${t ? oe.acpUserMessageActionBtnCopied : ""}`,
        onClick: c,
        "aria-label": o("userMessage.copy"),
        title: o("userMessage.copy"),
        children: t ? /* @__PURE__ */ n(mn, {}) : /* @__PURE__ */ n(_n, {})
      }
    ),
    /* @__PURE__ */ n(
      "button",
      {
        className: oe.acpUserMessageActionBtn,
        onClick: r,
        "aria-label": o("userMessage.edit"),
        title: o("userMessage.edit"),
        children: /* @__PURE__ */ n(ga, {})
      }
    )
  ] });
}
function Uc(a) {
  const e = [], t = [], s = [];
  for (const o of a.parts)
    if (o.type === "content")
      for (const c of o.content)
        "annotations" in c && c.annotations != null || (c.type === "text" ? (e.push(c), s.push(c.text)) : t.push(c));
  return { textBlocks: e, attachmentBlocks: t, textContent: s.join(`
`) };
}
function qc(a) {
  switch (a.type) {
    case "image": {
      const e = a, t = `data:${e.mimeType};base64,${e.data}`;
      return /* @__PURE__ */ n("div", { className: `${oe.acpUserMessageAttachment} ${oe.acpUserMessageAttachmentImage}`, children: /* @__PURE__ */ n("img", { src: t, alt: e.uri || "image" }) }, e.uri || e.data.slice(0, 20));
    }
    case "resource": {
      const e = a, t = e.resource.uri.split("/").pop() || e.resource.uri, s = decodeURIComponent(t);
      return /* @__PURE__ */ u("div", { className: oe.acpUserMessageAttachment, children: [
        /* @__PURE__ */ n("span", { children: /* @__PURE__ */ n(ye, {}) }),
        /* @__PURE__ */ n("span", { children: s })
      ] }, e.resource.uri);
    }
    case "resource_link": {
      const e = a;
      return /* @__PURE__ */ u("div", { className: oe.acpUserMessageAttachment, children: [
        /* @__PURE__ */ n("span", { children: /* @__PURE__ */ n(ha, {}) }),
        /* @__PURE__ */ n("span", { children: e.name || e.uri })
      ] }, e.uri);
    }
    default:
      return null;
  }
}
const Gc = ae.memo(function({ message: e, onEdit: t }) {
  const { t: s } = B(), { textBlocks: o, attachmentBlocks: c, textContent: r } = Z(
    () => Uc(e),
    [e]
  );
  return /* @__PURE__ */ u("div", { className: oe.acpUserMessage, children: [
    /* @__PURE__ */ u("div", { className: oe.acpUserMessageBubble, children: [
      c.length > 0 && /* @__PURE__ */ n("div", { className: oe.acpUserMessageAttachments, children: c.map(qc) }),
      o.map((i, l) => {
        const p = i.text;
        return /* @__PURE__ */ n(We, { children: p }, l);
      })
    ] }),
    t && r && /* @__PURE__ */ n(Wc, { textContent: r, onEdit: t }),
    e.stopReason && /* @__PURE__ */ n("div", { className: oe.acpUserMessageStopReason, children: s(`stopReason.${e.stopReason}`) })
  ] });
});
function jc(a) {
  const { getClient: e } = ke(), t = Z(() => {
    if (!a) return null;
    const c = se.getState();
    for (const [, r] of c.workspaces) {
      const i = r.sessions.get(a);
      if (i) return e(i.agentId);
    }
    return null;
  }, [a, e]), s = g(async (c) => {
    if (!(!a || !t))
      return Oa(t, a, c);
  }, [a, t]), o = g(async () => {
    if (!(!a || !t))
      return Ha(t, a);
  }, [a, t]);
  return { send: s, cancel: o };
}
const Kc = "_acp-command-palette_1abam_1", Xc = "_acp-command-palette__trigger_1abam_6", Jc = "_acp-command-palette__popover_1abam_32", Qc = "_acp-command-palette__popover--inline_1abam_47", Yc = "_acp-command-palette__search_1abam_54", Zc = "_acp-command-palette__list_1abam_78", ei = "_acp-command-palette__empty_1abam_84", ai = "_acp-command-palette__item_1abam_91", ni = "_acp-command-palette__item--active_1abam_107", ti = "_acp-command-palette__item-icon_1abam_111", si = "_acp-command-palette__item-body_1abam_127", oi = "_acp-command-palette__item-name_1abam_132", ci = "_acp-command-palette__item-desc_1abam_142", ii = "_acp-command-palette__item-hint_1abam_151", Q = {
  acpCommandPalette: Kc,
  acpCommandPaletteTrigger: Xc,
  acpCommandPalettePopover: Jc,
  acpCommandPalettePopoverInline: Qc,
  acpCommandPaletteSearch: Yc,
  acpCommandPaletteList: Zc,
  acpCommandPaletteEmpty: ei,
  acpCommandPaletteItem: ai,
  acpCommandPaletteItemActive: ni,
  acpCommandPaletteItemIcon: ti,
  acpCommandPaletteItemBody: si,
  acpCommandPaletteItemName: oi,
  acpCommandPaletteItemDesc: ci,
  acpCommandPaletteItemHint: ii
};
function ri({
  commands: a,
  onSelect: e,
  disabled: t,
  inline: s,
  open: o,
  query: c,
  activeIndex: r,
  onClose: i,
  className: l
}) {
  const [p, _] = $(!1), [m, w] = $(""), [f, d] = $(0), b = V(null), v = V(null), y = V(null), C = V(null), S = !!(s && o !== void 0), h = S ? o : p, P = s && c !== void 0 ? c : m, k = S && r !== void 0 ? r : f, { t: T } = B(), z = Z(() => {
    if (!P || !P.trim()) return a;
    const D = P.toLowerCase();
    return a.filter(
      (R) => R.name.toLowerCase().includes(D) || R.description.toLowerCase().includes(D)
    );
  }, [a, P]);
  H(() => {
    S || d(0);
  }, [P, S]);
  const ee = g(() => {
    t || a.length === 0 || (_(!0), w(""), d(0), setTimeout(() => {
      var D;
      return (D = b.current) == null ? void 0 : D.focus();
    }, 0));
  }, [t, a.length]), N = g(() => {
    var D;
    S ? i == null || i() : (_(!1), w(""), (D = C.current) == null || D.focus());
  }, [S, i]), M = g(
    (D) => {
      e(D), S || (_(!1), w(""));
    },
    [e, S]
  ), G = g(
    (D) => {
      switch (D.key) {
        case "ArrowDown":
          D.preventDefault(), d((R) => Math.min(R + 1, z.length - 1));
          break;
        case "ArrowUp":
          D.preventDefault(), d((R) => Math.max(R - 1, 0));
          break;
        case "Enter":
          D.preventDefault(), z[f] && M(z[f]);
          break;
        case "Escape":
          D.preventDefault(), N();
          break;
      }
    },
    [z, f, M, N]
  );
  return H(() => {
    var R;
    if (!h) return;
    const D = (R = v.current) == null ? void 0 : R.children[k];
    D == null || D.scrollIntoView({ block: "nearest" });
  }, [k, h]), H(() => {
    if (!h || S) return;
    const D = (R) => {
      y.current && !y.current.contains(R.target) && C.current && !C.current.contains(R.target) && N();
    };
    return document.addEventListener("mousedown", D), () => document.removeEventListener("mousedown", D);
  }, [h, N, S]), h ? /* @__PURE__ */ u("div", { className: `${Q.acpCommandPalette}${l ? ` ${l}` : ""}`, children: [
    !s && /* @__PURE__ */ n(
      "button",
      {
        ref: C,
        className: Q.acpCommandPaletteTrigger,
        onClick: ee,
        disabled: t || a.length === 0,
        "aria-label": T("commandPalette.open"),
        title: T("commandPalette.commands"),
        children: "/"
      }
    ),
    /* @__PURE__ */ u("div", { ref: y, className: `${Q.acpCommandPalettePopover}${s ? ` ${Q.acpCommandPalettePopoverInline}` : ""}`, children: [
      !s && /* @__PURE__ */ n("div", { className: Q.acpCommandPaletteSearch, children: /* @__PURE__ */ n(
        "input",
        {
          ref: b,
          type: "text",
          placeholder: T("commandPalette.searchPlaceholder"),
          value: m,
          onChange: (D) => {
            w(D.target.value), d(0);
          },
          onKeyDown: G,
          "aria-label": T("commandPalette.filterCommands")
        }
      ) }),
      /* @__PURE__ */ n("div", { ref: v, className: Q.acpCommandPaletteList, role: "listbox", children: z.length === 0 ? /* @__PURE__ */ n("div", { className: Q.acpCommandPaletteEmpty, children: T("commandPalette.noMatching") }) : z.map((D, R) => /* @__PURE__ */ u(
        "button",
        {
          className: `${Q.acpCommandPaletteItem}${R === k ? ` ${Q.acpCommandPaletteItemActive}` : ""}`,
          role: "option",
          "aria-selected": R === k,
          onMouseDown: (J) => {
            J.preventDefault();
          },
          onClick: () => M(D),
          onMouseEnter: () => {
            S || d(R);
          },
          children: [
            /* @__PURE__ */ n("span", { className: Q.acpCommandPaletteItemIcon, children: "/" }),
            /* @__PURE__ */ u("span", { className: Q.acpCommandPaletteItemBody, children: [
              /* @__PURE__ */ u("div", { className: Q.acpCommandPaletteItemName, children: [
                "/",
                D.name
              ] }),
              /* @__PURE__ */ n("div", { className: Q.acpCommandPaletteItemDesc, children: D.description }),
              D.input && /* @__PURE__ */ n("div", { className: Q.acpCommandPaletteItemHint, children: D.input.hint })
            ] })
          ]
        },
        D.name
      )) })
    ] })
  ] }) : s ? null : /* @__PURE__ */ n("div", { className: `${Q.acpCommandPalette}${l ? ` ${l}` : ""}`, children: /* @__PURE__ */ n(
    "button",
    {
      ref: C,
      className: Q.acpCommandPaletteTrigger,
      onClick: ee,
      disabled: t || a.length === 0,
      "aria-label": T("commandPalette.open"),
      title: T("commandPalette.commands"),
      children: "/"
    }
  ) });
}
const li = "_acp-chat-composer_13pzo_1", pi = "_acp-chat-composer__form_13pzo_6", di = "_acp-chat-composer__body_13pzo_12", ui = "_acp-chat-composer__input_13pzo_25", mi = "_acp-chat-composer__fileList_13pzo_46", _i = "_acp-chat-composer__fileChip_13pzo_52", gi = "_acp-chat-composer__fileThumb_13pzo_64", hi = "_acp-chat-composer__fileName_13pzo_71", fi = "_acp-chat-composer__fileSize_13pzo_78", bi = "_acp-chat-composer__fileRemove_13pzo_82", wi = "_acp-chat-composer__actions_13pzo_103", Si = "_acp-chat-composer__attachBtn_13pzo_110", Ci = "_acp-chat-composer__send_13pzo_135", vi = "_acp-chat-composer__cancel_13pzo_162", yi = "_acp-composer-palette_13pzo_183", Y = {
  acpChatComposer: li,
  acpChatComposerForm: pi,
  acpChatComposerBody: di,
  acpChatComposerInput: ui,
  acpChatComposerFileList: mi,
  acpChatComposerFileChip: _i,
  acpChatComposerFileThumb: gi,
  acpChatComposerFileName: hi,
  acpChatComposerFileSize: fi,
  acpChatComposerFileRemove: bi,
  acpChatComposerActions: wi,
  acpChatComposerAttachBtn: Si,
  acpChatComposerSend: Ci,
  acpChatComposerCancel: vi,
  acpComposerPalette: yi
};
function ki(a, e) {
  const t = a.slice(0, e), s = t.lastIndexOf("/");
  if (s === -1 || s > 0 && t[s - 1] !== " ") return null;
  const o = t.slice(s + 1);
  return o.includes(" ") ? null : { query: o, slashIndex: s };
}
function Ti(a) {
  return a < 1024 ? `${a} B` : a < 1024 * 1024 ? `${(a / 1024).toFixed(1)} KB` : `${(a / (1024 * 1024)).toFixed(1)} MB`;
}
async function Ye(a) {
  return new Promise((e, t) => {
    const s = new FileReader();
    s.onload = () => e(s.result.split(",")[1]), s.onerror = t, s.readAsDataURL(a);
  });
}
async function Ni(a, e, t) {
  const s = [];
  for (const o of e) {
    const { file: c } = o;
    if (c.type.startsWith("image/")) {
      const r = await Ye(c);
      s.push({
        type: "image",
        data: r,
        mimeType: c.type,
        uri: `file://${c.name}`,
        _meta: null,
        annotations: null
      });
    } else if (t != null && t.embeddedContext) {
      const r = await Ye(c);
      s.push({
        type: "resource",
        resource: {
          blob: r,
          uri: `file://${c.name}`,
          mimeType: c.type || void 0
        },
        _meta: null,
        annotations: null
      });
    } else
      s.push({
        type: "resource_link",
        uri: `file://${c.name}`,
        name: c.name,
        mimeType: c.type || void 0,
        size: c.size,
        _meta: null,
        annotations: null
      });
  }
  return a.trim() && s.push({ type: "text", text: a, _meta: null, annotations: null }), s;
}
function Di({ sessionId: a, isStreaming: e, availableCommands: t, editText: s, onEditTextConsumed: o }) {
  const [c, r] = $(""), [i, l] = $(0), [p, _] = $([]), { send: m, cancel: w } = jc(a), f = K((L) => {
    var A;
    if (a)
      for (const [, de] of L.workspaces) {
        const X = de.sessions.get(a);
        if (X) {
          const ne = L.agents.get(X.agentId);
          return (A = ne == null ? void 0 : ne.capabilities) == null ? void 0 : A.promptCapabilities;
        }
      }
  }), d = V(null), b = V(null), { t: v } = B(), [y, C] = $(!1), S = Z(() => {
    var A;
    if (!t || t.length === 0) return null;
    const L = ((A = d.current) == null ? void 0 : A.selectionStart) ?? c.length;
    return ki(c, L);
  }, [c, t]), h = S !== null && !y, P = Z(() => {
    if (!S || !S.query) return t ?? [];
    const L = S.query.toLowerCase();
    return (t ?? []).filter(
      (A) => A.name.toLowerCase().includes(L) || A.description.toLowerCase().includes(L)
    );
  }, [t, S]), k = g(() => {
    l(0), C(!0);
  }, []), T = g(
    (L) => {
      var Ue;
      if (!S) return;
      const A = c.slice(0, S.slashIndex), de = ((Ue = d.current) == null ? void 0 : Ue.selectionStart) ?? S.slashIndex, X = c.slice(de), ne = `/${L.name} `, we = A + ne + X;
      r(we), l(0), C(!0);
      const Se = A.length + ne.length;
      setTimeout(() => {
        const Me = d.current;
        Me && (Me.focus(), Me.setSelectionRange(Se, Se));
      }, 0);
    },
    [c, S]
  ), z = g(
    async (L) => {
      if (!L.trim() && p.length === 0 || !a || e) return;
      r("");
      const A = await Ni(L, p, f);
      _([]), await m(A);
    },
    [a, e, p, m, f]
  ), ee = g(async () => {
    await z(c);
  }, [c, z]), N = g(
    async (L) => {
      var we;
      if (!S) return;
      const A = c.slice(0, S.slashIndex), de = ((we = d.current) == null ? void 0 : we.selectionStart) ?? S.slashIndex, X = c.slice(de), ne = A + `/${L.name} ` + X;
      l(0), await z(ne);
    },
    [c, S, z]
  ), M = g(
    (L) => {
      if (h)
        switch (L.key) {
          case "ArrowDown":
            L.preventDefault(), l((A) => Math.min(A + 1, P.length - 1));
            return;
          case "ArrowUp":
            L.preventDefault(), l((A) => Math.max(A - 1, 0));
            return;
          case "Enter":
            if (P[i]) {
              L.preventDefault(), N(P[i]);
              return;
            }
            break;
          case "Escape":
            L.preventDefault(), k();
            return;
          case "Tab":
            if (P[i]) {
              L.preventDefault(), T(P[i]);
              return;
            }
            break;
        }
      L.key === "Enter" && (L.ctrlKey || L.metaKey) || L.key === "Enter" && !h && (L.preventDefault(), ee());
    },
    [h, P, i, T, N, k, ee]
  ), G = g(() => {
    w();
  }, [w]), D = g(() => {
    var L;
    (L = b.current) == null || L.click();
  }, []), R = g((L) => {
    const A = Array.from(L.target.files ?? []);
    if (A.length === 0) return;
    const de = A.map((X) => ({
      file: X,
      previewUrl: (X.type.startsWith("image/"), null)
    }));
    _((X) => [...X, ...de]);
    for (const X of de)
      if (X.file.type.startsWith("image/")) {
        const ne = new FileReader();
        ne.onload = () => {
          _(
            (we) => we.map(
              (Se) => Se.file === X.file ? { ...Se, previewUrl: ne.result } : Se
            )
          );
        }, ne.readAsDataURL(X.file);
      }
    L.target.value = "";
  }, []), J = g((L) => {
    _((A) => A.filter((de, X) => X !== L));
  }, []), ge = V(S == null ? void 0 : S.query);
  (S == null ? void 0 : S.query) !== ge.current && (ge.current = S == null ? void 0 : S.query, i !== 0 && l(0));
  const Te = (c.trim().length > 0 || p.length > 0) && !!a;
  return H(() => {
    s != null && (r(s), o == null || o(), setTimeout(() => {
      const L = d.current;
      L && (L.focus(), L.setSelectionRange(s.length, s.length));
    }, 0));
  }, [s]), /* @__PURE__ */ u("div", { className: Y.acpChatComposer, children: [
    h && /* @__PURE__ */ n(
      ri,
      {
        inline: !0,
        open: !0,
        query: S.query,
        activeIndex: i,
        commands: t,
        onSelect: T,
        onClose: k,
        className: Y.acpComposerPalette
      }
    ),
    /* @__PURE__ */ n("div", { className: Y.acpChatComposerForm, children: /* @__PURE__ */ u("div", { className: Y.acpChatComposerBody, children: [
      p.length > 0 && /* @__PURE__ */ n("div", { className: Y.acpChatComposerFileList, children: p.map((L, A) => /* @__PURE__ */ u("div", { className: Y.acpChatComposerFileChip, children: [
        L.previewUrl ? /* @__PURE__ */ n("img", { src: L.previewUrl, alt: L.file.name, className: Y.acpChatComposerFileThumb }) : /* @__PURE__ */ n("span", { className: Y.acpChatComposerFileThumb, children: /* @__PURE__ */ n(ye, {}) }),
        /* @__PURE__ */ n("span", { className: Y.acpChatComposerFileName, children: L.file.name }),
        /* @__PURE__ */ n("span", { className: Y.acpChatComposerFileSize, children: Ti(L.file.size) }),
        /* @__PURE__ */ n(
          "button",
          {
            className: Y.acpChatComposerFileRemove,
            onClick: () => J(A),
            "aria-label": v("composer.removeFileAriaLabel"),
            children: /* @__PURE__ */ n(ze, {})
          }
        )
      ] }, `${L.file.name}-${A}`)) }),
      /* @__PURE__ */ n(
        "textarea",
        {
          ref: d,
          className: Y.acpChatComposerInput,
          placeholder: v("composer.placeholder"),
          value: c,
          onChange: (L) => {
            r(L.target.value), l(0), C(!1);
          },
          onKeyDown: M,
          onBlur: () => h && k(),
          rows: 1,
          disabled: !a,
          "aria-label": v("composer.ariaLabel")
        }
      ),
      /* @__PURE__ */ u("div", { className: Y.acpChatComposerActions, children: [
        /* @__PURE__ */ n(
          "input",
          {
            ref: b,
            type: "file",
            multiple: !0,
            hidden: !0,
            onChange: R
          }
        ),
        /* @__PURE__ */ n(
          "button",
          {
            className: Y.acpChatComposerAttachBtn,
            onClick: D,
            disabled: !a,
            "aria-label": v("composer.attachFileAriaLabel"),
            title: v("composer.attachFile"),
            children: /* @__PURE__ */ n(gn, {})
          }
        ),
        e ? /* @__PURE__ */ n(
          "button",
          {
            className: Y.acpChatComposerCancel,
            onClick: G,
            "aria-label": v("composer.cancelAriaLabel"),
            title: v("composer.cancel"),
            children: /* @__PURE__ */ n(hn, {})
          }
        ) : /* @__PURE__ */ n(
          "button",
          {
            className: Y.acpChatComposerSend,
            onClick: ee,
            disabled: !Te,
            "aria-label": v("composer.sendAriaLabel"),
            title: v("composer.send"),
            children: /* @__PURE__ */ n(fn, {})
          }
        )
      ] })
    ] }) })
  ] });
}
function Li() {
  const { t: a } = B();
  return /* @__PURE__ */ u("div", { className: x.acpStreamingIndicator, "aria-label": a("streaming.ariaLabel"), role: "status", children: [
    /* @__PURE__ */ n("span", { children: a("streaming.generating") }),
    /* @__PURE__ */ u("span", { className: x.acpStreamingIndicatorDots, children: [
      /* @__PURE__ */ n("span", { className: x.acpStreamingIndicatorDot }),
      /* @__PURE__ */ n("span", { className: x.acpStreamingIndicatorDot }),
      /* @__PURE__ */ n("span", { className: x.acpStreamingIndicatorDot })
    ] })
  ] });
}
const Pi = "_acp-usage-bar_1futc_2", Ii = "_acp-usage-bar__ring_1futc_8", $i = "_acp-usage-bar__ringTrack_1futc_13", Ai = "_acp-usage-bar__ringFill_1futc_20", Vi = "_acp-usage-bar__ringFillLow_1futc_24", Mi = "_acp-usage-bar__ringFillMedium_1futc_27", Fi = "_acp-usage-bar__ringFillHigh_1futc_30", xi = "_acp-usage-bar__tooltip_1futc_34", Bi = "_acp-usage-bar__text_1futc_60", Ei = "_acp-usage-bar__textSep_1futc_67", Ri = "_acp-usage-bar__cost_1futc_72", ce = {
  acpUsageBar: Pi,
  acpUsageBarRing: Ii,
  acpUsageBarRingTrack: $i,
  acpUsageBarRingFill: Ai,
  acpUsageBarRingFillLow: Vi,
  acpUsageBarRingFillMedium: Mi,
  acpUsageBarRingFillHigh: Fi,
  acpUsageBarTooltip: xi,
  acpUsageBarText: Bi,
  acpUsageBarTextSep: Ei,
  acpUsageBarCost: Ri
};
function Ie(a) {
  return a >= 1e6 ? `${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}K` : String(a);
}
const Be = 9, Ze = 2 * Math.PI * Be, le = 24;
function zi({ sessionId: a }) {
  const { usage: e } = Le(a), { t } = B();
  if (!a || !e) return null;
  const s = e.size > 0 ? Math.min(e.used / e.size * 100, 100) : 0, o = Ze * (1 - s / 100), c = s > 80 ? ce.acpUsageBarRingFillHigh : s > 50 ? ce.acpUsageBarRingFillMedium : ce.acpUsageBarRingFillLow;
  return /* @__PURE__ */ u(
    "div",
    {
      className: ce.acpUsageBar,
      role: "meter",
      "aria-valuenow": Math.round(s),
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-label": t("usageBar.ariaLabel", { used: Ie(e.used), total: Ie(e.size) }),
      children: [
        /* @__PURE__ */ u(
          "svg",
          {
            className: ce.acpUsageBarRing,
            width: le,
            height: le,
            viewBox: `0 0 ${le} ${le}`,
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ n(
                "circle",
                {
                  className: ce.acpUsageBarRingTrack,
                  cx: le / 2,
                  cy: le / 2,
                  r: Be,
                  fill: "none",
                  strokeWidth: "1.5"
                }
              ),
              /* @__PURE__ */ n(
                "circle",
                {
                  className: `${ce.acpUsageBarRingFill} ${c}`,
                  cx: le / 2,
                  cy: le / 2,
                  r: Be,
                  fill: "none",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeDasharray: Ze,
                  strokeDashoffset: o,
                  transform: `rotate(-90 ${le / 2} ${le / 2})`
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ u("div", { className: ce.acpUsageBarTooltip, children: [
          /* @__PURE__ */ u("span", { className: ce.acpUsageBarText, children: [
            Ie(e.used),
            /* @__PURE__ */ n("span", { className: ce.acpUsageBarTextSep, children: "/" }),
            Ie(e.size)
          ] }),
          e.cost && /* @__PURE__ */ u("span", { className: ce.acpUsageBarCost, children: [
            e.cost.currency,
            e.cost.amount.toFixed(2)
          ] })
        ] })
      ]
    }
  );
}
const Oi = "_acp-select_18nh8_1", Hi = "_acp-select--disabled_18nh8_5", Wi = "_acp-select-trigger_18nh8_10", Ui = "_acp-select-trigger--open_18nh8_35", qi = "_acp-select-trigger--borderless_18nh8_39", Gi = "_acp-select-value_18nh8_52", ji = "_acp-select-placeholder_18nh8_59", Ki = "_acp-select-chevron_18nh8_63", Xi = "_acp-select-chevron--open_18nh8_74", Ji = "_acp-select-popover_18nh8_78", Qi = "_acp-select-popover--top_18nh8_91", Yi = "_acp-select-group_18nh8_116", Zi = "_acp-select-group-label_18nh8_122", er = "_acp-select-option_18nh8_132", ar = "_acp-select-option--focused_18nh8_145", nr = "_acp-select-option--selected_18nh8_148", tr = "_acp-select-option-label_18nh8_152", sr = "_acp-select-check_18nh8_159", O = {
  acpSelect: Oi,
  acpSelectDisabled: Hi,
  acpSelectTrigger: Wi,
  acpSelectTriggerOpen: Ui,
  acpSelectTriggerBorderless: qi,
  acpSelectValue: Gi,
  acpSelectPlaceholder: ji,
  acpSelectChevron: Ki,
  acpSelectChevronOpen: Xi,
  acpSelectPopover: Ji,
  acpSelectPopoverTop: Qi,
  acpSelectGroup: Yi,
  acpSelectGroupLabel: Zi,
  acpSelectOption: er,
  acpSelectOptionFocused: ar,
  acpSelectOptionSelected: nr,
  acpSelectOptionLabel: tr,
  acpSelectCheck: sr
};
function or(a) {
  const e = [];
  for (const t of a)
    if ("options" in t)
      for (const s of t.options)
        e.push({ value: s.value, label: s.label, groupLabel: t.label });
    else
      e.push({ value: t.value, label: t.label });
  return e;
}
function cr(a) {
  return "options" in a;
}
const ea = 4, $e = 240, aa = 8;
function ir({
  options: a,
  value: e,
  onChange: t,
  placeholder: s,
  disabled: o,
  borderless: c,
  className: r,
  "aria-label": i,
  id: l
}) {
  const [p, _] = $(!1), [m, w] = $(-1), [f, d] = $("bottom"), [b, v] = $({}), y = V(null), C = V(null), S = V(null), h = Z(() => or(a), [a]), P = Z(() => {
    const N = h.find((M) => M.value === e);
    return (N == null ? void 0 : N.label) ?? s ?? "";
  }, [h, e, s]);
  Ta(() => {
    if (!p || !C.current) return;
    const N = C.current.getBoundingClientRect(), M = window.innerHeight, G = M - N.bottom - aa, D = N.top - aa;
    let R = "bottom", J = $e;
    G < $e && D > G ? (R = "top", J = Math.min($e, D)) : J = Math.min($e, G), d(R);
    const ge = N.width;
    v(R === "bottom" ? {
      position: "fixed",
      top: N.bottom + ea,
      left: N.left,
      minWidth: ge,
      maxHeight: J
    } : {
      position: "fixed",
      bottom: M - N.top + ea,
      left: N.left,
      minWidth: ge,
      maxHeight: J
    });
  }, [p]), H(() => {
    if (!p) return;
    const N = (M) => {
      var G, D;
      (G = y.current) != null && G.contains(M.target) || (D = S.current) != null && D.contains(M.target) || _(!1);
    };
    return document.addEventListener("mousedown", N), () => document.removeEventListener("mousedown", N);
  }, [p]), H(() => {
    if (!p || m < 0 || !S.current) return;
    const N = S.current.querySelectorAll('[role="option"]');
    N[m] && N[m].scrollIntoView({ block: "nearest" });
  }, [p, m]);
  const k = g(
    (N) => {
      var M, G;
      switch (N.key) {
        case "ArrowDown":
          N.preventDefault(), p ? w((D) => (D + 1) % h.length) : (_(!0), w(0));
          break;
        case "ArrowUp":
          N.preventDefault(), p && w((D) => D <= 0 ? h.length - 1 : D - 1);
          break;
        case "Enter":
        case " ":
          N.preventDefault(), p && m >= 0 ? (t(h[m].value), _(!1), (M = C.current) == null || M.focus()) : (_(!0), w(h.findIndex((D) => D.value === e)));
          break;
        case "Escape":
          N.preventDefault(), _(!1), (G = C.current) == null || G.focus();
          break;
        case "Tab":
          _(!1);
          break;
      }
    },
    [p, m, h, t, e]
  ), T = g(
    (N) => {
      var M;
      t(N), _(!1), (M = C.current) == null || M.focus();
    },
    [t]
  ), z = g(() => {
    o || _((N) => {
      if (!N) {
        const M = h.findIndex((G) => G.value === e);
        w(M >= 0 ? M : 0);
      }
      return !N;
    });
  }, [o, h, e]), ee = p && /* @__PURE__ */ n(
    "div",
    {
      ref: S,
      className: `${O.acpSelectPopover}${f === "top" ? ` ${O.acpSelectPopoverTop}` : ""}`,
      style: b,
      role: "listbox",
      tabIndex: -1,
      children: a.map((N, M) => {
        if (cr(N))
          return /* @__PURE__ */ u("div", { className: O.acpSelectGroup, role: "group", "aria-label": N.label, children: [
            /* @__PURE__ */ n("div", { className: O.acpSelectGroupLabel, children: N.label }),
            N.options.map((J) => {
              const ge = h.findIndex((A) => A.value === J.value), Te = J.value === e, L = ge === m;
              return /* @__PURE__ */ u(
                "div",
                {
                  className: `${O.acpSelectOption}${Te ? ` ${O.acpSelectOptionSelected}` : ""}${L ? ` ${O.acpSelectOptionFocused}` : ""}`,
                  role: "option",
                  "aria-selected": Te,
                  onClick: () => T(J.value),
                  onMouseEnter: () => w(ge),
                  children: [
                    /* @__PURE__ */ n("span", { className: O.acpSelectOptionLabel, children: J.label }),
                    Te && /* @__PURE__ */ n("span", { className: O.acpSelectCheck, "aria-hidden": "true", children: "✓" })
                  ]
                },
                J.value
              );
            })
          ] }, M);
        const G = h.findIndex((J) => J.value === N.value), D = N.value === e, R = G === m;
        return /* @__PURE__ */ u(
          "div",
          {
            className: `${O.acpSelectOption}${D ? ` ${O.acpSelectOptionSelected}` : ""}${R ? ` ${O.acpSelectOptionFocused}` : ""}`,
            role: "option",
            "aria-selected": D,
            onClick: () => T(N.value),
            onMouseEnter: () => w(G),
            children: [
              /* @__PURE__ */ n("span", { className: O.acpSelectOptionLabel, children: N.label }),
              D && /* @__PURE__ */ n("span", { className: O.acpSelectCheck, "aria-hidden": "true", children: "✓" })
            ]
          },
          N.value
        );
      })
    }
  );
  return /* @__PURE__ */ u(
    "div",
    {
      ref: y,
      className: `${O.acpSelect}${o ? ` ${O.acpSelectDisabled}` : ""}${r ? ` ${r}` : ""}`,
      children: [
        /* @__PURE__ */ u(
          "button",
          {
            ref: C,
            id: l,
            type: "button",
            className: `${O.acpSelectTrigger}${p ? ` ${O.acpSelectTriggerOpen}` : ""}${c ? ` ${O.acpSelectTriggerBorderless}` : ""}`,
            onClick: z,
            onKeyDown: k,
            role: "combobox",
            "aria-expanded": p,
            "aria-label": i,
            "aria-haspopup": "listbox",
            disabled: o,
            tabIndex: 0,
            children: [
              /* @__PURE__ */ n("span", { className: `${O.acpSelectValue}${h.some((N) => N.value === e) ? "" : ` ${O.acpSelectPlaceholder}`}`, children: P }),
              /* @__PURE__ */ n("span", { className: `${O.acpSelectChevron}${p ? ` ${O.acpSelectChevronOpen}` : ""}`, "aria-hidden": "true" })
            ]
          }
        ),
        Cn(ee, document.body)
      ]
    }
  );
}
const rr = "_acp-session-config-panel_1yzcb_1", lr = "_acp-session-config-item_1yzcb_18", pr = "_acp-session-config-description_1yzcb_28", dr = "_acp-session-config-toggle_1yzcb_35", ur = "_acp-session-config-switch_1yzcb_40", mr = "_acp-session-config-switch--on_1yzcb_59", _r = "_acp-session-config-switch-knob_1yzcb_67", fe = {
  acpSessionConfigPanel: rr,
  acpSessionConfigItem: lr,
  acpSessionConfigDescription: pr,
  acpSessionConfigToggle: dr,
  acpSessionConfigSwitch: ur,
  acpSessionConfigSwitchOn: mr,
  acpSessionConfigSwitchKnob: _r
};
function gr(a) {
  return a.length > 0 && "options" in a[0];
}
function hr(a) {
  return gr(a) ? a.map((e) => ({
    label: e.name,
    options: e.options.map((t) => ({ value: t.value, label: t.name }))
  })) : a.map((e) => ({ value: e.value, label: e.name }));
}
function fr({ sessionId: a }) {
  const { configOptions: e } = Le(a), { getClient: t } = ke();
  if (!a || e.length === 0) return null;
  const s = se.getState();
  let o;
  for (const [, i] of s.workspaces) {
    const l = i.sessions.get(a);
    if (l) {
      o = l.agentId;
      break;
    }
  }
  const c = o ? t(o) : null, r = async (i, l) => {
    !c || !a || await Wa(c, a, i, l);
  };
  return /* @__PURE__ */ n("div", { className: fe.acpSessionConfigPanel, children: e.map((i) => /* @__PURE__ */ u("div", { className: fe.acpSessionConfigItem, children: [
    i.type === "boolean" ? /* @__PURE__ */ n("div", { className: fe.acpSessionConfigToggle, children: /* @__PURE__ */ n(
      "button",
      {
        id: `config-${i.id}`,
        role: "switch",
        "aria-checked": i.currentValue,
        "aria-label": i.name,
        className: `${fe.acpSessionConfigSwitch} ${i.currentValue ? fe.acpSessionConfigSwitchOn : ""}`,
        onClick: () => r(i.id, !i.currentValue),
        children: /* @__PURE__ */ n("span", { className: fe.acpSessionConfigSwitchKnob })
      }
    ) }) : /* @__PURE__ */ n(
      ir,
      {
        id: `config-${i.id}`,
        options: hr(i.options),
        value: i.currentValue,
        onChange: (l) => r(i.id, l),
        "aria-label": i.name,
        borderless: !0
      }
    ),
    i.description && /* @__PURE__ */ n("span", { className: fe.acpSessionConfigDescription, children: i.description })
  ] }, i.id)) });
}
function br(a) {
  const e = [];
  let t = null;
  for (const s of a)
    s.role === "user" ? (t && e.push(t), t = { userMessage: s, agentMessages: [] }) : (t || (t = { agentMessages: [] }), t.agentMessages.push(s));
  return t && (t.userMessage || t.agentMessages.length > 0) && e.push(t), e;
}
function El({ sessionId: a, onNavigateFile: e }) {
  const { messages: t, isStreaming: s, plan: o, availableCommands: c } = Le(a), r = K((h) => {
    if (!a) return null;
    for (const P of h.workspaces.values()) {
      const k = P.sessions.get(a);
      if (k) return k.title;
    }
    return null;
  }), i = V(null), [l, p] = $(!0), { t: _ } = B(), [m, w] = $(void 0), f = Z(() => br(t), [t]), d = g((h) => {
    w(h);
  }, []), b = g((h) => {
    p(h);
  }, []), v = g(() => {
    var h;
    (h = i.current) == null || h.scrollToIndex({ index: "LAST", align: "end", behavior: s ? "auto" : "smooth" });
  }, [s]), y = g(
    (h) => s ? "smooth" : "auto",
    [s]
  ), C = g(
    (h, P) => {
      var T, z;
      return ((T = P.userMessage) == null ? void 0 : T.id) ?? ((z = P.agentMessages[0]) == null ? void 0 : z.id) ?? `round-${h}`;
    },
    []
  ), S = g(
    (h, P) => {
      const k = h === f.length - 1;
      return /* @__PURE__ */ n("div", { className: x.acpVirtuosoItem, children: /* @__PURE__ */ u("div", { className: x.acpRound, children: [
        P.userMessage && /* @__PURE__ */ n(Gc, { message: P.userMessage, onEdit: d }),
        P.agentMessages.length > 0 && /* @__PURE__ */ n(
          Vc,
          {
            sessionId: a,
            messages: P.agentMessages,
            isStreaming: k && s,
            onNavigateFile: e
          }
        ),
        k && s && /* @__PURE__ */ n(Li, {})
      ] }) });
    },
    [f.length, s, d, e]
  );
  return a ? /* @__PURE__ */ u("div", { className: x.acpChatView, children: [
    /* @__PURE__ */ n("div", { className: x.acpChatHeader, children: /* @__PURE__ */ n("span", { className: x.acpChatHeaderTitle, children: r || _("chat.title") }) }),
    /* @__PURE__ */ u("div", { className: x.acpMessageListWrapper, children: [
      /* @__PURE__ */ n(
        Sn,
        {
          ref: i,
          className: x.acpMessageList,
          data: f,
          computeItemKey: C,
          itemContent: S,
          followOutput: y,
          atBottomStateChange: b,
          initialTopMostItemIndex: { index: "LAST", align: "end" }
        }
      ),
      !l && /* @__PURE__ */ n(
        "button",
        {
          className: x.acpScrollToBottom,
          onClick: v,
          "aria-label": _("chat.scrollToBottom"),
          type: "button",
          children: /* @__PURE__ */ n("span", { className: x.acpScrollToBottomArrow })
        }
      )
    ] }),
    /* @__PURE__ */ u("div", { className: x.acpChatBottom, children: [
      o.some((h) => h.status !== "completed") && /* @__PURE__ */ n(Ca, { entries: o, isStreaming: s }),
      /* @__PURE__ */ n(
        Di,
        {
          sessionId: a,
          isStreaming: s,
          availableCommands: c,
          editText: m,
          onEditTextConsumed: () => w(void 0)
        }
      ),
      /* @__PURE__ */ u("div", { className: x.acpChatFooter, children: [
        /* @__PURE__ */ n(fr, { sessionId: a }),
        /* @__PURE__ */ n(zi, { sessionId: a })
      ] })
    ] })
  ] }) : /* @__PURE__ */ n("div", { className: x.acpChatView, children: /* @__PURE__ */ n("div", { className: x.acpChatEmpty, children: _("chat.emptyState") }) });
}
function wr(a) {
  const { pendingPermissions: e } = Le(a), t = g((o, c) => {
    Ua(o, c);
  }, []), s = g((o) => {
    qa(o);
  }, []);
  return {
    pendingPermissions: e,
    currentRequest: e[0] ?? null,
    respond: t,
    deny: s
  };
}
const Sr = "_acp-permission-dialog-overlay_aygh8_1", Cr = "_acp-permission-dialog_aygh8_1", vr = "_acp-permission-dialog__title_aygh8_24", yr = "_acp-permission-dialog__desc_aygh8_30", kr = "_acp-permission-dialog__tool_aygh8_36", Tr = "_acp-permission-dialog__tool-name_aygh8_43", Nr = "_acp-permission-dialog__tool-args_aygh8_49", Dr = "_acp-permission-dialog__actions_aygh8_59", Lr = "_acp-permission-dialog__btn_aygh8_64", Pr = "_acp-permission-dialog__btn--deny_aygh8_77", Ir = "_acp-permission-dialog__btn--allow_aygh8_87", ie = {
  acpPermissionDialogOverlay: Sr,
  acpPermissionDialog: Cr,
  acpPermissionDialogTitle: vr,
  acpPermissionDialogDesc: yr,
  acpPermissionDialogTool: kr,
  acpPermissionDialogToolName: Tr,
  acpPermissionDialogToolArgs: Nr,
  acpPermissionDialogActions: Dr,
  acpPermissionDialogBtn: Lr,
  acpPermissionDialogBtnDeny: Pr,
  acpPermissionDialogBtnAllow: Ir
};
function Rl({ sessionId: a }) {
  const { currentRequest: e, respond: t } = wr(a), s = V(null), { t: o } = B();
  if (H(() => {
    e && s.current && s.current.focus();
  }, [e]), !e || !a) return null;
  const c = (i) => i === "allow_once" || i === "allow_always", r = e.options.find((i) => c(i.kind));
  return /* @__PURE__ */ n("div", { className: ie.acpPermissionDialogOverlay, role: "dialog", "aria-modal": "true", "aria-label": o("permission.ariaLabel"), children: /* @__PURE__ */ u("div", { className: ie.acpPermissionDialog, ref: s, tabIndex: -1, children: [
    /* @__PURE__ */ n("h3", { className: ie.acpPermissionDialogTitle, children: o("permission.title") }),
    /* @__PURE__ */ n("p", { className: ie.acpPermissionDialogDesc, children: o("permission.description") }),
    /* @__PURE__ */ u("div", { className: ie.acpPermissionDialogTool, children: [
      /* @__PURE__ */ n("div", { className: ie.acpPermissionDialogToolName, children: e.toolCall.title }),
      e.toolCall.rawInput != null && /* @__PURE__ */ n("pre", { className: ie.acpPermissionDialogToolArgs, children: JSON.stringify(e.toolCall.rawInput, null, 2) })
    ] }),
    /* @__PURE__ */ n("div", { className: ie.acpPermissionDialogActions, children: e.options.map((i) => /* @__PURE__ */ n(
      "button",
      {
        className: `${ie.acpPermissionDialogBtn} ${c(i.kind) ? ie.acpPermissionDialogBtnAllow : ie.acpPermissionDialogBtnDeny}`,
        onClick: () => t(a, i.optionId),
        autoFocus: i.optionId === (r == null ? void 0 : r.optionId),
        children: i.name
      },
      i.optionId
    )) })
  ] }) });
}
const $r = "_acp-login-dialog-overlay_1bu88_1", Ar = "_acp-login-dialog_1bu88_1", Vr = "_acp-login-dialog-title_1bu88_25", Mr = "_acp-login-dialog-desc_1bu88_32", Fr = "_acp-login-dialog-error_1bu88_39", xr = "_acp-login-dialog-methods_1bu88_48", Br = "_acp-login-dialog-method_1bu88_48", Er = "_acp-login-dialog-method-name_1bu88_78", Rr = "_acp-login-dialog-method-desc_1bu88_84", zr = "_acp-login-dialog-method-tag_1bu88_90", Or = "_acp-login-dialog-env-var_1bu88_101", Hr = "_acp-login-dialog-env-var-form_1bu88_105", Wr = "_acp-login-dialog-env-var-field_1bu88_115", Ur = "_acp-login-dialog-env-var-label_1bu88_121", qr = "_acp-login-dialog-env-var-optional_1bu88_127", Gr = "_acp-login-dialog-env-var-input_1bu88_133", jr = "_acp-login-dialog-env-var-actions_1bu88_156", Kr = "_acp-login-dialog-actions_1bu88_163", Xr = "_acp-login-dialog-cancel-btn_1bu88_168", Jr = "_acp-login-dialog-confirm-btn_1bu88_190", E = {
  acpLoginDialogOverlay: $r,
  acpLoginDialog: Ar,
  acpLoginDialogTitle: Vr,
  acpLoginDialogDesc: Mr,
  acpLoginDialogError: Fr,
  acpLoginDialogMethods: xr,
  acpLoginDialogMethod: Br,
  acpLoginDialogMethodName: Er,
  acpLoginDialogMethodDesc: Rr,
  acpLoginDialogMethodTag: zr,
  acpLoginDialogEnvVar: Or,
  acpLoginDialogEnvVarForm: Hr,
  acpLoginDialogEnvVarField: Wr,
  acpLoginDialogEnvVarLabel: Ur,
  acpLoginDialogEnvVarOptional: qr,
  acpLoginDialogEnvVarInput: Gr,
  acpLoginDialogEnvVarActions: jr,
  acpLoginDialogActions: Kr,
  acpLoginDialogCancelBtn: Xr,
  acpLoginDialogConfirmBtn: Jr
}, na = 3e5;
function ta(a, e) {
  return Promise.race([
    a,
    new Promise((t, s) => setTimeout(() => s(new Error("Authentication timed out")), e))
  ]);
}
function sa(a) {
  return typeof a == "object" && a !== null && "type" in a && a.type === "env_var";
}
function zl() {
  const a = K((h) => h.pendingAuth), e = K((h) => h.agents), { getClient: t, isReady: s } = ke(), { t: o } = B(), [c, r] = $(!1), [i, l] = $(!1), [p, _] = $(null), [m, w] = $({}), f = V(!1), d = g(async (h) => {
    if (!a) return;
    const P = t(a.agentId);
    if (P) {
      f.current = !1, r(!0), l(!1);
      try {
        await ta(Ga(P, h), na);
      } catch {
        if (f.current) return;
        l(!0), r(!1);
      }
    }
  }, [a, t]), b = g(async (h) => {
    var z;
    if (!a) return;
    const P = t(a.agentId);
    if (!P) return;
    const k = e.get(a.agentId), T = (z = k == null ? void 0 : k.authMethods) == null ? void 0 : z.find((ee) => ee.id === h);
    if (!(!T || !sa(T))) {
      f.current = !1, r(!0), l(!1);
      try {
        const ee = {};
        for (const N of T.vars) {
          const M = m[N.name];
          if (!M && !N.optional)
            throw new Error(`Missing required env var: ${N.name}`);
          M && (ee[N.name] = M);
        }
        await ta(ja(P, a.agentId, h, ee), na);
      } catch {
        if (f.current) return;
        l(!0), r(!1);
      }
    }
  }, [a, t, e, m]), v = g(() => {
    f.current = !0, se.getState().clearAuthRequired(), _(null), w({});
  }, []), y = g((h, P) => {
    w((k) => ({ ...k, [h]: P }));
  }, []);
  if (!a || !s) return null;
  const C = e.get(a.agentId), S = (C == null ? void 0 : C.authMethods) ?? [];
  return /* @__PURE__ */ n("div", { className: E.acpLoginDialogOverlay, role: "dialog", "aria-modal": "true", "aria-label": o("login.ariaLabel"), children: /* @__PURE__ */ u("div", { className: E.acpLoginDialog, tabIndex: -1, children: [
    /* @__PURE__ */ n("h3", { className: E.acpLoginDialogTitle, children: o("login.title") }),
    /* @__PURE__ */ n("p", { className: E.acpLoginDialogDesc, children: o("login.description") }),
    i && /* @__PURE__ */ n("p", { className: E.acpLoginDialogError, children: o("login.error") }),
    /* @__PURE__ */ n("div", { className: E.acpLoginDialogMethods, children: S.map((h) => {
      if (sa(h)) {
        const k = p === h.id;
        return /* @__PURE__ */ n("div", { className: E.acpLoginDialogEnvVar, children: k ? /* @__PURE__ */ u("div", { className: E.acpLoginDialogEnvVarForm, children: [
          /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodName, children: h.name }),
          h.vars.map((T) => /* @__PURE__ */ u("label", { className: E.acpLoginDialogEnvVarField, children: [
            /* @__PURE__ */ u("span", { className: E.acpLoginDialogEnvVarLabel, children: [
              T.label || T.name,
              T.optional && /* @__PURE__ */ n("span", { className: E.acpLoginDialogEnvVarOptional, children: o("login.envVarOptional") })
            ] }),
            /* @__PURE__ */ n(
              "input",
              {
                type: T.secret !== !1 ? "password" : "text",
                className: E.acpLoginDialogEnvVarInput,
                value: m[T.name] || "",
                onChange: (z) => y(T.name, z.target.value),
                placeholder: o("login.envVarSecretPlaceholder", { label: T.label || T.name }),
                disabled: c
              }
            )
          ] }, T.name)),
          /* @__PURE__ */ u("div", { className: E.acpLoginDialogEnvVarActions, children: [
            /* @__PURE__ */ n(
              "button",
              {
                className: E.acpLoginDialogCancelBtn,
                onClick: () => {
                  f.current = !0, _(null), w({}), r(!1);
                },
                children: o("login.cancel")
              }
            ),
            /* @__PURE__ */ n(
              "button",
              {
                className: E.acpLoginDialogConfirmBtn,
                onClick: () => b(h.id),
                disabled: c,
                children: o(c ? "login.authenticating" : "login.authenticate")
              }
            )
          ] })
        ] }) : /* @__PURE__ */ u(
          "button",
          {
            className: E.acpLoginDialogMethod,
            onClick: () => _(h.id),
            disabled: c,
            children: [
              /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodName, children: h.name }),
              h.description && /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodDesc, children: h.description })
            ]
          }
        ) }, h.id);
      }
      const P = h.type;
      return /* @__PURE__ */ u(
        "button",
        {
          className: E.acpLoginDialogMethod,
          onClick: () => d(h.id),
          disabled: c,
          children: [
            /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodName, children: h.name }),
            h.description && /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodDesc, children: h.description }),
            P === "terminal" && /* @__PURE__ */ n("span", { className: E.acpLoginDialogMethodTag, children: o("login.methodTerminal") })
          ]
        },
        h.id
      );
    }) }),
    /* @__PURE__ */ n("div", { className: E.acpLoginDialogActions, children: /* @__PURE__ */ n(
      "button",
      {
        className: E.acpLoginDialogCancelBtn,
        onClick: v,
        children: o("login.cancel")
      }
    ) })
  ] }) });
}
function Ol(a) {
  var s, o, c;
  const t = K((r) => r.agents).get(a);
  return {
    agentId: a,
    status: (t == null ? void 0 : t.status) ?? "disconnected",
    isConnected: (t == null ? void 0 : t.status) === "connected",
    isConnecting: (t == null ? void 0 : t.status) === "connecting",
    hasError: (t == null ? void 0 : t.status) === "error",
    agentName: ((s = t == null ? void 0 : t.agentInfo) == null ? void 0 : s.title) ?? ((o = t == null ? void 0 : t.agentInfo) == null ? void 0 : o.name) ?? (t == null ? void 0 : t.name) ?? "Unknown",
    agentVersion: (c = t == null ? void 0 : t.agentInfo) == null ? void 0 : c.version
  };
}
function Qr() {
  const a = K((c) => c.agents), e = Array.from(a.values()), t = e.every((c) => c.status === "connected"), s = e.some((c) => c.status === "connecting"), o = e.some((c) => c.status === "error");
  return {
    agents: e,
    overallStatus: t ? "connected" : s ? "connecting" : o ? "error" : "disconnected"
  };
}
const Yr = "_acp-connection-status_1avmz_1", Zr = "_acp-connection-status__item_1avmz_10", el = "_acp-connection-status__dot_1avmz_15", al = "_acp-connection-status__dot--connected_1avmz_21", nl = "_acp-connection-status__dot--connecting_1avmz_25", tl = "_acp-connection-status__dot--disconnected_1avmz_30", sl = "_acp-connection-status__dot--error_1avmz_33", me = {
  acpConnectionStatus: Yr,
  acpConnectionStatusItem: Zr,
  acpConnectionStatusDot: el,
  acpConnectionStatusDotConnected: al,
  acpConnectionStatusDotConnecting: nl,
  acpConnectionStatusDotDisconnected: tl,
  acpConnectionStatusDotError: sl
}, oa = {
  connected: me.acpConnectionStatusDotConnected,
  connecting: me.acpConnectionStatusDotConnecting,
  disconnected: me.acpConnectionStatusDotDisconnected,
  error: me.acpConnectionStatusDotError
};
function Hl() {
  const { agents: a, overallStatus: e } = Qr();
  return a.length === 0 ? /* @__PURE__ */ u("div", { className: me.acpConnectionStatus, role: "status", "aria-label": "No agent connected", children: [
    /* @__PURE__ */ n("span", { className: `${me.acpConnectionStatusDot} ${oa.disconnected}` }),
    /* @__PURE__ */ n("span", { children: "disconnected" })
  ] }) : /* @__PURE__ */ n("div", { className: me.acpConnectionStatus, role: "status", "aria-label": `Agent status: ${e}`, children: a.map((t) => /* @__PURE__ */ u(
    "span",
    {
      className: me.acpConnectionStatusItem,
      title: `${t.name}: ${t.status}`,
      children: [
        /* @__PURE__ */ n("span", { className: `${me.acpConnectionStatusDot} ${oa[t.status] || ""}` }),
        /* @__PURE__ */ n("span", { children: t.name })
      ]
    },
    t.id
  )) });
}
function ca(a) {
  switch (a) {
    case "light":
      return "vs";
    case "dark":
    default:
      return "vs-dark";
  }
}
const ol = "_acp-file-viewer_cga2v_1", cl = "_acp-file-viewer__tabs_cga2v_10", il = "_acp-file-viewer__tab_cga2v_10", rl = "_acp-file-viewer__tab--active_cga2v_44", ll = "_acp-file-viewer__tab-name_cga2v_49", pl = "_acp-file-viewer__tab-close_cga2v_54", dl = "_acp-file-viewer__breadcrumb_cga2v_71", ul = "_acp-file-viewer__breadcrumb-path_cga2v_83", ml = "_acp-file-viewer__breadcrumb-sep_cga2v_92", _l = "_acp-file-viewer__breadcrumb-file_cga2v_96", gl = "_acp-file-viewer__editor_cga2v_101", hl = "_acp-file-viewer__monaco_cga2v_107", fl = "_acp-file-viewer__loading_cga2v_111", bl = "_acp-file-viewer__spinner_cga2v_122", wl = "_acp-file-viewer__error_cga2v_130", Sl = "_acp-file-viewer__error-icon_cga2v_143", U = {
  acpFileViewer: ol,
  acpFileViewerTabs: cl,
  acpFileViewerTab: il,
  acpFileViewerTabActive: rl,
  acpFileViewerTabName: ll,
  acpFileViewerTabClose: pl,
  acpFileViewerBreadcrumb: dl,
  acpFileViewerBreadcrumbPath: ul,
  acpFileViewerBreadcrumbSep: ml,
  acpFileViewerBreadcrumbFile: _l,
  acpFileViewerEditor: gl,
  acpFileViewerMonaco: hl,
  acpFileViewerLoading: fl,
  acpFileViewerSpinner: bl,
  acpFileViewerError: wl,
  acpFileViewerErrorIcon: Sl
};
let Ne = null;
function Cl() {
  return Ne || (Ne = import("monaco-editor").catch(() => {
    throw Ne = null, new Error("monaco-editor is not installed. Install it as a peer dependency.");
  }), Ne);
}
function Wl({
  openFiles: a,
  activeFile: e,
  onCloseFile: t,
  onSelectFile: s,
  revealLine: o,
  onRevealLineConsumed: c,
  className: r
}) {
  const { t: i } = B(), l = V(null), p = V(null), _ = V(null), [m, w] = $(null), [f, d] = $(null), [b, v] = $(!0), [y, C] = $("dark");
  H(() => {
    var T;
    const k = (T = l.current) == null ? void 0 : T.closest("[data-acp-theme]");
    if (k) {
      const z = k.getAttribute("data-acp-theme");
      C(z === "light" ? "light" : "dark");
    }
  }, []), H(() => {
    let k = !1;
    return v(!0), Cl().then((T) => {
      k || (w(T), v(!1));
    }).catch((T) => {
      k || (d(T.message), v(!1));
    }), () => {
      k = !0;
    };
  }, []), H(() => {
    if (!m || !l.current) return;
    const k = ca(y), T = m.editor.create(l.current, {
      readOnly: !0,
      minimap: { enabled: !1 },
      scrollBeyondLastLine: !1,
      automaticLayout: !0,
      fontSize: 13,
      fontFamily: "var(--acp-font-mono, 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace)",
      lineNumbers: "on",
      renderLineHighlight: "line",
      theme: k,
      padding: { top: 8 },
      scrollbar: {
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6
      },
      wordWrap: "on"
    });
    return p.current = T, () => {
      T.dispose(), p.current = null, _.current && (_.current.dispose(), _.current = null);
    };
  }, [m, y]), H(() => {
    p.current && p.current.updateOptions({ theme: ca(y) });
  }, [y]), H(() => {
    if (!m || !p.current || !e) return;
    if (_.current && (_.current.dispose(), _.current = null), e.loading || e.error) {
      const T = m.editor.createModel("", "plaintext");
      _.current = T, p.current.setModel(T);
      return;
    }
    const k = m.editor.createModel(e.content, e.language);
    _.current = k, p.current.setModel(k);
  }, [m, e == null ? void 0 : e.path, e == null ? void 0 : e.loading, e == null ? void 0 : e.error, e == null ? void 0 : e.content]), H(() => {
    o != null && p.current && requestAnimationFrame(() => {
      p.current && (p.current.revealLineInCenter(o), p.current.focus()), c == null || c();
    });
  }, [o, e == null ? void 0 : e.path]);
  const S = g(
    (k, T) => {
      k.stopPropagation(), t(T);
    },
    [t]
  ), h = (k) => {
    const T = k.replace(/\\/g, "/").split("/");
    return T[T.length - 1] || k;
  }, P = (k) => k.replace(/\\/g, "/").split("/").slice(0, -1).join("/") || "";
  return a.length === 0 ? null : /* @__PURE__ */ u(
    "div",
    {
      className: `${U.acpFileViewer}${r ? ` ${r}` : ""}`,
      children: [
        /* @__PURE__ */ n("div", { className: U.acpFileViewerTabs, role: "tablist", children: a.map((k) => /* @__PURE__ */ u(
          "button",
          {
            className: `${U.acpFileViewerTab}${k.path === (e == null ? void 0 : e.path) ? ` ${U.acpFileViewerTabActive}` : ""}`,
            onClick: () => s(k.path),
            role: "tab",
            "aria-selected": k.path === (e == null ? void 0 : e.path),
            title: k.path,
            children: [
              /* @__PURE__ */ n("span", { className: U.acpFileViewerTabName, children: h(k.path) }),
              /* @__PURE__ */ n(
                "span",
                {
                  className: U.acpFileViewerTabClose,
                  onClick: (T) => S(T, k.path),
                  role: "button",
                  tabIndex: 0,
                  "aria-label": `${i("fileViewer.close")} ${h(k.path)}`,
                  onKeyDown: (T) => {
                    (T.key === "Enter" || T.key === " ") && (T.preventDefault(), T.stopPropagation(), t(k.path));
                  },
                  children: /* @__PURE__ */ n(ze, {})
                }
              )
            ]
          },
          k.path
        )) }),
        e && /* @__PURE__ */ u("div", { className: U.acpFileViewerBreadcrumb, children: [
          /* @__PURE__ */ n("span", { className: U.acpFileViewerBreadcrumbPath, title: P(e.path), children: P(e.path) }),
          /* @__PURE__ */ n("span", { className: U.acpFileViewerBreadcrumbSep, children: "/" }),
          /* @__PURE__ */ n("span", { className: U.acpFileViewerBreadcrumbFile, children: h(e.path) })
        ] }),
        /* @__PURE__ */ u("div", { className: U.acpFileViewerEditor, children: [
          b && /* @__PURE__ */ u("div", { className: U.acpFileViewerLoading, children: [
            /* @__PURE__ */ n("div", { className: U.acpFileViewerSpinner }),
            /* @__PURE__ */ n("span", { children: i("fileViewer.loadingMonaco") })
          ] }),
          f && /* @__PURE__ */ u("div", { className: U.acpFileViewerError, children: [
            /* @__PURE__ */ n("span", { className: U.acpFileViewerErrorIcon, children: "⚠" }),
            /* @__PURE__ */ n("span", { children: f })
          ] }),
          (e == null ? void 0 : e.loading) && !b && /* @__PURE__ */ u("div", { className: U.acpFileViewerLoading, children: [
            /* @__PURE__ */ n("div", { className: U.acpFileViewerSpinner }),
            /* @__PURE__ */ n("span", { children: i("fileViewer.loading") })
          ] }),
          (e == null ? void 0 : e.error) && !b && /* @__PURE__ */ u("div", { className: U.acpFileViewerError, children: [
            /* @__PURE__ */ n("span", { className: U.acpFileViewerErrorIcon, children: "⚠" }),
            /* @__PURE__ */ u("span", { children: [
              i("fileViewer.error"),
              ": ",
              e.error
            ] })
          ] }),
          /* @__PURE__ */ n(
            "div",
            {
              ref: l,
              className: U.acpFileViewerMonaco,
              style: {
                display: m && e && !e.loading && !e.error && !b && !f ? "block" : "none"
              }
            }
          )
        ] })
      ]
    }
  );
}
function Ul(a) {
  return _e(ve, a ?? ((e) => e));
}
function ql(a) {
  const { pendingToolCalls: e } = Le(a);
  return {
    toolCalls: e,
    activeToolCalls: e.filter(
      (t) => t.status === "pending" || t.status === "in_progress"
    ),
    completedToolCalls: e.filter(
      (t) => t.status === "completed" || t.status === "failed"
    )
  };
}
function Gl() {
  const { getClient: a } = ke();
  g((s) => a(s), [a]);
  const e = g(async (s, o, c) => {
    const r = a(s);
    if (!r) throw new Error(`Agent ${s} not found`);
    return Ka(r, o, c);
  }, [a]), t = g(async (s, o, c) => {
    const r = a(s);
    if (!r) throw new Error(`Agent ${s} not found`);
    return Xa(r, o, c);
  }, [a]);
  return { callExtMethod: e, sendExtNotification: t };
}
const ia = {
  // JavaScript / TypeScript
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  // Web
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".sass": "scss",
  ".less": "less",
  ".vue": "html",
  ".svelte": "html",
  // Data / Config
  ".json": "json",
  ".jsonc": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "ini",
  ".ini": "ini",
  ".env": "ini",
  ".xml": "xml",
  ".svg": "xml",
  // Markdown / Docs
  ".md": "markdown",
  ".mdx": "markdown",
  ".txt": "plaintext",
  ".log": "plaintext",
  ".csv": "plaintext",
  // Shell
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",
  ".fish": "shell",
  ".bat": "bat",
  ".cmd": "bat",
  ".ps1": "powershell",
  // Languages
  ".py": "python",
  ".pyw": "python",
  ".rb": "ruby",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".swift": "swift",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".hxx": "cpp",
  ".cs": "csharp",
  ".php": "php",
  ".dart": "dart",
  ".lua": "lua",
  ".r": "r",
  ".R": "r",
  ".scala": "scala",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hs": "haskell",
  ".clj": "clojure",
  ".cljs": "clojure",
  ".ml": "ocaml",
  ".mli": "ocaml",
  ".zig": "zig",
  ".nim": "nim",
  ".v": "verilog",
  ".sv": "verilog",
  // SQL
  ".sql": "sql",
  // Docker / CI
  ".dockerfile": "dockerfile",
  // GraphQL
  ".graphql": "graphql",
  ".gql": "graphql",
  // Protobuf
  ".proto": "protobuf"
}, ra = {
  Dockerfile: "dockerfile",
  Makefile: "makefile",
  "CMakeLists.txt": "cmake",
  ".gitignore": "ini",
  ".gitattributes": "ini",
  ".editorconfig": "ini",
  Jenkinsfile: "groovy"
};
function vl(a) {
  const e = a.replace(/\\/g, "/").split("/"), t = e[e.length - 1] || "";
  if (ra[t]) return ra[t];
  const s = t.lastIndexOf(".");
  if (s >= 0) {
    const o = t.slice(s).toLowerCase();
    if (ia[o]) return ia[o];
  }
  return "plaintext";
}
function jl() {
  const { onOpenFile: a, onFileContentRead: e } = ke(), [t, s] = $([]), [o, c] = $(null), [r, i] = $(null), l = V(/* @__PURE__ */ new Set()), p = g((d, b) => {
    if (a) {
      a(d, b);
      return;
    }
    b != null && i(b), s((v) => {
      if (v.find((S) => S.path === d))
        return c(d), v;
      const C = {
        path: d,
        content: "",
        language: vl(d),
        loading: !0,
        error: null
      };
      return c(d), e && !l.current.has(d) ? (l.current.add(d), e(d).then((S) => {
        s(
          (h) => h.map(
            (P) => P.path === d ? { ...P, content: S, loading: !1 } : P
          )
        );
      }).catch((S) => {
        const h = S instanceof Error ? S.message : String(S);
        s(
          (P) => P.map(
            (k) => k.path === d ? { ...k, error: h, loading: !1 } : k
          )
        );
      }).finally(() => {
        l.current.delete(d);
      })) : e || s(
        (S) => S.map(
          (h) => h.path === d ? { ...h, error: "File reading not configured", loading: !1 } : h
        )
      ), [...v, C];
    });
  }, [a, e]), _ = g((d) => {
    s((b) => {
      const v = b.findIndex((C) => C.path === d);
      if (v === -1) return b;
      const y = b.filter((C) => C.path !== d);
      return c((C) => {
        if (C !== d) return C;
        if (y.length === 0) return null;
        const S = Math.min(v, y.length - 1);
        return y[S].path;
      }), y;
    });
  }, []), m = g((d) => {
    c(d);
  }, []), w = g(() => {
    i(null);
  }, []), f = t.find((d) => d.path === o) ?? null;
  return {
    openFiles: t,
    activeFile: f,
    openFile: p,
    closeFile: _,
    setActiveFile: m,
    revealLine: r,
    clearRevealLine: w
  };
}
export {
  fa as AcpContext,
  Fl as AcpProvider,
  Di as ChatComposer,
  El as ChatView,
  ri as CommandPalette,
  Hl as ConnectionStatus,
  co as DiffView,
  he as Dropdown,
  Vs as FileTree,
  Wl as FileViewer,
  Ml as I18nProvider,
  zl as LoginDialog,
  We as Markdown,
  Vc as MessageBubble,
  Rl as PermissionDialog,
  Ca as PlanView,
  Je as ResizeHandle,
  ir as Select,
  fr as SessionConfigPanel,
  Ss as SessionList,
  vt as SettingsMenu,
  Bl as Sidebar,
  Li as StreamingIndicator,
  po as TerminalView,
  Uo as ThoughtView,
  Mo as ToolCallCard,
  zi as UsageBar,
  xl as Workbench,
  ke as useAcpContext,
  Tn as useAcpProvider,
  K as useAcpStore,
  Qr as useAllAgentStatuses,
  Ol as useConnectionStatus,
  Gl as useExtensions,
  Nn as useFileSystemProvider,
  Cs as useFileTree,
  jl as useFileViewer,
  Jl as useI18n,
  wr as usePermission,
  jc as usePrompt,
  Xe as useResizable,
  Le as useSession,
  Ul as useSessionStore,
  He as useSessions,
  vn as useSettings,
  io as useTerminals,
  ql as useToolCalls
};
