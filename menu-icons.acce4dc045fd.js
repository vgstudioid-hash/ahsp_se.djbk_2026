// Shared page artwork: solid colour fields like the approved AHS pie chart.
// Each shape keeps its own fill; do not flatten descendants with a CSS fill rule.
export const ahsMenuIcon='<svg class="sidebar-menu-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M14 4C6.8 4 1 9.9 1 17.3S6.8 31 14.7 31c1.5 0 3-.3 4.3-.8.6-.2.8-.8.6-1.4L15 16.3V5a1 1 0 0 0-1-1Z" fill="#d96f7a" stroke="none"/><path d="m15 16.3 4.6 12.5c.2.6 0 1.2-.6 1.4-1.3.5-2.7.8-4 .8Z" fill="#b95f69" stroke="none"/><path d="M18 0c7.7.3 13.7 6.4 14 14a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1Z" fill="#d2a05f" stroke="none"/><path d="M18 17h13a1 1 0 0 1 1 1c-.4 5.9-4.1 10.9-9.4 13.1a1 1 0 0 1-1.3-.6l-4.2-12.2A1 1 0 0 1 18 17Z" fill="#6d9fc5" stroke="none"/></svg>';

const pageIcon = body => `<svg class="sidebar-menu-icon" viewBox="0 0 32 32" fill="none" stroke="none" aria-hidden="true" focusable="false">${body}</svg>`;
export const pageMenuIcons = Object.freeze({
  project: pageIcon('<path d="M4 13h24v14a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill="#d2a05f"/><path d="m2 12 12-10a3 3 0 0 1 4 0l12 10a2 2 0 0 1-2.6 3L16 5.8 4.6 15A2 2 0 0 1 2 12Z" fill="#6d9fc5"/><path d="M11 31V21a5 5 0 0 1 10 0v10Z" fill="#d96f7a"/>'),
  quantity: pageIcon('<path d="M1 7a6 6 0 0 1 6-6h8v14H1Z" fill="#c9787d"/><path d="M17 1h8a6 6 0 0 1 6 6v8H17Z" fill="#8ea675"/><path d="M1 17h14v14H7a6 6 0 0 1-6-6Z" fill="#6d9fc5"/><path d="M17 17h14v8a6 6 0 0 1-6 6h-8Z" fill="#d9b469"/><path d="M8 5v6M5 8h6m10 0h6M5.8 21.8l4.4 4.4m0-4.4-4.4 4.4m11.3.3 5-5" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/><circle cx="21.5" cy="21.5" r="1.2" fill="#fff"/><circle cx="26.5" cy="26.5" r="1.2" fill="#fff"/>'),
  recap: pageIcon('<rect x="3" y="19" width="7" height="12" rx="2" fill="#d96f7a"/><rect x="12" y="13" width="7" height="18" rx="2" fill="#d2a05f"/><rect x="21" y="6" width="8" height="25" rx="2" fill="#6d9fc5"/><path d="M3 13 13 3h-6m6 0v6" stroke="#d2a05f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
  rab: pageIcon('<rect x="1" y="1" width="13" height="11" rx="4" fill="#6d9fc5"/><rect x="17" y="1" width="14" height="19" rx="4" fill="#d2a05f"/><rect x="1" y="15" width="13" height="16" rx="4" fill="#d96f7a"/><rect x="17" y="23" width="14" height="8" rx="4" fill="#6d9fc5"/>'),
  catalog: ahsMenuIcon,
  prices: pageIcon('<path d="M2 13 20 2a4 4 0 0 1 5 1l4 7a4 4 0 0 1-1 5L9 26a4 4 0 0 1-5-1l-3-7a4 4 0 0 1 1-5Z" fill="#d96f7a"/><path d="M10 14h17a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H10a3 3 0 0 1-2-1L3 25a3 3 0 0 1 0-4l5-6a3 3 0 0 1 2-1Z" fill="#d9b469"/><circle cx="10" cy="22.5" r="3.3" fill="#1f3b2f"/><circle cx="10" cy="22.5" r="1.3" fill="#6d9fc5"/>'),
  tkdn: ahsMenuIcon,
  'tkdn-detail': ahsMenuIcon,
  'tkdn-recap': ahsMenuIcon,
  assistant: pageIcon('<path d="M6 8h17a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H9l-8 5V13a5 5 0 0 1 5-5Z" fill="#d2a05f"/><path d="M12 1h14a5 5 0 0 1 5 5v20l-7-6H12a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4Z" fill="#6d9fc5"/><g fill="#fff"><circle cx="14" cy="10.5" r="1.5"/><circle cx="19.5" cy="10.5" r="1.5"/><circle cx="25" cy="10.5" r="1.5"/></g>'),
  pustaka: pageIcon('<path d="M9 1H8a6 6 0 0 0-6 6v19a6 6 0 0 1 7-6Z" fill="#d2a05f"/><path d="M12 1h12a6 6 0 0 1 6 6v16H12Z" fill="#6d9fc5"/><path d="M20 1h5v12l-2.5-2-2.5 2Z" fill="#d96f7a"/><rect x="2" y="25" width="28" height="6" rx="3" fill="#6d9fc5"/>')
});
