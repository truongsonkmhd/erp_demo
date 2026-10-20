import { getPageMeta, getRoles, getShellBadges } from '../legacy/engine';
import { actions } from '../store';

type Props = { role: string; page: string };

const nowrap = { position: 'relative', whiteSpace: 'nowrap' } as const;
const badgeGap = { marginLeft: 5 };

export default function Topbar({ role, page }: Props) {
  const roles = getRoles();
  const r = roles[role];
  const [title, sub] = getPageMeta(page) ?? ['', ''];
  // Recomputed on every render; the store bumps badgeSeq whenever the legacy data changes.
  const badges = getShellBadges();

  return (
    <header className="top">
      <div className="title">
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <div className="user">
        <button className="btn btn-purple" style={nowrap} onClick={() => actions.show('assistant')}>
          ✦ Trợ lý AI
        </button>
        <button className="btn btn-light" style={nowrap} onClick={() => actions.show('notifications')}>
          🔔 Thông báo <span className={`badge ${badges.notices.cls}`} style={badgeGap}>{badges.notices.count}</span>
        </button>
        <button className="btn btn-light" style={nowrap} onClick={() => actions.show('calendar')}>
          📅 Lịch <span className={`badge ${badges.events.cls}`} style={badgeGap}>{badges.events.count}</span>
        </button>
        <button className="btn btn-light" style={nowrap} onClick={() => actions.show('action')}>
          ✓ Việc của tôi <span className={`badge ${badges.tasks.cls}`} style={badgeGap}>{badges.tasks.count}</span>
        </button>
        <select
          value={role}
          onChange={(e) => actions.switchRole(e.target.value)}
          style={{ width: 'auto', padding: '7px 9px' }}
        >
          {Object.entries(roles).map(([k, v]) => (
            <option key={k} value={k}>
              {v.title}
            </option>
          ))}
        </select>
        <div className="avatar">{r.avatar}</div>
        <div>
          <b style={{ fontSize: 11 }}>{r.name}</b>
          <div className="mini">{r.title}</div>
        </div>
      </div>
    </header>
  );
}
