import { actions, type ModalState } from '../store';

type Props = { modal: NonNullable<ModalState> };

export default function Modal({ modal }: Props) {
  return (
    <div className="modal">
      <div className="modal-box">
        <div className="modal-head">
          <h3>{modal.title}</h3>
          <button className="btn btn-light" onClick={actions.closeModal}>
            ✕
          </button>
        </div>
        {/* key forces fresh markup on every open, matching the old innerHTML reset */}
        <div key={modal.seq} id="modalBody" dangerouslySetInnerHTML={{ __html: modal.html }} />
      </div>
    </div>
  );
}
