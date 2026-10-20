import { getNavigation, getRoles } from '../legacy/engine';
import { actions } from '../store';

type Props = { role: string; page: string };

export default function Sidebar({ role, page }: Props) {
  const r = getRoles()[role];
  const groups = getNavigation(role);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">VLDC</div>
        <div>
          <h1>ERP Demo 10.1</h1>
          <p>Liên đoàn • Nghiệp vụ • R&D • Chuyển đổi số</p>
        </div>
      </div>
      <div className="role-box">
        <b>{r.title}</b>
        <br />
        {r.unit}
      </div>
      <div className="nav">
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="section">{label}</div>
            {items.map(([id, text]) => (
              <button
                key={id}
                id={`nav-${id}`}
                className={id === page ? 'active' : undefined}
                onClick={() => actions.show(id)}
              >
                {text}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
