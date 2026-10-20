import LoginScreen from './components/LoginScreen';
import Modal from './components/Modal';
import PageHost from './components/PageHost';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { useShell } from './store';

export default function App() {
  const { loggedIn, role, page, navSeq, modal } = useShell();

  return (
    <>
      {loggedIn ? (
        <div className="app">
          <Sidebar role={role} page={page} />
          <main className="main">
            <Topbar role={role} page={page} />
            <PageHost page={page} role={role} navSeq={navSeq} />
          </main>
        </div>
      ) : (
        <LoginScreen />
      )}
      {modal && <Modal modal={modal} />}
    </>
  );
}
